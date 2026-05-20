import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true }
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
    explanation: { type: String, required: true }
  },
  { _id: false }
);

const transcriptSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    offset: { type: Number, required: true },
    duration: { type: Number, required: true },
    timestamp: { type: String, required: true }
  },
  { _id: false }
);

const studySessionSchema = new mongoose.Schema(
  {
    sourceUrl: { type: String, required: true },
    videoId: { type: String, required: true, index: true },
    transcriptText: { type: String, required: true },
    transcript: { type: [transcriptSchema], required: true },
    conciseSummary: { type: String, required: true },
    detailedExplanation: { type: String, required: true },
    topicOverview: { type: String, required: true },
    keyPoints: { type: [String], required: true },
    flashcards: { type: [flashcardSchema], required: true },
    quiz: { type: [quizSchema], required: true }
  },
  { timestamps: true }
);

export const StudySession = mongoose.model("StudySession", studySessionSchema);

