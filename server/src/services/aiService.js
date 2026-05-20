import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

console.log("OpenRouter API Key defined:", !!process.env.OPENROUTER_API_KEY);

// Initialize OpenRouter Client
const client = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:5173", // Optional, for OpenRouter rankings
        "X-Title": "StudyTube AI", // Optional, for OpenRouter rankings
      }
    })
  : null;

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL ?? "";
let cachedModelCandidates = null;

async function getModelCandidates() {
  if (cachedModelCandidates?.length) return cachedModelCandidates;

  const configuredModel = DEFAULT_MODEL.trim();
  let discoveredFreeModels = [];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
      }
    });
    if (response.ok) {
      const payload = await response.json();
      discoveredFreeModels = (payload?.data ?? [])
        .map((model) => model?.id)
        .filter((id) => typeof id === "string" && id.includes(":free"));
    }
  } catch (error) {
    console.warn("OpenRouter model discovery failed:", error?.message ?? "unknown error");
  }

  cachedModelCandidates = Array.from(new Set([configuredModel, ...discoveredFreeModels].filter(Boolean)));
  return cachedModelCandidates;
}

function isModelSelectionError(error) {
  const status = error?.status ?? error?.response?.status;
  const message = (error?.message ?? "").toLowerCase();
  return (
    status === 404 ||
    message.includes("no endpoints found") ||
    message.includes("not a valid model id") ||
    message.includes("model is disabled")
  );
}

async function createCompletionWithRetry(messages) {
  const modelCandidates = await getModelCandidates();
  let lastError = null;

  for (const model of modelCandidates) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages
      });
      return { completion, model };
    } catch (error) {
      lastError = error;
      if (isModelSelectionError(error)) {
        console.warn(`OpenRouter model unavailable: ${model}`);
        continue;
      }
      break;
    }
  }

  throw lastError ?? new Error("OpenRouter request failed.");
}

function getTopTerms(transcriptText) {
  return Array.from(
    transcriptText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 5)
      .reduce((map, word) => map.set(word, (map.get(word) ?? 0) + 1), new Map())
      .entries()
  )
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

function buildFallbackQuiz(transcriptText, count = 5) {
  const topTerms = getTopTerms(transcriptText).slice(0, Math.max(8, count));
  const safeTerms = topTerms.length
    ? topTerms
    : ["concept", "process", "example", "framework", "insight", "strategy", "pattern", "principle"];

  return Array.from({ length: count }).map((_, i) => {
    const answer = safeTerms[i % safeTerms.length];
    const distractors = [
      safeTerms[(i + 1) % safeTerms.length],
      safeTerms[(i + 2) % safeTerms.length],
      safeTerms[(i + 3) % safeTerms.length]
    ];
    const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
    return {
      question: `Which term is emphasized as a key idea in this transcript segment?`,
      options,
      correctIndex: options.findIndex((option) => option === answer),
      explanation: `"${answer}" appears repeatedly and is treated as an important concept in context.`,
      id: `q-${i + 1}`
    };
  });
}

function buildFallbackFlashcards(transcriptText, count = 5) {
  const terms = getTopTerms(transcriptText).slice(0, Math.max(10, count));
  const safeTerms = terms.length
    ? terms
    : ["concept", "example", "strategy", "framework", "principle", "method"];

  return Array.from({ length: count }).map((_, i) => {
    const term = safeTerms[i % safeTerms.length];
    return {
      question: `What does "${term}" represent in this lesson?`,
      answer: `"${term}" appears as a key topic in the transcript and should be reviewed as a core concept.`
    };
  });
}

function normalizeQuizItems(quizItems, count) {
  if (!Array.isArray(quizItems)) throw new Error("Invalid quiz payload.");
  return quizItems.slice(0, count).map((item, index) => {
    const options = Array.isArray(item?.options) ? item.options.slice(0, 4) : [];
    if (options.length < 4) throw new Error("Quiz option count is invalid.");
    const correctIndex = Number.isInteger(item?.correctIndex) ? item.correctIndex : 0;
    const boundedCorrectIndex = correctIndex >= 0 && correctIndex < options.length ? correctIndex : 0;
    return {
      id: `q-${index + 1}`,
      question: item?.question?.trim() || `Question ${index + 1}`,
      options,
      correctIndex: boundedCorrectIndex,
      explanation: item?.explanation?.trim() || "Review the transcript context for this answer."
    };
  });
}

function normalizeFlashcards(cards, count) {
  if (!Array.isArray(cards)) throw new Error("Invalid flashcard payload.");
  return cards.slice(0, count).map((item, index) => ({
    question: item?.question?.trim() || `Flashcard question ${index + 1}`,
    answer: item?.answer?.trim() || "Review transcript context for this answer."
  }));
}

function fallbackStudyMaterial(transcriptText, fallbackReason = "unknown", fallbackMessage = "") {
  let sentences = transcriptText.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length < 5) {
    sentences = transcriptText.split(/\s+(?:so|and|but|then|now)\s+/i).filter(s => s.length > 20);
  }

  const concise = sentences.slice(0, 2).join(". ") + ".";
  const detailed = sentences.slice(0, 8).join(". ") + ".";

  const topTerms = getTopTerms(transcriptText).slice(0, 7);

  const keyPoints = topTerms.map((word, idx) => `Key concept ${idx + 1}: ${word.charAt(0).toUpperCase() + word.slice(1)} usage in context.`);
  
  const flashcards = buildFallbackFlashcards(transcriptText, 5);

  const quiz = buildFallbackQuiz(transcriptText, 5);

  return {
    conciseSummary: concise || "Study summary is currently in fallback mode because no OpenRouter API key is configured.",
    detailedExplanation: detailed || "To get high-quality analysis, please add an OPENROUTER_API_KEY to your server .env file.",
    topicOverview: topTerms.join(", ") || "General Topic Overview",
    keyPoints,
    flashcards,
    quiz,
    isFallback: true,
    fallbackReason,
    fallbackMessage
  };
}

