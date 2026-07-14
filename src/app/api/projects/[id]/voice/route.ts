import { NextResponse } from "next/server";
import { generateVoice } from "@/lib/integrations/elevenlabs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: _id } = await params;
  const body = await request.json();
  const text = body.text as string;
  const voiceId = (body.voiceId as string) ?? "french-male-1";

  if (!text) {
    return NextResponse.json(
      { error: "Aucun texte à synthétiser" },
      { status: 400 }
    );
  }

  try {
    const result = await generateVoice({ text, voiceId });

    const audioUrl = result.audioBase64
      ? `data:audio/mpeg;base64,${result.audioBase64}`
      : null;

    return NextResponse.json({
      voiceId,
      voiceAudioUrl: audioUrl,
      currentStep: "animation",
      status: "in_progress",
      demo: result.demo,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de synthèse" },
      { status: 500 }
    );
  }
}
