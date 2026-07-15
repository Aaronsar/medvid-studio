import {
  loadProjectVideoObjectUrl,
  saveProjectVideo,
} from "@/lib/project-blobs";

export function getVideoProxyUrl(
  remoteUrl: string,
  options?: { inline?: boolean; filename?: string }
): string {
  const inline = options?.inline !== false ? "1" : "0";
  const filename = options?.filename ?? "video.mp4";
  return `/api/projects/download-video?url=${encodeURIComponent(remoteUrl)}&inline=${inline}&filename=${encodeURIComponent(filename)}`;
}

export async function cacheRemoteVideo(
  projectId: string,
  remoteUrl: string
): Promise<boolean> {
  try {
    const res = await fetch(getVideoProxyUrl(remoteUrl));
    if (!res.ok) return false;
    const blob = await res.blob();
    if (blob.size < 1000) return false;
    await saveProjectVideo(projectId, blob);
    return true;
  } catch {
    return false;
  }
}

export async function resolvePlaybackUrl(
  projectId: string,
  remoteUrl: string | null
): Promise<string | null> {
  const cached = await loadProjectVideoObjectUrl(projectId);
  if (cached) return cached;
  if (!remoteUrl) return null;
  return getVideoProxyUrl(remoteUrl);
}

export async function downloadVideoFile(
  projectId: string,
  remoteUrl: string | null,
  filename: string
): Promise<void> {
  const cachedBlob = await import("@/lib/project-blobs").then((m) =>
    m.loadProjectVideoBlob(projectId)
  );
  if (cachedBlob) {
    const objectUrl = URL.createObjectURL(cachedBlob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
    return;
  }

  if (!remoteUrl) {
    throw new Error("Aucune vidéo disponible");
  }

  const proxy = getVideoProxyUrl(remoteUrl, { inline: false, filename });
  const res = await fetch(proxy);
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Téléchargement impossible — lien expiré");
  }

  const blob = await res.blob();
  await saveProjectVideo(projectId, blob);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
