import { NextResponse } from "next/server";
import { generateVoice } from "@/lib/integrations/elevenlabs";
import { uploadAudioAsset } from "@/lib/integrations/heygen";
import { uploadBufferToReplicate } from "@/lib/integrations/replicate-files";

export const maxDuration = 120;

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

    if (!result.audioBase64 && result.demo) {
      return NextResponse.json({
        voiceId,
        voiceAudioUrl: null,
        voiceGeneratedWithId: voiceId,
        voiceHeygenAssetId: null,
        demo: true,
      });
    }

    let voiceHeygenAssetId: string | null = null;
    let voiceMedvidUrl: string | null = null;
    if (result.audioBase64) {
      const buffer = Buffer.from(result.audioBase64, "base64");
      voiceHeygenAssetId = await uploadAudioAsset(buffer);
      voiceMedvidUrl = await uploadBufferToReplicate(
        buffer,
        "narration.mp3",
        "audio/mpeg"
      );
    }

    const audioUrl = result.audioBase64
      ? `data:audio/mpeg;base64,${result.audioBase64}`
      : null;

    return NextResponse.json({
      voiceId,
      voiceAudioUrl: audioUrl,
      voiceGeneratedWithId: voiceId,
      voiceHeygenAssetId,
      voiceMedvidUrl,
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
