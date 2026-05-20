import React from "react";

export default function UrlForm({ url, setUrl, loading, analyzeVideo, isYouTubeUrl, urlVideoId }) {
  return (
    <>
      <form className="url-form" onSubmit={analyzeVideo}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube URL here..."
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? <div className="spinner"></div> : "Analyze 🚀"}
        </button>
      </form>
      <div className="url-hint-row">
        <p className={url ? (isYouTubeUrl ? "hint good" : "hint bad") : "hint"}>
          {url
            ? isYouTubeUrl
              ? `Ready to analyze video ID: ${urlVideoId}`
              : "Please paste a valid youtube.com or youtu.be URL."
            : "Paste any public YouTube link to begin."}
        </p>
      </div>
    </>
  );
}
