import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:5001/api" : "/api")
});

export async function fetchAnalysis(url) {
  const { data } = await api.post("/analyze", { url });
  return data;
}

export async function sendChatMessage(question, transcriptText, history) {
  const { data } = await api.post("/chat", {
    question,
    transcriptText,
    history
  });
  return data;
}

export async function fetchQuizSet(transcriptText, count, difficulty) {
  const { data } = await api.post("/quiz-set", {
    transcriptText,
    count,
    difficulty
  });
  return data;
}

export async function fetchFlashcards(transcriptText, count) {
  const { data } = await api.post("/flashcards", {
    transcriptText,
    count
  });
  return data;
}
