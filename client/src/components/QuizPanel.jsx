import React, { useState, useEffect } from "react";
import { fetchQuizSet } from "../utils/api";
import { isCorrect } from "../utils/helpers";

export default function QuizPanel({
  quiz,
  transcriptText,
  setStudyData,
  setNotice,
  setError,
  onScoreUpdate
}) {
  const [quizTargetCount, setQuizTargetCount] = useState(Math.min(10, Math.max(3, quiz?.length ?? 5)));
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizSetLoading, setQuizSetLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});

  useEffect(() => {
    let currentScore = 0;
    quiz.forEach((q) => {
      if (quizAnswers[q.id] && isCorrect(q, quizAnswers[q.id])) {
        currentScore++;
      }
    });
    const answeredCount = Object.keys(quizAnswers).length;
    onScoreUpdate(currentScore, answeredCount);
  }, [quizAnswers, quiz, onScoreUpdate]);

  async function generateQuizSet() {
    if (!transcriptText) return;
    setQuizSetLoading(true);
    setError("");
    try {
      const data = await fetchQuizSet(transcriptText, quizTargetCount, quizDifficulty);
      setStudyData((prev) => ({ ...prev, quiz: data.quiz }));
      setQuizAnswers({});
      setNotice(`Created a ${quizDifficulty} ${quizTargetCount}-question quiz set.`);
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to generate a new quiz set.");
    } finally {
      setQuizSetLoading(false);
    }
  }

  return (
    <div className="stack">
      <div className="quiz-builder">
        <div>
          <h3>🧠 Knowledge Quiz</h3>
          <p className="micro-note">Choose question count + difficulty, then generate a new set.</p>
        </div>
        <div className="quiz-builder-controls">
          <label>
            Questions
            <select
              value={quizTargetCount}
              onChange={(e) => setQuizTargetCount(Number(e.target.value))}
            >
              {[3, 5, 8, 10, 12, 15].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
          <label>
            Difficulty
            <select
              value={quizDifficulty}
              onChange={(e) => setQuizDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <button className="primary-pill" onClick={generateQuizSet} disabled={quizSetLoading}>
            {quizSetLoading ? "Creating..." : "Create Quiz Set"}
          </button>
        </div>
      </div>
      {quiz.map((q, i) => (
        <article key={q.id} className="card quiz-card">
          <h4>
            Q{i + 1}. {q.question}
          </h4>
          <div className="options" style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
            {q.options.map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name={q.id}
                  value={option}
                  checked={quizAnswers[q.id] === option}
                  onChange={(e) =>
                    setQuizAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          {quizAnswers[q.id] && (
            <p
              style={{
                marginTop: "12px",
                padding: "10px",
                borderRadius: "8px",
                background: "rgba(0,0,0,0.2)"
              }}
              className={isCorrect(q, quizAnswers[q.id]) ? "correct" : "wrong"}
            >
              {isCorrect(q, quizAnswers[q.id]) ? "✅ Correct!" : "❌ Incorrect"} — {q.explanation}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
