import React, { useState, useMemo } from "react";

export default function TranscriptPanel({ transcript, onLineClick }) {
  const [transcriptQuery, setTranscriptQuery] = useState("");

  const filteredTranscript = useMemo(() => {
    if (!transcript) return [];
    if (!transcriptQuery.trim()) return transcript;
    const q = transcriptQuery.toLowerCase();
    return transcript.filter((line) => line.text.toLowerCase().includes(q));
  }, [transcriptQuery, transcript]);

  return (
    <div className="stack">
      <h3>📜 Full Transcript</h3>
      <input
        value={transcriptQuery}
        onChange={(e) => setTranscriptQuery(e.target.value)}
        placeholder="🔍 Search transcript..."
        style={{ marginBottom: "10px" }}
      />
      <div className="transcript">
        {filteredTranscript.map((line, i) => (
          <p
            key={`${line.offset}-${i}`}
            onClick={() => onLineClick(line)}
          >
            <strong style={{ color: "var(--primary)", marginRight: "8px" }}>[{line.timestamp}]</strong>{" "}
            {line.text}
          </p>
        ))}
      </div>
      <p className="micro-note">Click any line to ask the AI about it.</p>
    </div>
  );
}
