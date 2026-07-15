/**
 * MedVid Engine — moteur d'animation lip-sync propriétaire.
 * Image cartoon + audio ElevenLabs → vidéo parlante.
 *
 * Chaîne qualité (auto) : Kling Avatar V2 → MEMO → SadTalker
 */
import {
  createPredictionWithRetry,
  getReplicateClient,
  parseReplicateError,
} from "./replicate-utils";

const KLING_MODEL = "kwaivgi/kling-avatar-v2";
const SADTALKER_MODELS = [
  "cjwbw/sadtalker",
  "lucataco/sadtalker",
] as const;
const MEMO_MODEL = "zsxkib/memo";

export type MedVidModel = "kling" | "memo" | "sadtalker";

const MODEL_CHAIN: MedVidModel[] = ["kling", "memo", "sadtalker"];

const KLING_AUDIO_MAX_BYTES = 5 * 1024 * 1024;

function getModelChain(): MedVidModel[] {
  const forced = process.env.MEDVID_MODEL?.toLowerCase();
  if (forced === "kling") return ["kling"];
  if (forced === "memo") return ["memo"];
  if (forced === "sadtalker") return ["sadtalker"];
  return MODEL_CHAIN;
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
      `Audio trop volumineux pour Kling (${mb} Mo, max 5 Mo). ` +
        "Raccourcissez le script ou forcez MEDVID_MODEL=memo."
    );
  }
}

async function createKlingPrediction(params: {
  imageUrl: string;
  audioUrl: string;
  professorName?: string;
}) {
  assertKlingAudioLimit(params.audioUrl);

  const prompt = params.professorName
    ? `medical professor ${params.professorName} lecturing professionally, natural lip sync, subtle head movement, expressive cartoon face`
    : "medical professor lecturing professionally, natural lip sync, subtle head movement, expressive cartoon face";

  return createPredictionWithRetry({
    model: KLING_MODEL,
    input: {
      image: toMediaInput(params.imageUrl, "image/png"),
      audio: toMediaInput(params.audioUrl, "audio/mpeg"),
      mode: "pro",
      prompt,
    },
  });
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
      return await createPredictionWithRetry({ model, input });
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
      resolution: 512,
      fps: 24,
      inference_steps: 25,
      cfg_scale: 3.5,
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
      if (!hasFallback) break;
      console.warn(
        `[MedVid Engine] ${model} échoué, tentative ${chain[i + 1]}…`,
        err instanceof Error ? err.message : err
      );
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
      return { status: "completed", videoUrl, error: null };
    }

    if (status === "failed" || status === "canceled") {
      const err =
        typeof prediction.error === "string"
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