export async function generateStudyMaterial(transcriptText) {
  if (!client) {
    return fallbackStudyMaterial(
      transcriptText,
      "missing_api_key",
      "No OPENROUTER_API_KEY found. Add it in server/.env to enable AI summaries."
    );
  }

  const prompt = `
    Analyze the following YouTube transcript and return ONLY valid JSON in this exact shape:
    {
      "conciseSummary": "A 2-3 sentence summary",
      "detailedExplanation": "A detailed 1-2 paragraph explanation",
      "topicOverview": "A comma separated list of main topics",
      "keyPoints": ["concise revision point", "another point"],
      "flashcards": [{"question":"...","answer":"..."}],
      "quiz": [{"id":"q-1","question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]
    }
    Rules:
    - Return exactly 5 flashcards and 5 quiz questions.
    - correctIndex must be the 0-based index of the correct option.
    - All fields are mandatory.

    Transcript:
    ${transcriptText.slice(0, 60000)}
  `;

  try {
    const { completion } = await createCompletionWithRetry([{ role: "user", content: prompt }]);
    return JSON.parse(extractJson(completion.choices[0].message.content));
  } catch (error) {
    const failureMessage = error?.message ?? "OpenRouter request failed.";
  const fallbackReason =
    failureMessage.toLowerCase().includes("no endpoints found") ||
    failureMessage.toLowerCase().includes("not a valid model id")
      ? "model_unavailable"
      : "openrouter_error";

    return fallbackStudyMaterial(
      transcriptText,
      fallbackReason,
      fallbackReason === "model_unavailable"
        ? "Configured model is unavailable. Set OPENROUTER_MODEL to a valid model or remove it to auto-discover free models."
        : `OpenRouter request failed: ${failureMessage}`
    );
  }
}

export async function chatWithTranscript({ question, transcriptText, history = [] }) {
  if (!client) {
    return "[API KEY MISSING] Configure OPENROUTER_API_KEY to enable AI chat.";
  }

  try {
    const { completion } = await createCompletionWithRetry([
      { role: "system", content: "You are a helpful study assistant. Answer strictly based on the provided transcript." },
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: `Transcript:\n${transcriptText.slice(0, 30000)}\n\nQuestion:\n${question}` }
    ]);
    return completion.choices[0].message.content;
  } catch (error) {
    if (isModelSelectionError(error)) {
      return "[AI Error] No valid OpenRouter model is available. Update OPENROUTER_MODEL in server/.env or remove it to auto-discover free models.";
    }
    return `[AI Error] ${error.message}`;
  }
}

export async function generateQuizSet(transcriptText, count = 5, difficulty = "medium") {
  const safeCount = Math.max(3, Math.min(15, Number(count) || 5));
  const safeDifficulty = ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "medium";

  if (!client) {
    return {
      quiz: buildFallbackQuiz(transcriptText, safeCount),
      isFallback: true
    };
  }

  const prompt = `
    Create ${safeCount} multiple-choice quiz questions from this transcript and return ONLY valid JSON.
    Expected shape:
    {
      "quiz": [{"id":"q-1","question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]
    }
    Rules:
    - Return exactly ${safeCount} questions.
    - Each question must include exactly 4 options.
    - correctIndex must be 0 to 3.
    - Focus on factual understanding from transcript only.
    - Difficulty level: ${safeDifficulty}
      - easy: direct recall, clear wording, obvious distractors
      - medium: concept understanding, moderate distractors
      - hard: nuanced reasoning, subtle distractors, deeper comprehension

    Transcript:
    ${transcriptText.slice(0, 60000)}
  `;

  try {
    const { completion } = await createCompletionWithRetry([{ role: "user", content: prompt }]);
    const parsed = JSON.parse(extractJson(completion.choices[0].message.content));
    return {
      quiz: normalizeQuizItems(parsed?.quiz, safeCount),
      isFallback: false
    };
  } catch (error) {
    console.error("Quiz set generation error:", error?.message ?? "unknown error");
    return {
      quiz: buildFallbackQuiz(transcriptText, safeCount),
      isFallback: true
    };
  }
}

export async function generateFlashcardSet(transcriptText, count = 5) {
  const safeCount = Math.max(1, Math.min(20, Number(count) || 5));

  if (!client) {
    return {
      flashcards: buildFallbackFlashcards(transcriptText, safeCount),
      isFallback: true
    };
  }

  const prompt = `
    Create ${safeCount} study flashcards from this transcript and return ONLY valid JSON.
    Expected shape:
    {
      "flashcards": [{"question":"...","answer":"..."}]
    }
    Rules:
    - Return exactly ${safeCount} flashcards.
    - Keep each question concise and revision friendly.
    - Keep answers accurate and concise.
    - Use transcript-grounded content only.

    Transcript:
    ${transcriptText.slice(0, 60000)}
  `;

  try {
    const { completion } = await createCompletionWithRetry([{ role: "user", content: prompt }]);
    const parsed = JSON.parse(extractJson(completion.choices[0].message.content));
    return {
      flashcards: normalizeFlashcards(parsed?.flashcards, safeCount),
      isFallback: false
    };
  } catch (error) {
    console.error("Flashcard generation error:", error?.message ?? "unknown error");
    return {
      flashcards: buildFallbackFlashcards(transcriptText, safeCount),
      isFallback: true
    };
  }
}

function extractJson(raw) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return raw;
  return raw.slice(start, end + 1);
}
