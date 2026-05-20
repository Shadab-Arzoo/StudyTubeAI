import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import cors from "cors";
import studyRoutes from "./routes/studyRoutes.js";
import { connectDb } from "./db.js";

const app = express();
const port = process.env.PORT ?? 5001;

app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", studyRoutes);

connectDb()
  .then(() => {
    console.log("Connected to MongoDB successfully.");
  })
  .catch((error) => {
    console.warn("⚠️ Running without MongoDB persistence:", error.message);
  });

app.listen(port, () => {
  console.log(`StudyTube AI server running on http://localhost:${port}`);
});
