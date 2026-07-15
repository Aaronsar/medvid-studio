import Replicate from "replicate";

const versionCache = new Map<string, string>();

export function getReplicateClient(): Replicate {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN manquante");
  return new Replicate({ auth: token });
}

export async function getLatestModelVersion(model: string): Promise<string> {
  const cached = versionCache.get(model);
  if (cached) return cached;

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN manquante");

  const [owner, name] = model.split("/");
  const response = await fetch(
    `https://api.replicate.com/v1/models/${owner}/${name}/versions`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error(`Modèle Replicate introuvable : ${model}`);
  }

  const data = (await response.json()) as {
    results?: Array<{ id: string }>;
  };
  const versionId = data.results?.[0]?.id;
  if (!versionId) {
    throw new Error(`Aucune version active pour ${model}`);
  }

  versionCache.set(model, versionId);
  return versionId;
}

export function parseReplicateError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes("429") || /throttl/i.test(msg)) {
    return (
      "Replicate : trop de requêtes. Ajoutez du crédit sur replicate.com/account/billing " +
      "(minimum 5 $), attendez 15 s, puis réessayez une seule fois."
    );
  }
  if (msg.includes("404") || /not found/i.test(msg)) {
    return (
      "Modèle Replicate indisponible. Réessayez dans 1 minute — " +
      "si le problème persiste, contactez le support MedVid."
    );
  }
  if (msg.includes("402") || /payment/i.test(msg)) {
    return (
      "Replicate : crédit insuffisant. Ajoutez une carte sur replicate.com/account/billing."
    );
  }
  if (msg.length > 300) {
    return msg.slice(0, 300) + "…";
  }
  return msg;
}

function parseRetryAfterSeconds(msg: string): number {
  const match = msg.match(/retry_after["']?\s*:\s*(\d+)/);
  return match ? Number(match[1]) + 5 : 12;
}

type PredictionCreateInput = {
  model?: string;
  version?: string;
  input: Record<string, unknown>;
};

export async function createPredictionWithRetry(
  spec: PredictionCreateInput,
  maxAttempts = 3
): Promise<Awaited<ReturnType<Replicate["predictions"]["create"]>>> {
  const replicate = getReplicateClient();

  let version = spec.version;
  if (!version && spec.model) {
    version = await getLatestModelVersion(spec.model);
  }
  if (!version) {
    throw new Error("version ou model requis pour Replicate");
  }

  const payload = { version, input: spec.input };
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await replicate.predictions.create(payload);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") && attempt < maxAttempts - 1) {
        await new Promise((r) =>
          setTimeout(r, parseRetryAfterSeconds(msg) * 1000)
        );
        continue;
      }
      throw new Error(parseReplicateError(err));
    }
  }

  throw new Error(parseReplicateError(lastError));
}
