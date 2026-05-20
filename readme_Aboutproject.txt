=======================================================
StudyTube AI - Project Overview and Architecture Details
=======================================================

1. PROJECT OVERVIEW
-------------------------------------------------------
StudyTube AI is an AI-powered educational web application that converts YouTube educational videos into structured, interactive study materials. By simply pasting a YouTube link, the application performs a series of operations to extract the video's transcript and generate rich learning tools, including summaries, key notes, flashcards, quizzes, and even an interactive chat based on the video context.

The application follows the MERN stack paradigm but is designed with an API-first approach, meaning it can function effectively as a stateless Minimum Viable Product (MVP) using browser local storage for history, with MongoDB ready to be activated for full data persistence.

2. SYSTEM ARCHITECTURE DIAGRAM
-------------------------------------------------------
```mermaid
graph TD
    User([User]) --> |Pastes YouTube URL| Frontend[React + Vite Frontend]
    Frontend --> |POST /api/analyze| Backend[Express.js Backend]
    
    subgraph Backend Services
        Backend --> TS[Transcript Service]
        TS --> |Fetch captions| YT[YouTube]
        Backend --> AIS[AI Service]
        AIS --> |Prompt + Transcript| OR[OpenRouter / OpenAI API]
        Backend --> DB[(MongoDB Database)]
    end
    
    YT -.-> |Returns Transcript| TS
    OR -.-> |Returns JSON/Text| AIS
    
    AIS -.-> |Structured Output| Backend
    Backend -.-> |Notes, Quiz, Flashcards| Frontend
    Frontend --> |Displays UI| User
    
    User --> |Clicks Export| PDF[jsPDF Library]
    PDF -.-> |Generates PDF| User
```

3. TECH STACK & LIBRARIES
-------------------------------------------------------

### Frontend (Client-side)
The frontend is built for speed and responsiveness, utilizing modern React features.
*   **React (`react`, `react-dom`)**: Core UI library for building dynamic, component-based user interfaces. Version 19+.
*   **Vite (`vite`, `@vitejs/plugin-react`)**: A fast build tool and development server that replaces Webpack or CRA, offering instant Hot Module Replacement (HMR).
*   **Axios (`axios`)**: A promise-based HTTP client for the browser. Used to make asynchronous REST API calls to the Express backend (`/api/analyze`, `/api/chat`).
*   **jsPDF (`jspdf`)**: A client-side library to generate PDF documents. It takes the generated study notes and allows the user to export them as a downloadable PDF file.

### Backend (Server-side)
The backend acts as the orchestrator, communicating with YouTube, the AI provider, and the database.
*   **Node.js**: The JavaScript runtime environment.
*   **Express.js (`express`)**: A fast, unopinionated web framework for Node.js used to build the RESTful API endpoints.
*   **Mongoose (`mongoose`)**: An Object Data Modeling (ODM) library for MongoDB and Node.js. It manages relationships between data, provides schema validation, and translates between objects in code and the representation of those objects in MongoDB.
*   **OpenAI SDK (`openai`)**: The official Node.js library for interacting with OpenAI APIs. In this project, it is primarily configured to route requests through OpenRouter (a gateway for multiple LLMs, allowing the use of free or open-source models).
*   **YouTube Transcript (`youtube-transcript`)**: A scraping/utility library designed to fetch the closed captions/subtitles of a YouTube video without needing a heavy API key.
*   **Zod (`zod`)**: A TypeScript-first schema declaration and validation library. It is used to validate incoming request bodies and ensure the AI returns structured JSON that matches the expected format (e.g., ensuring a Quiz object has questions, options, and answers).
*   **Dotenv (`dotenv`)**: Loads environment variables from a `.env` file into `process.env`.
*   **Cors (`cors`)**: Middleware to enable Cross-Origin Resource Sharing, allowing the frontend running on a different port to communicate with the backend.
*   **Morgan (`morgan`)**: HTTP request logger middleware for Node.js, useful for debugging incoming requests in the console.

4. DIRECTORY & FILE EXPLANATION IN DETAIL
-------------------------------------------------------

### ROOT DIRECTORY
*   **`package.json`**: The root package file that orchestrates running the client and server concurrently.
*   **`README.md`**: The basic documentation containing setup instructions and project feature lists.

### `/client` DIRECTORY (Frontend)
Contains all user interface code.

