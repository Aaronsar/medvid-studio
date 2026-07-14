import { NextResponse } from "next/server";
import { animateAvatar, getVideoStatus } from "@/lib/integrations/heygen";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: _id } = await params;
  const body = await request.json();

  const characterImageUrl = body.characterImageUrl as string;
  const script = body.script as string;
  const voiceId = body.voiceId as string | undefined;

  if (!characterImageUrl) {
    return NextResponse.json(
      { error: "Générez d'abord le personnage" },
      { status: 400 }
    );
  }

  if (!script) {
    return NextResponse.json(
      { error: "Ajoutez un script avant d'animer" },
      { status: 400 }
    );
  }

  try {
    const result = await animateAvatar({
      imageUrl: characterImageUrl,
      script,
      voiceId,
    });

    let videoUrl: string | null = null;
    if (!result.demo) {
      const status = await getVideoStatus(result.videoId);
      videoUrl = status.videoUrl;
    }

    return NextResponse.json({
      animationVideoUrl: videoUrl,
      currentStep: "export",
      status: "in_progress",
      videoId: result.videoId,
      demo: result.demo,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur d'animation" },
      { status: 500 }
    );
  }
}
