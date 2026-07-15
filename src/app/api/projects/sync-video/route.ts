import { NextResponse } from "next/server";
import { findVideoForProject } from "@/lib/integrations/heygen";

export async function POST(request: Request) {
  const body = await request.json();
  const heygenVideoId = (body.heygenVideoId as string) || null;
  const projectTitle = body.projectTitle as string;

  if (!projectTitle) {
    return NextResponse.json({ error: "projectTitle requis" }, { status: 400 });
  }

  try {
    const result = await findVideoForProject(heygenVideoId, projectTitle);
    if (!result) {
      return NextResponse.json({
        found: false,
        message: "Aucune vidéo trouvée. Lancez d'abord l'animation.",
      });
    }

    return NextResponse.json({
      found: true,
      videoId: result.videoId,
      status: result.status,
      videoUrl: result.videoUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur sync" },
      { status: 500 }
    );
  }
}
