import { NextResponse } from "next/server";
import { uploadDataUrlToReplicate } from "@/lib/integrations/replicate-files";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await request.json();
  const type = body.type as "image" | "audio" | undefined;
  const dataUrl = body.dataUrl as string | undefined;

  if (type !== "image" && type !== "audio") {
    return NextResponse.json(
      { error: "type requis : image ou audio" },
      { status: 400 }
    );
  }

  if (!dataUrl?.startsWith("data:")) {
    return NextResponse.json(
      { error: "dataUrl manquant ou invalide" },
      { status: 400 }
    );
  }

  try {
    const url = await uploadDataUrlToReplicate(
      dataUrl,
      `${projectId}-${type}`
    );

    if (!url) {
      return NextResponse.json(
        { error: "REPLICATE_API_TOKEN manquante" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      url,
      type,
      field: type === "image" ? "characterMedvidUrl" : "voiceMedvidUrl",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur upload Replicate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
