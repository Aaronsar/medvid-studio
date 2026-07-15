/**
 * MedVid Engine — moteur d'animation lip-sync propriétaire.
 * Chaîne rapide : Kling Avatar V2 → P-Video Avatar → SadTalker
 * (MEMO désactivé par défaut — ~40 min, réservé à MEDVID_MODEL=memo)
 */
import {
  createPredictionWithRetry,
  getReplicateClient,
  parseReplicateError,
} from "./replicate-utils";

const KLING_MODEL = "kwaivgi/kling-avatar-v2";
const PRUNA_MODEL = "prunaai/p-video-avatar";
const SADTALKER_MODELS = [
  "cjwbw/sadtalker",
  "lucataco/sadtalker",
] as const;
const MEMO_MODEL = "zsxkib/memo";

export type MedVidModel = "kling" | "pruna" | "memo" | "sadtalker";

/** Chaîne par défaut — pas de MEMO (trop lent). */
const FAST_MODEL_CHAIN: MedVidModel[] = ["kling", "pruna", "sadtalker"];

const KLING_AUDIO_MAX_BYTES = 5 * 1024 * 1024;

function getModelChain(): MedVidModel[] {
  const forced = process.env.MEDVID_MODEL?.toLowerCase();
  if (forced === "kling") return ["kling"];
  if (forced === "pruna") return ["pruna"];
  if (forced === "memo") return ["memo"];
  if (forced === "sadtalker") return ["sadtalker"];
  return FAST_MODEL_CHAIN;
}

function getKlingMode(): "std" | "pro" {
  return process.env.KLING_MODE?.toLowerCase() === "pro" ? "pro" : "std";
}

function toMediaInput(value: string, fallbackMime: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (value.startsWith("data:")) return value;
  return `data:${fallbackMime};base64,${value}`;
}

function getBase64Payload(mediaUrl: string): string | null {
  const match = mediaUrl.match(/^data:[^;]+;base64,(.+)$/);
  return match?.[1] ?? null;
}

function estimateAudioSeconds(audioUrl: string): number {
  if (audioUrl.startsWith("http")) return 60;
  const payload = getBase64Payload(audioUrl);
  if (!payload) return 60;
  const bytes = Buffer.from(payload, "base64").length;
  return Math.min(180, Math.max(8, Math.ceil(bytes / 16_000)));
}

function getAudioByteSize(audioUrl: string): number {
  if (audioUrl.startsWith("http")) return 0;
  const payload = getBase64Payload(audioUrl);
  if (!payload) return 0;
  return Buffer.from(payload, "base64").length;
}

function assertKlingAudioLimit(audioUrl: string): void {
  if (audioUrl.startsWith("http")) return;
  const bytes = getAudioByteSize(audioUrl);
  if (bytes > KLING_AUDIO_MAX_BYTES) {
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    throw new Error(
      `Audio trop volumineux pour Kling (${mb} Mo, max 5 Mo). Raccourcissez le script.`
    );
  }
}

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || /throttl/i.test(msg);
}

async function createKlingPrediction(params: {
  imageUrl: string;
  audioUrl: string;
  professorName?: string;
}) {
  assertKlingAudioLimit(params.audioUrl);

  const prompt = params.professorName
    ? `cartoon 3D professor ${params.professorName} talking naturally, expressive lip sync`
    : "cartoon 3D professor talking naturally, expressive lip sync";

  return createPredictionWithRetry(
    {
      model: KLING_MODEL,
      input: {
        image: toMediaInput(params.imageUrl, "image/png"),
        audio: toMediaInput(params.audioUrl, "audio/mpeg"),
        mode: getKlingMode(),
        prompt,
      },
    },
    5
  );
}

async function createPrunaPrediction(params: {
  imageUrl: string;
  audioUrl: string;
}) {
  return createPredictionWithRetry(
    {
      model: PRUNA_MODEL,
      input: {
        image: toMediaInput(params.imageUrl, "image/png"),
        audio: toMediaInput(params.audioUrl, "audio/mpeg"),
        resolution: "720p",
        video_prompt:
          "The cartoon character talks to camera with natural lip sync and subtle head movement.",
        disable_safety_filter: true,
        disable_prompt_upsampling: true,
      },
    },
    5
  );
}

