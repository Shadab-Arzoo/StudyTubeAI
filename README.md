# StudyTube AI (MERN)

StudyTube AI converts YouTube educational videos into structured study material:

- transcript extraction
- AI summary + detailed explanation
- key notes
- flashcards
- quiz with score tracking
- transcript viewer with search and timestamps
- AI chat based on transcript
- export notes to TXT / Markdown / PDF
- quick copy actions for summaries and notes
- recent analyses memory (local browser storage)
- study progress cards (word count, quiz completion, score)
- custom quiz set generator (choose question count and create new set)
- flashcard controls (generate more cards, delete cards, switch display style)
- quick review snippets from transcript lines
- focus mode and richer motion-enhanced UI

## Tech Stack

- **MongoDB** (ready for future persistence layer integration)
- **Express.js** backend API
- **React + Vite** frontend
- **Node.js** runtime

> Current scaffold is API-first and works without DB for fast MVP delivery. MongoDB can be connected next for user accounts, saved notes, and history.

## Folder Structure

```bash
studytube-ai/
  client/   # React frontend
  server/   # Express backend
```

## 1) Setup

```bash
npm install
npm --prefix server install
npm --prefix client install
```

Copy env files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Optional (for AI-generated rich outputs):

- set `OPENROUTER_API_KEY` in `server/.env`
- optional: set `OPENROUTER_MODEL` (if omitted, the server auto-tries known free models)

Without API key, the app still runs with fallback generation.

## 2) Run in Development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5001

## 3) Build Frontend

```bash
npm run build
```

## API Endpoints

- `GET /api/health`
- `POST /api/analyze`
  - body: `{ "url": "https://youtube.com/watch?v=..." }`
- `POST /api/chat`
  - body: `{ "question": "...", "transcriptText": "...", "history": [] }`

## Supported YouTube URLs

- `youtube.com/watch?v=...`
- `youtu.be/...`
