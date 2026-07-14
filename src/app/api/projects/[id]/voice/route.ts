import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/projects";
import { generateVoice } from "@/lib/integrations/elevenlabs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const text = body.text ?? project.script;
  const voiceId = body.voiceId ?? project.voiceId;

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

    const updated = await updateProject(id, {
      voiceId,
      voiceAudioUrl: audioUrl,
      currentStep: "animation",
      status: "in_progress",
    });

    return NextResponse.json({ ...updated, demo: result.demo });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de synthèse" },
      { status: 500 }
    );
  }
}
