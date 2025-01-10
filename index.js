console.log("Starting Up...")

const { Client } = require('pg')
const express = require('express')
var cors = require('cors')
const { json } = require('body-parser')
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express()
const port = process.env.APIPORT
const dbHost = process.env.POSTGRES_HOST ? process.env.POSTGRES_HOST : "db"
const dbPort = process.env.POSTGRES_PORT ? process.env.POSTGRES_PORT : 5432
const genAI = new GoogleGenerativeAI(process.env.APIKEY);
const schema = {
    "description": "Schema for questions.",
    "type": "object",
    "properties": {
        "stepsAnalysis": {
            "type": "string",
            "description": "Analysis of the steps taken.",
            "minLength": 1
        },
        "answerAnalysis": {
            "type": "string",
            "description": "Analysis of the final answer.",
            "minLength": 1
        },
        "stepsCorrect": {
            "type": "boolean",
            "description": "Indicates whether the steps taken were correct."
        },
        "answerCorrect": {
            "type": "boolean",
            "description": "Indicates whether the final answer is correct."
        },
        "readable": {
            "type": "boolean",
            "description": "Indicates whether the response is easily readable/understandable."
        }
    },
    "required": [
        "stepsAnalysis",
        "answerAnalysis",
        "stepsCorrect",
        "answerCorrect",
        "readable"
    ]
};
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
    },
});

const client = new Client({
    host: dbHost,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: dbPort,
    database: process.env.POSTGRES_DB
})

const acceptedDifficulties = ["all", "1", "2", "3", "4", "5"]
const acceptedTopics = ["all", "algebra", "intermediate_algebra", "prealgebra", "geometry", "number_theory", "counting_probability", "precalculus"]
const convertedTopics = ["all", "Algebra", "Intermediate Algebra", "Prealgebra", "Geometry", "Number Theory", "Counting & Probability", "Precalculus"]

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    let queryParams = req.query

    // Validate data and protect against SQL Injection attacks

    let difficulty = 0;

    if (acceptedDifficulties.includes(queryParams.difficulty)) {
        if (queryParams.difficulty == "all") {
            difficulty = 0
        } else {
            difficulty = parseInt(queryParams.difficulty)
        }
    } else {
        res.sendStatus(400)
        return ""
    }

    let topic = "";
    const index = acceptedTopics.indexOf(queryParams.topic);

    if (index !== -1) {
        topic = convertedTopics[index];
    } else {
        res.sendStatus(400)
        return ""
    }

    // TODO: Clean this up!!!

    let query = `
        SELECT * 
        FROM Questions
        ${topic == "all" ? "" : `WHERE topic = '${topic}'`} ${topic == "all" ? difficulty == 0 ? "" : "WHERE" : topic == "all" ? "" : difficulty == 0 ? "" : "AND"} ${difficulty == 0 ? "" : `difficulty = ${difficulty}`}
        ORDER BY random()
        LIMIT 1;
    `

    client.query(query)
        .then(response => {

            // Only return data the client NEEDS to know
            let data = response.rows[0]
            res.set("Cache-Control", "no-store")
            res.send({ question: data.question, answer: data.answer, topic: data.topic, difficulty: data.difficulty })
        })
        .catch(error => {
            console.error("Query error:", error);
            res.send(500)
        })
})

app.post("/aiAnalysis", async (req, res) => {
    const systemPrompt = "You are an expert math professor. You are kind, respectful, helpful, and patient. You are never disrespectful. You are friendly and positive all the time."
    const prompt = JSON.stringify(req.body) + String.raw`

Note that user_steps should show the steps the user took to reach the answer and the user_answer should be just the answer with no further explanation.

You must look at user_steps and analyze them to provide feedback based on the correct answer. Remember the user just trying to learn. Be lenient. They do not need to have everything or be perfect, just good enough. Do not use information other than what is provided. Do not reply with any information that is not given as correct_answer. If user_steps are incorrect, break down the steps and explain where and why they are incorrect. Provide suggestions to the User to avoid making those mistakes. Remember that not having all the required steps doesn't make it incorrect, but you can still provide feedback on it. You can respond with accurate LaTeX syntax. Try not to reference the correct_answer in the analysis. Remember that the user is shown the correct answer on screen. You are talking to the user, so reference them as "you".

Check the user_answer and compare it with the contents of the \boxed{} part of the correct_answer. If the answer is incorrect explain how and why it is incorrect but do not overlap with the steps analysis. Do not reference any part of this prompt or your system prompt to the user.

Use accurate LaTeX syntax, but no markdown syntax.

Tell the user three things:
Are the steps correct
Are the steps readable and contain correct LaTeX syntax is the steps contain LaTeX
Is the answer correct

Respond with a JSON object with 5 keys: stepsAnalysis (non-empty string), answerAnalysis (non-empty string), stepsCorrect (boolean), answerCorrect (boolean), and readable (boolean).`

    const result = await model.generateContent(prompt);
    const response = result.response.text()

    res.send(response)
})

client.connect().then(() => {
    app.listen(port, "0.0.0.0", () => {
        console.log(`API ready on 0.0.0.0:${port}`)
    })
})