export function generateSRT(text: string, totalDurationSec = 120): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return "";

  const durationPerSentence = totalDurationSec / sentences.length;
  let current = 0;
  const blocks: string[] = [];

  sentences.forEach((sentence, i) => {
    const start = current;
    const end = Math.min(current + durationPerSentence, totalDurationSec);
    blocks.push(
      `${i + 1}\n${formatSRTTime(start)} --> ${formatSRTTime(end)}\n${sentence}\n`
    );
    current = end;
  });

  return blocks.join("\n");
}

export function generateVTT(text: string, totalDurationSec = 120): string {
  const srt = generateSRT(text, totalDurationSec);
  return "WEBVTT\n\n" + srt.replace(/,/g, ".");
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${padMs(ms)}`;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function padMs(n: number) {
  return n.toString().padStart(3, "0");
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadVideoFromUrl(url: string, filename: string) {
  const proxyUrl = `/api/projects/download-video?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
  const a = document.createElement("a");
  a.href = proxyUrl;
  a.download = filename;
  a.click();
}
