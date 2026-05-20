import { YoutubeTranscript } from "youtube-transcript";
import { cleanTranscriptText, toTimestamp } from "../utils/text.js";

export async function fetchTranscript(videoId) {
  const transcript = await YoutubeTranscript.fetchTranscript(videoId);

  if (!transcript?.length) {
    throw new Error("Transcript is not available for this video.");
  }

  const withMeta = transcript.map((line) => ({
    text: line.text?.trim() ?? "",
    offset: line.offset ?? 0,
    duration: line.duration ?? 0,
    timestamp: toTimestamp(line.offset ?? 0)
  }));

  const transcriptText = cleanTranscriptText(
    withMeta.map((line) => line.text).join(" ")
  );

  return { transcript: withMeta, transcriptText };
}

