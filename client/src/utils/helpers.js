export const RECENT_ANALYSES_KEY = "studytube_recent_analyses_v1";
export const THEME_KEY = "studytube_theme_v1";
export const ANALYSIS_CACHE_KEY = "studytube_analysis_cache_v1";

export function createExportContent(data) {
  const lines = [
    "StudyTube AI Notes",
    "",
    "Concise Summary",
    data.conciseSummary,
    "",
    "Detailed Explanation",
    data.detailedExplanation,
    "",
    "Topic Overview",
    data.topicOverview,
    "",
    "Key Points",
    ...data.keyPoints.map((item, i) => `${i + 1}. ${item}`),
    "",
    "Flashcards",
    ...data.flashcards.flatMap((item, i) => [
      `Q${i + 1}: ${item.question}`,
      `A${i + 1}: ${item.answer}`,
      ""
    ])
  ];

  return lines.join("\n");
}

export function isCorrect(quizItem, selectedValue) {
  const actual = quizItem.options[quizItem.correctIndex];
  return selectedValue === actual;
}

export function extractYouTubeVideoId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

export function getSavedRecentAnalyses() {
  try {
    const raw = localStorage.getItem(RECENT_ANALYSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getSavedTheme() {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function getSavedAnalysisCache() {
  try {
    const raw = localStorage.getItem(ANALYSIS_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

