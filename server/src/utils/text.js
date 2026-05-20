export function cleanTranscriptText(input) {
  return input
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/([.!?])(?=[^\s])/g, "$1 ")
    .trim();
}

export function toTimestamp(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

