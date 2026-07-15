const HEYGEN_VOICES: Record<string, string> = {
  "french-male-1": "68c7001d8ff34d168d287e1bd7653041",
  "french-female-1": "67375f26ab6e44ce8569cea3840ef594",
  "french-male-2": "6e60387f49314fc3b67d81c078b75893",
};

interface AnimateAvatarParams {
  imageUrl?: string;
  imageAssetId?: string | null;
  avatarId?: string | null;
  script?: string;
  voiceId?: string;
  title?: string;
  audioDataUrl?: string | null;
  audioBase64?: string | null;
  audioAssetId?: string | null;
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
    const code = parsed.error?.code ?? "";
    const msg =
      parsed.error?.message ??
      parsed.error?.detail ??
      parsed.message ??
      parsed.detail ??
      errorText;

    if (
      code === "insufficient_credit" ||
      /insufficient credit/i.test(msg)
    ) {
      return (
        "Crédits API HeyGen insuffisants. Rechargez votre wallet API (séparé de l'abonnement web) : " +
        "https://app.heygen.com/settings?nav=API — comptez ~4–5 $/minute de vidéo Avatar IV."
      );
    }
    if (msg.includes("No face detected")) {
      return "Aucun visage détecté. Utilisez une image avec un seul visage visible de face (plan buste).";
    }
    if (msg.includes("face")) {
      return "Problème de visage sur l'image : " + msg;
    }
    if (msg.includes("audio") || msg.includes("duration")) {
      return "Problème audio : script trop long ou format invalide. " + msg;
    }
    return msg;
  } catch {
    if (/insufficient credit/i.test(errorText)) {
      return (
        "Crédits API HeyGen insuffisants. Rechargez sur https://app.heygen.com/settings?nav=API"
      );
    }
    return errorText;
  }
}

async function uploadAssetBuffer(
  buffer: Buffer,
  filename: string,
  mime: string
): Promise<string> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) throw new Error("HEYGEN_API_KEY manquante");

  const formData = new FormData();
  const bytes = new Uint8Array(buffer);
  const blob = new Blob([bytes], { type: mime });
  formData.append("file", blob, filename);

  const response = await fetch("https://api.heygen.com/v3/assets", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(parseHeyGenError(error));
  }

  const data = await response.json();
  const assetId = data.data?.asset_id;
  if (!assetId) throw new Error("Upload HeyGen échoué");
  return assetId;
}

export async function uploadAudioAsset(audioBuffer: Buffer): Promise<string> {
  return uploadAssetBuffer(audioBuffer, "narration.mp3", "audio/mpeg");
}

export async function uploadImageAsset(
  imageBuffer: Buffer,
  mime = "image/png"
): Promise<string> {
  const ext = mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : "png";
  return uploadAssetBuffer(imageBuffer, `character.${ext}`, mime);
}

export async function uploadImageFromDataUrl(
  dataUrl: string
): Promise<string | null> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return null;

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  const buffer = Buffer.from(match[2], "base64");
  return uploadImageAsset(buffer, match[1]);
}

export async function createPhotoAvatar(
  imageAssetId: string,
  name: string
): Promise<string> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) throw new Error("HEYGEN_API_KEY manquante");

  const response = await fetch("https://api.heygen.com/v3/avatars", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "photo",
      name,
      file: { type: "asset_id", asset_id: imageAssetId },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(parseHeyGenError(error));
  }

  const data = await response.json();
  const avatarId =
    data.data?.avatar_item?.id ??
    data.data?.id ??
    data.avatar_item?.id;

  if (!avatarId) {
    throw new Error("Création avatar HeyGen échouée — aucun identifiant retourné");
  }

  return avatarId;
}

export async function ensurePhotoAvatar(
  imageAssetId: string,
  name: string,
  existingAvatarId?: string | null
): Promise<string> {
  if (existingAvatarId) return existingAvatarId;
  return createPhotoAvatar(imageAssetId, name);
}

