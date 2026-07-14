import { NextResponse } from "next/server";
import { animateAvatar, getVideoStatus } from "@/lib/integrations/heygen";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: _id } = await params;
  const body = await request.json();

  const characterImageUrl = body.characterImageUrl as string;
  const script = body.script as string;
  const voiceId = body.voiceId as string | undefined;
  const title = body.title as string | undefined;

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
      title,
    });

    return NextResponse.json({
      animationVideoUrl: null,
      currentStep: "export",
      status: "in_progress",
      videoId: result.videoId,
      videoStatus: result.status,
      demo: result.demo,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur d'animation" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "videoId requis" }, { status: 400 });
  }

  try {
    const status = await getVideoStatus(videoId);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
