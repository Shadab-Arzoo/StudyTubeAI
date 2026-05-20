import React, { useState } from "react";
import { fetchFlashcards } from "../utils/api";

export default function FlashcardsPanel({
  flashcards,
  transcriptText,
  setStudyData,
  setNotice,
  setError
}) {
  const [flashcardTargetCount, setFlashcardTargetCount] = useState(Math.min(10, Math.max(1, flashcards?.length ?? 5)));
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [flashcardView, setFlashcardView] = useState("pop");

  async function generateMoreFlashcards() {
    if (!transcriptText) return;
    setFlashcardLoading(true);
    setError("");
    try {
      const data = await fetchFlashcards(transcriptText, flashcardTargetCount);
      setStudyData((prev) => ({
        ...prev,
        flashcards: [...prev.flashcards, ...data.flashcards]
      }));
      setNotice(`Added ${flashcardTargetCount} new flashcards.`);
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to generate more flashcards.");
    } finally {
      setFlashcardLoading(false);
    }
  }

  function deleteFlashcard(indexToDelete) {
    setStudyData((prev) => {
      const nextCards = prev.flashcards.filter((_, index) => index !== indexToDelete);
      return { ...prev, flashcards: nextCards };
    });
    setNotice("Flashcard deleted");
  }

  return (
    <div className="stack">
      <div className="flashcard-toolbar">
        <div className="flashcard-controls">
          <label>
            Generate
            <select
              value={flashcardTargetCount}
              onChange={(e) => setFlashcardTargetCount(Number(e.target.value))}
            >
              {[1, 3, 5, 8, 10, 12].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary-pill"
            onClick={generateMoreFlashcards}
            disabled={flashcardLoading}
          >
            {flashcardLoading ? "Generating..." : "Generate More Flashcards"}
          </button>
        </div>
        <div className="flashcard-view-switcher">
          {["pop", "stack"].map((view) => (
            <button
              key={view}
              className={flashcardView === view ? "view-btn active" : "view-btn"}
              onClick={() => setFlashcardView(view)}
            >
              {view}
            </button>
          ))}
        </div>
      </div>
      <div className={`cards flashcards-${flashcardView}`}>
        {flashcards.map((card, i) => (
          <article className="card" key={`${card.question}-${i}-${card.answer.slice(0, 12)}`}>
            <span className="flashcard-index">#{i + 1}</span>
            <button className="flashcard-delete" onClick={() => deleteFlashcard(i)}>
              Delete
            </button>
            <h4>Question {i + 1}</h4>
            <p>
              <strong>Q:</strong> {card.question}
            </p>
            <hr style={{ border: "0", borderTop: "1px solid var(--border)", margin: "10px 0" }} />
            <p className="flashcard-answer">
              <strong>A:</strong> {card.answer}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
