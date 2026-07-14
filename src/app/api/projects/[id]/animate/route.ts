import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/projects";
import { animateAvatar, getVideoStatus } from "@/lib/integrations/heygen";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  if (!project.characterImageUrl) {
    return NextResponse.json(
      { error: "Générez d'abord le personnage" },
      { status: 400 }
    );
  }

  if (!project.script) {
    return NextResponse.json(
      { error: "Ajoutez un script avant d'animer" },
      { status: 400 }
    );
  }

  try {
    const result = await animateAvatar({
      imageUrl: project.characterImageUrl,
      script: project.script,
      voiceId: project.voiceId,
    });

    let videoUrl: string | null = null;
    if (!result.demo) {
      const status = await getVideoStatus(result.videoId);
      videoUrl = status.videoUrl;
    }

    const updated = await updateProject(id, {
      animationVideoUrl: videoUrl,
      currentStep: "export",
      status: "in_progress",
    });

    return NextResponse.json({
      ...updated,
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
