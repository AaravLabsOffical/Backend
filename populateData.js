/**
 * PostgreSQL and File System modules
 * @requires pg
 * @requires fs
 */
const { Client } = require('pg');
const fs = require('fs');

// Database configuration with environment variables or defaults
const dbHost = process.env.POSTGRES_HOST ? process.env.POSTGRES_HOST : "db"
const dbPort = process.env.POSTGRES_PORT ? process.env.POSTGRES_PORT : 5432

/**
 * Reads and parses a JSONL file synchronously
 * @param {string} filePath - Path to the JSONL file to read
 * @returns {Array<Object>} Array of parsed JSON objects from the file
 * @throws {Error} If file reading or JSON parsing fails
 */
function readJsonlFileSync(filePath) {
    try {
        const data = [];

        // Read the file and split it by lines
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');

        // Process each line as a separate JSON object
        for (const line of lines) {
            if (line.trim() !== '') { // Skip empty lines
                try {
                    // Parse the JSON object from the current line
                    const jsonObject = JSON.parse(line);
                    data.push(jsonObject);
                } catch (error) {
                    throw new Error(`Error parsing line in ${filePath}: ${error.message}`);
                }
            }
        }

        return data;
    } catch (error) {
        throw error;
    }
}

/**
 * Generates a PostgreSQL INSERT statement from JSON data
 * @param {Array<Object>} jsonData - Array of objects containing question data
 * @returns {string} SQL INSERT statement or empty string if no valid data
 * @property {Object} data.problem - The question text
 * @property {Object} data.solution - The answer text
 * @property {Object} data.type - The question topic
 * @property {Object} data.level - The difficulty level
 */
function generateInsertStatement(jsonData) {
    const values = [];
    // Process each JSON object into a SQL value string
    for (const data of jsonData) {
        try {
            // Extract and escape single quotes in the data
            const { problem, solution, type, level } = data;
            values.push(`('${problem.replace(/'/g, "''")}', '${solution.replace(/'/g, "''")}', '${type}', '${level.charAt(6)}')`);
        } catch (error) {
            console.error(`Error processing data: ${error.message}`);
            continue;
        }
    }

    if (values.length === 0) {
        return '';
    }

    // Combine all values into a single INSERT statement
    const valuesString = values.join(',\n');
    const insertStatement = `INSERT INTO Questions (question, answer, topic, difficulty) VALUES\n${valuesString};`;

    return insertStatement;
}

// Main execution block: Read files and populate database
fs.readdir("./data/", function (error, files) {
    if (error) {
        console.error('Unable to scan directory: ' + error);
    }

    console.log("Connecting to database.")

    /**
     * PostgreSQL client configuration
     * Uses environment variables for secure connection details
     */
    const client = new Client({
        host: dbHost,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        port: dbPort,
        database: process.env.POSTGRES_DB
    })
    
    // Connect to database and initialize schema
    client.connect().then(async () => {
        console.log("Connected to database.")
        console.log(`Starting to add data.`)

        // Create or truncate Questions table using DO block
        await client.query(`DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
                    TRUNCATE TABLE Questions;
                    RAISE NOTICE 'Table "questions" truncated.';
                ELSE
                    CREATE TABLE Questions (
                        id SERIAL PRIMARY KEY,
                        question TEXT,
                        answer TEXT,
                        topic TEXT,
                        difficulty INT CHECK (difficulty BETWEEN 1 AND 5)
                    );
                    RAISE NOTICE 'Table "questions" created.';
                END IF;
            END $$;`)

        // Process each file in the data directory
        for (i = 0; i < files.length; i++) {
            // Display progress percentage
            console.log(`File ${i + 1} of ${files.length}: ${Math.round(((i + 1) / files.length) * 100)}%`)

            // Read file contents and insert into database
            await client.query(generateInsertStatement(readJsonlFileSync(`./data/${files[i]}`)))
        }

        console.log("Done! Check the data by running `npm run getAllQuestions`")
        client.end()
    })
});