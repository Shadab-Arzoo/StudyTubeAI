import React from "react";

export default function Stats({ transcriptWordCount, quizAnsweredCount, totalQuizQuestions, score, completionPct }) {
  return (
    <section className="stats-grid">
      <article className="stat-card">
        <p>Transcript words</p>
        <strong>{transcriptWordCount.toLocaleString()}</strong>
      </article>
      <article className="stat-card">
        <p>Quiz progress</p>
        <strong>
          {quizAnsweredCount} / {totalQuizQuestions}
        </strong>
      </article>
      <article className="stat-card">
        <p>Score</p>
        <strong>
          {score} / {totalQuizQuestions}
        </strong>
      </article>
      <article className="stat-card">
        <p>Completion</p>
        <strong>{completionPct}%</strong>
      </article>
    </section>
  );
}
