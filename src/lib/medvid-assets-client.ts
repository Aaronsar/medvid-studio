import { parseApiResponse } from "@/lib/api-client";
import type { Project } from "@/lib/types";
import { loadCharacterImage, loadVoiceAudio } from "@/lib/project-blobs";

async function uploadMedvidAsset(
  projectId: string,
  type: "image" | "audio",
  dataUrl: string
): Promise<string> {
  const res = await fetch(`/api/projects/${projectId}/medvid-assets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, dataUrl }),
  });
  const { ok, data } = await parseApiResponse<{ error?: string; url?: string }>(
    res
  );
  if (!ok || !data.url) {
    throw new Error(data.error ?? `Upload ${type} échoué`);
  }
  return data.url;
}

export async function resolveMedvidAssetUrls(
  project: Project
): Promise<{ characterMedvidUrl: string; voiceMedvidUrl: string }> {
  let characterMedvidUrl = project.characterMedvidUrl;
  let voiceMedvidUrl = project.voiceMedvidUrl;

  if (!characterMedvidUrl) {
    const imageDataUrl =
      (await loadCharacterImage(project.id)) ??
      (project.characterImageUrl?.startsWith("data:")
        ? project.characterImageUrl
        : null);
    if (!imageDataUrl) {
      throw new Error(
        "Image personnage introuvable. Regénérez à l'étape Personnage."
      );
    }
    characterMedvidUrl = await uploadMedvidAsset(
      project.id,
      "image",
      imageDataUrl
    );
  }

  if (!voiceMedvidUrl) {
    const audioDataUrl = await loadVoiceAudio(project.id);
    if (!audioDataUrl) {
      throw new Error(
        "Audio voix introuvable. Regénérez à l'étape Voix."
      );
    }
    voiceMedvidUrl = await uploadMedvidAsset(
      project.id,
      "audio",
      audioDataUrl
    );
  }

  return { characterMedvidUrl, voiceMedvidUrl };
}
