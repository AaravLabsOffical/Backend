const { Client } = require('pg');
const fs = require('fs');

const dbHost = process.env.POSTGRES_HOST ? process.env.POSTGRES_HOST : "db"
const dbPort = process.env.POSTGRES_PORT ? process.env.POSTGRES_PORT : 5432

function readJsonlFileSync(filePath) {
    try {
        const data = [];

        // Read the file and split it by lines.
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');

        // Go through each line as 1 line has 1 json element
        for (const line of lines) {
            if (line.trim() !== '') { // Skip empty lines
                try {
                    // Convert the data on that line into a json object
                    const jsonObject = JSON.parse(line);

                    // Add the json object to a list with all the json objects in the file
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

function generateInsertStatement(jsonData) {
    const values = [];
    // Go through the list to get each json object
    for (const data of jsonData) {
        try {
            // Make 1 line of data for the query
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

    // Turn each line of the query into 1 big query
    const valuesString = values.join(',\n');
    const insertStatement = `INSERT INTO Questions (question, answer, topic, difficulty) VALUES\n${valuesString};`;

    return insertStatement;
}

// Read each file in the data directory
fs.readdir("./data/", function (error, files) {
    if (error) {
        console.error('Unable to scan directory: ' + error);
    }

    console.log("Connecting to database.")

    const client = new Client({
        host: dbHost,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        port: dbPort,
        database: process.env.POSTGRES_DB
    })
    

    client.connect().then(async () => {
        console.log("Connected to database.")
        console.log(`Starting to add data.`)

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

        for (i = 0; i < files.length; i++) {
            // Progress update for the user
            console.log(`File ${i + 1} of ${files.length}: ${Math.round(((i + 1) / files.length) * 100)}%`)

            // Add all the questions in a file to the database
            await client.query(generateInsertStatement(readJsonlFileSync(`./data/${files[i]}`)))
        }

        console.log("Done! Check the data by running `npm run getAllQuestions`")
        client.end()
    })
});