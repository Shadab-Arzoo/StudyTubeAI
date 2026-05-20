import React from "react";

export default function SummaryPanel({ studyData, copyText }) {
  return (
    <div className="stack">
      <h3>📝 Concise Summary</h3>
      <p>{studyData.conciseSummary}</p>
      <button className="ghost-btn" onClick={() => copyText(studyData.conciseSummary, "Summary")}>
        Copy summary
      </button>
      <h3>📖 Detailed Explanation</h3>
      <p>{studyData.detailedExplanation}</p>
      <h3>📍 Topic Overview</h3>
      <p>{studyData.topicOverview}</p>
    </div>
  );
}
