import { NextResponse } from "next/server";

export const maxDuration = 120;

function needsReplicateAuth(url: string): boolean {
  return (
    url.includes("replicate.delivery") ||
    url.includes("api.replicate.com/v1/files")
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") ?? "video.mp4";
  const inline = searchParams.get("inline") === "1";

  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    const headers: HeadersInit = {};
    if (needsReplicateAuth(url) && process.env.REPLICATE_API_TOKEN) {
      headers.Authorization = `Bearer ${process.env.REPLICATE_API_TOKEN}`;
    }

    const response = await fetch(url, { headers, redirect: "follow" });
    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            response.status === 404
              ? "Vidéo expirée ou introuvable. Regénérez l'animation."
              : `Impossible de récupérer la vidéo (${response.status})`,
        },
        { status: 502 }
      );
    }

    const contentType =
      response.headers.get("Content-Type") ?? "video/mp4";
    const contentLength = response.headers.get("Content-Length");

    const outHeaders: HeadersInit = {
      "Content-Type": contentType,
      "Content-Disposition": inline
        ? "inline"
        : `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    };
    if (contentLength) {
      outHeaders["Content-Length"] = contentLength;
    }

    return new NextResponse(response.body, { headers: outHeaders });
  } catch {
    return NextResponse.json(
      { error: "Erreur de téléchargement vidéo" },
      { status: 500 }
    );
  }
}
