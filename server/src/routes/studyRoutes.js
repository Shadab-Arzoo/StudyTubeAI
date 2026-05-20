import express from "express";
import { z } from "zod";
import { extractVideoId } from "../utils/youtube.js";
import { fetchTranscript } from "../services/transcriptService.js";
import {
  chatWithTranscript,
  generateFlashcardSet,
  generateQuizSet,
  generateStudyMaterial
} from "../services/aiService.js";
import { StudySession } from "../models/StudySession.js";

const router = express.Router();

const analyzeSchema = z.object({
  url: z.string().min(1)
});

const chatSchema = z.object({
  question: z.string().min(1),
  transcriptText: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string()
      })
    )
    .optional()
});

const quizSetSchema = z.object({
  transcriptText: z.string().min(1),
  count: z.number().int().min(3).max(15),
  difficulty: z.enum(["easy", "medium", "hard"]).optional()
});

const flashcardSetSchema = z.object({
  transcriptText: z.string().min(1),
  count: z.number().int().min(1).max(20)
});

router.post("/analyze", async (req, res) => {
  const parsed = analyzeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please provide a valid YouTube URL." });
  }

  const videoId = extractVideoId(parsed.data.url);
  if (!videoId) {
    return res.status(400).json({
      error: "Only youtube.com/watch?v= and youtu.be/ links are supported."
    });
  }

  try {
    const { transcript, transcriptText } = await fetchTranscript(videoId);
    const studyMaterial = await generateStudyMaterial(transcriptText);
    const payload = {
      videoId,
      transcript,
      transcriptText,
      ...studyMaterial
    };

    if (process.env.MONGODB_URI) {
      await StudySession.create({
        sourceUrl: parsed.data.url,
        ...payload
      });
    }

    return res.json(payload);
  } catch (error) {
    console.error("Analysis Route Error:", error);
    const message =
      error?.message?.toLowerCase().includes("transcript")
        ? "Transcript unavailable for this video."
        : "Failed to analyze this video.";

    return res.status(422).json({ error: message });
  }
});

router.get("/sessions", async (_req, res) => {
  if (!process.env.MONGODB_URI) {
    return res.json([]);
  }

  const sessions = await StudySession.find({}, { transcriptText: 0, transcript: 0 })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return res.json(sessions);
});

router.post("/chat", async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid chat request." });
  }

  try {
    const answer = await chatWithTranscript(parsed.data);
    return res.json({ answer });
  } catch {
    return res.status(500).json({ error: "Failed to generate chat response." });
  }
});

router.post("/quiz-set", async (req, res) => {
  const parsed = quizSetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid quiz set request." });
  }

  try {
    const payload = await generateQuizSet(
      parsed.data.transcriptText,
      parsed.data.count,
      parsed.data.difficulty
    );
    return res.json(payload);
  } catch {
    return res.status(500).json({ error: "Failed to generate quiz set." });
  }
});

router.post("/flashcards", async (req, res) => {
  const parsed = flashcardSetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid flashcard request." });
  }

  try {
    const payload = await generateFlashcardSet(parsed.data.transcriptText, parsed.data.count);
    return res.json(payload);
  } catch {
    return res.status(500).json({ error: "Failed to generate flashcards." });
  }
});

export default router;
