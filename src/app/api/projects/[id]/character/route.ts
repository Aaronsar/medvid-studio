import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/projects";
import { generateCharacterImage } from "@/lib/integrations/openai";
import { STYLE_OPTIONS } from "@/lib/types";

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
  const customPrompt = body.prompt ?? project.characterPrompt;
  const style = STYLE_OPTIONS.find((s) => s.id === project.style);

  try {
    const result = await generateCharacterImage({
      prompt: customPrompt,
      professorName: project.professorName,
      specialty: project.specialty,
      styleSuffix: style?.promptSuffix ?? STYLE_OPTIONS[0].promptSuffix,
    });

    const updated = await updateProject(id, {
      characterPrompt: result.prompt,
      characterImageUrl: result.imageUrl,
      currentStep: "voice",
      status: "in_progress",
    });

    return NextResponse.json({ ...updated, demo: result.demo });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de génération" },
      { status: 500 }
    );
  }
}