*   **`client/package.json`**: Defines frontend dependencies (React, Vite, Axios, jsPDF).
*   **`client/vite.config.js`**: Configuration file for Vite. Usually specifies React plugins and server proxy settings to route `/api` calls to the backend port.
*   **`client/index.html`**: The single HTML file that mounts the React root component.
*   **`client/src/main.jsx`**: The React entry point. It imports React DOM and renders `<App />` into the `root` div in `index.html`.
*   **`client/src/App.jsx`**: The main parent component. It holds the core state of the application (e.g., current transcript, generated notes, quizzes) and renders the dashboard UI, input bars, flashcards, and quiz components.
*   **`client/src/styles.css`**: Global stylesheet containing all CSS rules, dark mode variables, and animations to ensure a rich, motion-enhanced UI.
*   **`client/src/utils/exporters.js`**: Contains utility functions to format the AI-generated JSON study data into raw Text, Markdown, or PDF format, utilizing `jspdf` to trigger a browser download.

### `/server` DIRECTORY (Backend)
Contains all business logic, API routes, and third-party service integrations.

*   **`server/package.json`**: Defines backend dependencies (Express, Mongoose, OpenAI, etc.).
*   **`server/.env`**: Stores sensitive keys (like `OPENROUTER_API_KEY`) and server configurations (like `PORT`).
*   **`server/src/index.js`**: The main entry point for the backend. It initializes the Express app, attaches middlewares (cors, express.json, morgan), mounts the API routes (e.g., `/api/analyze`), and starts the HTTP server.
*   **`server/src/db.js`**: Contains the MongoDB connection logic using Mongoose. It handles connecting to the database URI and logging connection success or failure.
*   **`server/src/models/StudySession.js`**: The Mongoose Schema definition for a "Study Session". It outlines what a study session looks like in the database (video URL, generated notes, flashcards, transcript, user ID, timestamps).
*   **`server/src/routes/studyRoutes.js`**: Defines the Express router. It maps HTTP paths to specific controller functions. For instance, mapping `POST /analyze` to the function that triggers the transcript fetch and AI generation.
*   **`server/src/services/aiService.js`**: The core intelligence module. It initializes the OpenAI client (pointing to OpenRouter), crafts complex prompts, and passes the transcript to the LLM. It parses the LLM's response into structured JSON (summary, notes, flashcards, quiz).
*   **`server/src/services/transcriptService.js`**: A wrapper around `youtube-transcript`. It takes a YouTube video ID, fetches the XML/JSON caption data, and formats it into a clean, readable string to be fed into the `aiService`.
*   **`server/src/utils/text.js`**: Helper functions for text manipulation, such as chunking large transcripts if they exceed the AI model's context window limits, or sanitizing strings.
*   **`server/src/utils/youtube.js`**: Contains regex logic to extract the exact 11-character YouTube video ID from various URL formats (e.g., `youtu.be/xxx`, `youtube.com/watch?v=xxx`).

5. HOW IT ALL WORKS TOGETHER (The Data Flow)
-------------------------------------------------------
1.  **Input:** The user opens the frontend (`App.jsx`) and pastes a YouTube URL into the input field.
2.  **Request:** The frontend uses Axios to send a `POST /api/analyze` request to the Express backend containing the URL.
3.  **URL Parsing:** The backend (`index.js` -> `studyRoutes.js`) receives the request. It uses `utils/youtube.js` to extract the video ID.
4.  **Transcript Extraction:** The backend calls `transcriptService.js`, which reaches out to YouTube servers and pulls down the text captions for that specific video ID.
5.  **AI Processing:** The raw transcript is passed to `aiService.js`. A large prompt is constructed instructing the AI (via OpenRouter) to act as a teacher. The AI analyzes the text and responds with a massive JSON object containing summaries, flashcard Q&As, and multiple-choice quizzes.
6.  **Response:** The backend sends this JSON payload back to the frontend. (If MongoDB is fully active, it also saves a record using `models/StudySession.js` via `db.js`).
7.  **Rendering:** The frontend receives the data and updates React state. The UI shifts from a loading state to a dashboard, rendering the Flashcards, the Quiz section, and the Notes using CSS defined in `styles.css`.
8.  **Export:** The user clicks "Export to PDF". The `utils/exporters.js` file takes the React state, uses `jspdf` to draw the text onto a virtual canvas, and prompts the user's browser to download the file.
