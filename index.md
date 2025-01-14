# API Documentation

## System Architecture

### Dependencies
- Express.js for API server
- PostgreSQL client for database operations
- Google Generative AI for solution analysis
- CORS for cross-origin resource sharing
- Body Parser for JSON request handling

### Environment Variables
```
APIPORT          - Server port number
POSTGRES_HOST    - Database host (defaults to "db")
POSTGRES_PORT    - Database port (defaults to 5432)
POSTGRES_USER    - Database username
POSTGRES_PASSWORD - Database password
POSTGRES_DB      - Database name
APIKEY           - Google Generative AI API key
```

### Database Schema
The application expects a PostgreSQL database with a `Questions` table containing:
- question (text)
- answer (text)
- topic (text)
- difficulty (integer)

## API Endpoints

### GET '/'
Retrieves a random math question based on topic and difficulty filters.

#### Query Parameters
- `topic`: One of ["all", "algebra", "intermediate_algebra", "prealgebra", "geometry", "number_theory", "counting_probability", "precalculus"]
- `difficulty`: One of ["all", "1", "2", "3", "4", "5"]

#### Response
```
{
    "question": string,
    "answer": string,
    "topic": string,
    "difficulty": number
}
```

### POST '/aiAnalysis'
Analyzes student solutions using AI.

#### Request Body Schema
```
{
    "question": string,
    "correct_answer": string,
    "user_steps": string,
    "user_answer": string
}
```

#### Response Schema
```
{
    "stepsAnalysis": string,
    "answerAnalysis": string,
    "stepsCorrect": boolean,
    "answerCorrect": boolean,
    "readable": boolean
}
```

## AI Configuration

### Model Settings
- Model: "gemini-2.0-flash-exp"
- Response Type: application/json
- Custom response schema enforcing analysis requirements

### Analysis Criteria
The AI evaluates:
1. Correctness of solution steps
2. Readability and LaTeX syntax
3. Final answer accuracy
4. Overall solution quality

## Security Features
- SQL injection prevention through parameter validation
- No-store cache control headers
- Sanitized database query construction
- Input validation for topics and difficulties

## Topic Management
The system maintains parallel arrays for:
- Internal topic codes (acceptedTopics)
- Human-readable topic names (convertedTopics)
- Difficulty levels (acceptedDifficulties)

## Best Practices
1. Always validate input parameters
2. Use environment variables for configuration
3. Implement proper error handling
4. Follow security best practices
5. Maintain clear response formats

## Implementation Notes
- Server binds to 0.0.0.0 for container compatibility
- Database connection established before server start
- AI prompts structured for consistent analysis
- Response caching disabled for real-time data
