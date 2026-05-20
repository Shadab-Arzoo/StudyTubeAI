import React, { useState, useEffect } from "react";
import { RECENT_ANALYSES_KEY, getSavedRecentAnalyses } from "../utils/helpers";

export default function RecentAnalyses({ applyRecentUrl, copyText, latestAnalysis }) {
  const [recentAnalyses, setRecentAnalyses] = useState(getSavedRecentAnalyses);

  useEffect(() => {
    localStorage.setItem(RECENT_ANALYSES_KEY, JSON.stringify(recentAnalyses));
  }, [recentAnalyses]);

  // When a new analysis comes in from props, push it to recent
  useEffect(() => {
    if (!latestAnalysis) return;
    setRecentAnalyses((prev) => {
      const nextItem = {
        url: latestAnalysis.url,
        videoId: latestAnalysis.videoId,
        conciseSummary: latestAnalysis.conciseSummary,
        at: new Date().toISOString()
      };
      const unique = [nextItem, ...prev.filter((item) => item.videoId !== latestAnalysis.videoId)];
      return unique.slice(0, 10);
    });
  }, [latestAnalysis]);

  function clearRecent() {
    setRecentAnalyses([]);
  }

  return (
    <section className="recent-section">
      <div className="recent-head">
        <h3>🕘 Recent analyses</h3>
        {recentAnalyses.length > 0 && (
          <button className="ghost-btn" onClick={clearRecent}>
            Clear
          </button>
        )}
      </div>
      {recentAnalyses.length === 0 ? (
        <p className="empty-recent">No recent analyses yet. Your latest videos will appear here.</p>
      ) : (
        <div className="recent-grid">
          {recentAnalyses.map((item) => (
            <article className="recent-card" key={`${item.videoId}-${item.at}`}>
              <p className="recent-url">{item.url}</p>
              <p className="recent-summary">{item.conciseSummary}</p>
              <div className="recent-actions">
                <button className="ghost-btn" onClick={() => applyRecentUrl(item)}>
                  Reuse URL
                </button>
                <button className="ghost-btn" onClick={() => copyText(item.url, "URL")}>
                  Copy URL
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
