import React from "react";

export default function KeyNotesPanel({ keyPoints, copyText }) {
  return (
    <div className="stack">
      <h3>💡 Key Concepts</h3>
      <ul className="list">
        {keyPoints.map((point, i) => (
          <li key={`${point}-${i}`}>{point}</li>
        ))}
      </ul>
      <button
        className="ghost-btn"
        onClick={() => copyText(keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n"), "Key notes")}
      >
        Copy all key notes
      </button>
    </div>
  );
}
