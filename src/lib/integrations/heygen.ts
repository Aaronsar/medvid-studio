const HEYGEN_VOICES: Record<string, string> = {
  "french-male-1": "68c7001d8ff34d168d287e1bd7653041",
  "french-female-1": "67375f26ab6e44ce8569cea3840ef594",
  "french-male-2": "6e60387f49314fc3b67d81c078b75893",
};

interface AnimateAvatarParams {
  imageUrl: string;
  script: string;
  voiceId?: string;
  title?: string;
}

function resolveHeyGenVoice(voiceId?: string): string {
  if (!voiceId) return HEYGEN_VOICES["french-male-1"];
  if (HEYGEN_VOICES[voiceId]) return HEYGEN_VOICES[voiceId];
  if (voiceId.length > 20) return voiceId;
  return HEYGEN_VOICES["french-male-1"];
}

function buildImagePayload(imageUrl: string) {
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Format d'image invalide");
    return {
      type: "base64",
      media_type: match[1],
      data: match[2],
    };
  }

  return {
    type: "url",
    url: imageUrl,
  };
}

function parseHeyGenError(errorText: string): string {
  try {
    const parsed = JSON.parse(errorText);
    const msg =
      parsed.error?.message ?? parsed.message ?? errorText;
    if (msg.includes("No face detected")) {
      return "Aucun visage détecté sur l'image. Utilisez une photo avec un visage visible de face, ou générez un personnage 3D avec des traits plus réalistes.";
    }
    return msg;
  } catch {
    return errorText;
  }
}

export async function animateAvatar(
  params: AnimateAvatarParams
): Promise<{ videoId: string; status: string; demo: boolean }> {
  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    return {
      videoId: "demo-" + Date.now(),
      status: "completed",
      demo: true,
    };
  }

  const image = buildImagePayload(params.imageUrl);
  const voice_id = resolveHeyGenVoice(params.voiceId);

  const response = await fetch("https://api.heygen.com/v3/videos", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "image",
      title: params.title ?? "MedVid Studio",
      aspect_ratio: "9:16",
      resolution: "1080p",
      image,
      script: params.script,
      voice_id,
      expressiveness: "high",
      motion_prompt:
        "Speaking naturally to camera with subtle head movements and friendly professor gestures",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(parseHeyGenError(error));
  }

  const data = await response.json();
  return {
    videoId: data.data?.video_id ?? data.data?.id ?? "",
    status: data.data?.status ?? "waiting",
    demo: false,
  };
}

export async function getVideoStatus(
  videoId: string
): Promise<{
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
}> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return {
      status: "completed",
      videoUrl: null,
      thumbnailUrl: null,
      error: null,
    };
  }

  const response = await fetch(
    `https://api.heygen.com/v3/videos/${videoId}`,
    {
      headers: { "X-Api-Key": apiKey },
    }
  );

  if (!response.ok) {
    throw new Error("Impossible de récupérer le statut de la vidéo");
  }

  const data = await response.json();
  const video = data.data;

  return {
    status: video?.status ?? "unknown",
    videoUrl: video?.video_url ?? null,
    thumbnailUrl: video?.thumbnail_url ?? null,
    error: video?.error ?? null,
  };
}

export async function waitForVideo(
  videoId: string,
  maxWaitMs = 120000,
  intervalMs = 5000
): Promise<{
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
}> {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const status = await getVideoStatus(videoId);

    if (status.status === "completed" && status.videoUrl) {
      return status;
    }

    if (status.status === "failed") {
      throw new Error(status.error ?? "La génération vidéo a échoué");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  const last = await getVideoStatus(videoId);
  return last;
}