function parseAudioDataUrl(audioDataUrl: string): Buffer {
  const match = audioDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Format audio invalide");
  return Buffer.from(match[2], "base64");
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

  const payload: Record<string, unknown> = {
    title: params.title ?? "MedVid Studio",
    aspect_ratio: "9:16",
    resolution: "720p",
    engine: { type: "avatar_iv" },
  };

  if (params.avatarId) {
    payload.type = "avatar";
    payload.avatar_id = params.avatarId;
    payload.motion_prompt =
      "Calm teaching pose, very subtle natural head movement and lip sync, shoulders still, no hand gestures, no waving";
    payload.expressiveness = "low";
  } else {
    payload.type = "image";
    payload.fit = "contain";
    payload.remove_background = false;

    if (params.imageAssetId) {
      payload.image = { type: "asset_id", asset_id: params.imageAssetId };
    } else if (params.imageUrl) {
      payload.image = buildImagePayload(params.imageUrl);
    } else {
      throw new Error("Image personnage manquante — regénérez le personnage.");
    }
  }

  if (params.audioAssetId) {
    payload.audio_asset_id = params.audioAssetId;
  } else if (params.audioBase64) {
    const audioBuffer = Buffer.from(params.audioBase64, "base64");
    const audioAssetId = await uploadAudioAsset(audioBuffer);
    payload.audio_asset_id = audioAssetId;
  } else if (params.audioDataUrl) {
    const audioBuffer = parseAudioDataUrl(params.audioDataUrl);
    const audioAssetId = await uploadAudioAsset(audioBuffer);
    payload.audio_asset_id = audioAssetId;
  } else if (params.script) {
    payload.script = params.script;
    payload.voice_id = resolveHeyGenVoice(params.voiceId);
  } else {
    throw new Error(
      "Générez d'abord la voix à l'étape précédente pour une narration naturelle."
    );
  }

  const response = await fetch("https://api.heygen.com/v3/videos", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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

  const errorMsg =
    video?.error ??
    video?.error_message ??
    video?.failure_message ??
    video?.message ??
    video?.failure_reason ??
    null;

  return {
    status: video?.status ?? "unknown",
    videoUrl: video?.video_url ?? null,
    thumbnailUrl: video?.thumbnail_url ?? null,
    error: errorMsg,
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

export async function getHeyGenWalletBalance(): Promise<{
  connected: boolean;
  balanceUsd: number | null;
  billingType: string | null;
}> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return { connected: false, balanceUsd: null, billingType: null };
  }

  try {
    const response = await fetch("https://api.heygen.com/v3/users/me", {
      headers: { "X-Api-Key": apiKey },
    });
    if (!response.ok) {
      return { connected: true, balanceUsd: null, billingType: null };
    }
    const data = await response.json();
    const user = data.data ?? data;
    const billingType = user.billing_type ?? null;
    const wallet = user.wallet;
    const balanceUsd =
      wallet?.remaining_balance != null
        ? Number(wallet.remaining_balance)
        : null;
    return { connected: true, balanceUsd, billingType };
  } catch {
    return { connected: true, balanceUsd: null, billingType: null };
  }
}

export async function listHeyGenVideos(): Promise<
  Array<{
    video_id: string;
    status: string;
    video_title: string;
    created_at: number;
  }>
> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return [];

  const response = await fetch(
    "https://api.heygen.com/v1/video.list?limit=20",
    { headers: { "X-Api-Key": apiKey } }
  );

  if (!response.ok) return [];
  const data = await response.json();
  return data.data?.videos ?? [];
}

export async function findVideoForProject(
  heygenVideoId: string | null,
  projectTitle: string
): Promise<{
  videoId: string;
  status: string;
  videoUrl: string | null;
} | null> {
  if (heygenVideoId) {
    const status = await getVideoStatus(heygenVideoId);
    return {
      videoId: heygenVideoId,
      status: status.status,
      videoUrl: status.videoUrl,
    };
  }

  const videos = await listHeyGenVideos();
  const matches = videos.filter(
    (v) =>
      v.video_title === projectTitle || v.video_title === "MedVid Studio"
  );
  const match = matches.sort((a, b) => b.created_at - a.created_at)[0];

  if (!match) return null;

  const status = await getVideoStatus(match.video_id);
  return {
    videoId: match.video_id,
    status: status.status,
    videoUrl: status.videoUrl,
  };
}
