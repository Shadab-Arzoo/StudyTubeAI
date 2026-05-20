import React, { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../utils/api";

export default function ChatPanel({ transcriptText }) {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (!chatWindowRef.current) return;
    chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
  }, [chatHistory, chatLoading]);

  async function askChat(event) {
    event.preventDefault();
    if (!chatInput.trim() || !transcriptText) return;

    const userMessage = { role: "user", content: chatInput.trim() };
    const nextHistory = [...chatHistory, userMessage];
    setChatHistory(nextHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const data = await sendChatMessage(userMessage.content, transcriptText, nextHistory);
      setChatHistory((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "I could not process that question right now." }
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="stack">
      <h3>💬 AI Tutor Chat</h3>
      <div className="chat-window" ref={chatWindowRef}>
        {chatHistory.length === 0 && (
          <p style={{ color: "var(--text-dim)", textAlign: "center", marginTop: "auto" }}>
            Ask me anything about this video! 🤖
          </p>
        )}
        {chatHistory.map((item, i) => (
          <div key={`${item.role}-${i}`} className={`chat-msg ${item.role}`}>
            {item.content}
          </div>
        ))}
      </div>
      <form onSubmit={askChat} className="chat-form">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask a question..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.shiftKey) {
              e.preventDefault();
              setChatInput((prev) => `${prev}\n`);
            }
          }}
        />
        <button disabled={chatLoading} type="submit">
          {chatLoading ? <div className="spinner"></div> : "Send"}
        </button>
      </form>
      <p className="micro-note">Press Enter to send. Shift+Enter adds a new line.</p>
    </div>
  );
}
