import { getReplicateClient } from "./replicate-utils";

function parseDataUrl(dataUrl: string): {
  buffer: Buffer;
  contentType: string;
  ext: string;
} {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Format data URL invalide");
  }
  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const ext =
    contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : contentType.includes("mpeg") || contentType.includes("mp3")
          ? "mp3"
          : contentType.includes("wav")
            ? "wav"
            : "bin";
  return { buffer, contentType, ext };
}

export async function uploadDataUrlToReplicate(
  dataUrl: string,
  filenamePrefix: string
): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;

  const { buffer, contentType, ext } = parseDataUrl(dataUrl);
  const replicate = getReplicateClient();
  const file = await replicate.files.create(buffer, {
    filename: `${filenamePrefix}.${ext}`,
    content_type: contentType,
  });

  const url = file.urls?.get;
  if (!url) {
    throw new Error("Upload Replicate : URL introuvable");
  }
  return url;
}

export async function uploadBufferToReplicate(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;

  const replicate = getReplicateClient();
  const file = await replicate.files.create(buffer, {
    filename,
    content_type: contentType,
  });

  return file.urls?.get ?? null;
}
