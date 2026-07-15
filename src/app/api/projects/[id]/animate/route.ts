import { NextResponse } from "next/server";
import { getAnimationProvider } from "@/lib/integrations/config";
import { animateAvatar, getVideoStatus, ensurePhotoAvatar } from "@/lib/integrations/heygen";
import {
  startMedVidAnimation,
  getMedVidAnimationStatus,
  type MedVidModel,
} from "@/lib/integrations/medvid-engine";

export const maxDuration = 120;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: _id } = await params;
  const body = await request.json();
  const requested = body.provider as "heygen" | "medvid" | undefined;
  const provider = requested ?? getAnimationProvider();
  const title = (body.title as string | undefined) ?? "MedVid Studio";

  if (provider === "medvid") {
    const characterMedvidUrl = body.characterMedvidUrl as string | undefined;
    const voiceMedvidUrl = body.voiceMedvidUrl as string | undefined;

    if (!characterMedvidUrl) {
      return NextResponse.json(
        {
          error:
            "Image personnage non préparée. Regénérez le personnage à l'étape précédente.",
        },
        { status: 400 }
      );
    }

    if (!voiceMedvidUrl) {
      return NextResponse.json(
        {
          error:
            "Audio voix non préparé. Retournez à l'étape Voix et générez la narration.",
        },
        { status: 400 }
      );
    }

    try {
      const result = await startMedVidAnimation({
        imageUrl: characterMedvidUrl,
        audioUrl: voiceMedvidUrl,
        professorName: (body.professorName as string | undefined) ?? title,
      });

      return NextResponse.json({
        animationVideoUrl: null,
        currentStep: "export",
        status: "in_progress",
        videoId: result.jobId,
        videoStatus: "pending",
        animationProvider: "medvid",
        animationModel: result.model,
        demo: result.demo,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur MedVid Engine";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const characterAssetId = body.characterAssetId as string | undefined;
  const characterAvatarId = body.characterAvatarId as string | undefined;
  const voiceAssetId = body.voiceAssetId as string | undefined;

  if (!characterAssetId && !characterAvatarId) {
    return NextResponse.json(
      {
        error:
          "Personnage non uploadé. Retournez à l'étape Personnage et regénérez.",
      },
      { status: 400 }
    );
  }

  if (!voiceAssetId) {
    return NextResponse.json(
      {
        error:
          "Voix non uploadée. Retournez à l'étape Voix et cliquez « Générer la voix ».",
      },
      { status: 400 }
    );
  }

  try {
    let avatarId = characterAvatarId ?? null;
    if (!avatarId && characterAssetId) {
      avatarId = await ensurePhotoAvatar(characterAssetId, title, null);
    }

    const result = await animateAvatar({
      avatarId,
      imageAssetId: avatarId ? null : characterAssetId,
      audioAssetId: voiceAssetId,
      title,
    });

    return NextResponse.json({
      animationVideoUrl: null,
      currentStep: "export",
      status: "in_progress",
      videoId: result.videoId,
      videoStatus: result.status,
      animationProvider: "heygen",
      animationModel: null,
      demo: result.demo,
      characterHeygenAvatarId: avatarId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur d'animation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const provider =
    (searchParams.get("provider") as "heygen" | "medvid" | null) ??
    getAnimationProvider();
  const model = (searchParams.get("model") as MedVidModel | null) ?? "kling";

  if (!videoId) {
    return NextResponse.json({ error: "videoId requis" }, { status: 400 });
  }

  try {
    const status =
      provider === "medvid"
        ? await getMedVidAnimationStatus(videoId, model)
        : await getVideoStatus(videoId);
    return NextResponse.json({ ...status, provider, model });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