async function createSadTalkerPrediction(params: {
  imageUrl: string;
  audioUrl: string;
}) {
  const input = {
    source_image: toMediaInput(params.imageUrl, "image/png"),
    driven_audio: toMediaInput(params.audioUrl, "audio/mpeg"),
    preprocess: "full",
    still_mode: false,
    use_enhancer: true,
    expression_scale: 1.0,
    size_of_image: 512,
  };

  let lastError: unknown;
  for (const model of SADTALKER_MODELS) {
    try {
      return await createPredictionWithRetry({ model, input }, 3);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("404")) throw err;
    }
  }

  throw new Error(
    lastError instanceof Error
      ? lastError.message
      : "Aucun modèle SadTalker disponible sur Replicate"
  );
}

async function createMemoPrediction(params: {
  imageUrl: string;
  audioUrl: string;
}) {
  const audioSec = estimateAudioSeconds(params.audioUrl);
  return createPredictionWithRetry({
    model: MEMO_MODEL,
    input: {
      image: toMediaInput(params.imageUrl, "image/png"),
      audio: toMediaInput(params.audioUrl, "audio/mpeg"),
      resolution: 480,
      fps: 20,
      inference_steps: 12,
      cfg_scale: 3.0,
      max_audio_seconds: audioSec,
      num_generated_frames_per_clip: 16,
    },
  });
}

async function createPredictionForModel(
  model: MedVidModel,
  params: {
    imageUrl: string;
    audioUrl: string;
    professorName?: string;
  }
) {
  switch (model) {
    case "kling":
      return createKlingPrediction(params);
    case "pruna":
      return createPrunaPrediction(params);
    case "memo":
      return createMemoPrediction(params);
    case "sadtalker":
      return createSadTalkerPrediction(params);
  }
}

export async function startMedVidAnimation(params: {
  imageUrl: string;
  audioUrl: string;
  professorName?: string;
  preferredModel?: MedVidModel;
}): Promise<{
  jobId: string;
  demo: boolean;
  model: MedVidModel;
}> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return {
      jobId: "demo-" + Date.now(),
      demo: true,
      model: "kling",
    };
  }

  const chain = params.preferredModel
    ? [params.preferredModel]
    : getModelChain();

  let lastError: unknown;
  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    try {
      const prediction = await createPredictionForModel(model, params);
      if (!prediction.id) {
        throw new Error("MedVid Engine : aucun identifiant retourné");
      }
      return { jobId: prediction.id, demo: false, model };
    } catch (err) {
      lastError = err;
      const hasFallback = i < chain.length - 1;
      if (isRateLimitError(err) && hasFallback) {
        console.warn(
          `[MedVid Engine] ${model} rate-limited, attente puis ${chain[i + 1]}…`
        );
        await new Promise((r) => setTimeout(r, 12_000));
      }
      if (!hasFallback) break;
      if (!isRateLimitError(err)) {
        console.warn(
          `[MedVid Engine] ${model} échoué, tentative ${chain[i + 1]}…`,
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  throw new Error(
    lastError instanceof Error
      ? lastError.message
      : "MedVid Engine : tous les modèles ont échoué"
  );
}

export async function getMedVidAnimationStatus(
  jobId: string,
  _model: MedVidModel = "kling"
): Promise<{
  status: string;
  videoUrl: string | null;
  error: string | null;
}> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return { status: "completed", videoUrl: null, error: null };
  }

  try {
    const replicate = getReplicateClient();
    const prediction = await replicate.predictions.get(jobId);
    const status = prediction.status ?? "unknown";
    const output = prediction.output;
    const videoUrl =
      typeof output === "string"
        ? output
        : Array.isArray(output) && typeof output[0] === "string"
          ? output[0]
          : null;

    if (status === "succeeded") {
      if (!videoUrl) {
        return {
          status: "failed",
          videoUrl: null,
          error:
            "Lien vidéo expiré côté Replicate. Regénérez l'animation (~5 min).",
        };
      }
      return { status: "completed", videoUrl, error: null };
    }

    if (status === "failed" || status === "canceled") {
      const err =
        status === "canceled"
          ? "Génération annulée. Cliquez « Lancer l'animation » pour relancer."
          : typeof prediction.error === "string"
            ? prediction.error
            : "Génération MedVid Engine échouée";
      return { status: "failed", videoUrl: null, error: err };
    }

    const mapped =
      status === "starting" || status === "processing"
        ? "processing"
        : "pending";

    return { status: mapped, videoUrl: null, error: null };
  } catch (err) {
    return {
      status: "failed",
      videoUrl: null,
      error: parseReplicateError(err),
    };
  }
}
