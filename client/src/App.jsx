import React, { useEffect, useMemo, useState } from "react";
import { fetchAnalysis } from "./utils/api";
import {
  extractYouTubeVideoId,
  createExportContent,
  getSavedTheme,
  getSavedAnalysisCache,
  THEME_KEY,
  ANALYSIS_CACHE_KEY
} from "./utils/helpers";
import { exportTxt } from "./utils/exporters";

// Components
import Hero from "./components/Hero";
import UrlForm from "./components/UrlForm";
import Stats from "./components/Stats";
import SummaryPanel from "./components/SummaryPanel";
import KeyNotesPanel from "./components/KeyNotesPanel";
import FlashcardsPanel from "./components/FlashcardsPanel";
import QuizPanel from "./components/QuizPanel";
import TranscriptPanel from "./components/TranscriptPanel";
import ChatPanel from "./components/ChatPanel";
import RecentAnalyses from "./components/RecentAnalyses";

const tabItems = ["Summary", "Key Notes", "Flashcards", "Quiz", "Transcript", "AI Chat"];

export default function App() {
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState("Summary");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [studyData, setStudyData] = useState(null);
  const [theme, setTheme] = useState(getSavedTheme);
  const [focusMode, setFocusMode] = useState(false);
  const [analysisCache, setAnalysisCache] = useState(getSavedAnalysisCache);

  // Quiz Stats state reported up from QuizPanel
  const [score, setScore] = useState(0);
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);

  const urlVideoId = useMemo(() => extractYouTubeVideoId(url), [url]);
  const isYouTubeUrl = Boolean(urlVideoId);
  const transcriptWordCount = useMemo(
    () => studyData?.transcriptText?.split(/\s+/).filter(Boolean).length ?? 0,
    [studyData]
  );
  const completionPct = useMemo(() => {
    if (!studyData?.quiz?.length) return 0;
    return Math.round((quizAnsweredCount / studyData.quiz.length) * 100);
  }, [quizAnsweredCount, studyData]);

  useEffect(() => {
    try {
      localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(analysisCache));
    } catch {
      // Ignore quota errors
    }
  }, [analysisCache]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(timeout);
  }, [notice]);

  async function analyzeVideo(event) {
    event.preventDefault();
    setError("");
    const requestedVideoId = extractYouTubeVideoId(url);
    const cachedPayload = requestedVideoId ? analysisCache[requestedVideoId]?.payload : null;

    if (cachedPayload) {
      setStudyData(cachedPayload);
      setActiveTab("Summary");
      setNotice("Loaded from saved analysis.");
      return;
    }

    setLoading(true);
    setStudyData(null);

    try {
      const data = await fetchAnalysis(url);
      setStudyData(data);
      setActiveTab("Summary");
      if (data.videoId) {
        setAnalysisCache((prev) => {
          const next = { ...prev, [data.videoId]: { url, payload: data, savedAt: Date.now() } };
          const topEntries = Object.entries(next)
            .sort(([, a], [, b]) => (b?.savedAt ?? 0) - (a?.savedAt ?? 0))
            .slice(0, 8);
          return Object.fromEntries(topEntries);
        });
      }
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to analyze the video.");
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (!studyData) return;
    const text = createExportContent(studyData);
    exportTxt("studytube-notes.txt", text);
  }

  async function copyText(text, label) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setNotice(`${label} copied`);
    } catch {
      setNotice("Could not copy");
    }
  }

  function applyRecentUrl(item) {
    setUrl(item.url);
    const cachedPayload = item?.videoId ? analysisCache[item.videoId]?.payload : null;
    if (cachedPayload) {
      setStudyData(cachedPayload);
      setActiveTab("Summary");
      setNotice("Loaded cached result from recent analyses.");
    } else {
      setNotice("URL reused. Click Analyze to fetch results.");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className={`app ${focusMode ? "focus-mode" : ""}`}>
      <Hero />

      <UrlForm
        url={url}
        setUrl={setUrl}
        loading={loading}
        analyzeVideo={analyzeVideo}
        isYouTubeUrl={isYouTubeUrl}
        urlVideoId={urlVideoId}
      />

      <div className="utility-row">
        <button className="ghost-btn" onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}>
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        <button className="ghost-btn" onClick={() => setFocusMode((prev) => !prev)}>
          {focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
        </button>
      </div>

      {error && <p className="error">❌ {error}</p>}
      {notice && <p className="copied-toast">✅ {notice}</p>}

      {studyData?.isFallback && (
        <div className="fallback-warning">
          <span>⚠️</span>
          <div>
            <strong>Basic Mode Active</strong>: Results are basic text processing.{" "}
            {studyData?.fallbackMessage || (
              <>
                Add an <code>OPENROUTER_API_KEY</code> to the server <code>.env</code> for{" "}
                <strong>Free AI Summaries</strong>!
              </>
            )}
          </div>
        </div>
      )}

      {studyData && (
        <>
          <Stats
            transcriptWordCount={transcriptWordCount}
            quizAnsweredCount={quizAnsweredCount}
            totalQuizQuestions={studyData.quiz.length}
            score={score}
            completionPct={completionPct}
          />

          <div className="toolbar">
            <button onClick={handleExport}>📄 Download TXT</button>
            <button onClick={() => copyText(createExportContent(studyData), "Full notes")}>
              📋 Copy Notes
            </button>
          </div>

          <nav className="tabs">
            {tabItems.map((tab) => (
              <button
                key={tab}
                className={tab === activeTab ? "tab active" : "tab"}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>

          <section className="panel">
            {activeTab === "Summary" && (
              <SummaryPanel studyData={studyData} copyText={copyText} />
            )}

            {activeTab === "Key Notes" && (
              <KeyNotesPanel keyPoints={studyData.keyPoints} copyText={copyText} />
            )}

            {activeTab === "Flashcards" && (
              <FlashcardsPanel
                flashcards={studyData.flashcards}
                transcriptText={studyData.transcriptText}
                setStudyData={setStudyData}
                setNotice={setNotice}
                setError={setError}
              />
            )}

            {activeTab === "Quiz" && (
              <QuizPanel
                quiz={studyData.quiz}
                transcriptText={studyData.transcriptText}
                setStudyData={setStudyData}
                setNotice={setNotice}
                setError={setError}
                onScoreUpdate={(s, count) => {
                  setScore(s);
                  setQuizAnsweredCount(count);
                }}
              />
            )}

            {activeTab === "Transcript" && (
              <TranscriptPanel
                transcript={studyData.transcript}
                onLineClick={() => setActiveTab("AI Chat")}
              />
            )}

            {activeTab === "AI Chat" && (
              <ChatPanel transcriptText={studyData.transcriptText} />
            )}
          </section>
        </>
      )}

      <RecentAnalyses
        latestAnalysis={studyData}
        applyRecentUrl={applyRecentUrl}
        copyText={copyText}
      />
    </div>
  );
}
