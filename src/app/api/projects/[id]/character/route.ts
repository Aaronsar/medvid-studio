import { NextResponse } from "next/server";
import { generateCharacterImage } from "@/lib/integrations/openai";
import { STYLE_OPTIONS } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: _id } = await params;
  const body = await request.json();

  const professorName = body.professorName as string;
  const specialty = body.specialty as string;
  const style = body.style as "pixar" | "realistic" | "anime";
  const customPrompt = body.prompt ?? "";

  if (!professorName || !specialty) {
    return NextResponse.json(
      { error: "professorName et specialty sont requis" },
      { status: 400 }
    );
  }

  const styleOption = STYLE_OPTIONS.find((s) => s.id === style);

  try {
    const result = await generateCharacterImage({
      prompt: customPrompt,
      professorName,
      specialty,
      styleSuffix: styleOption?.promptSuffix ?? STYLE_OPTIONS[0].promptSuffix,
    });

    return NextResponse.json({
      characterPrompt: result.prompt,
      characterImageUrl: result.imageUrl,
      currentStep: "voice",
      status: "in_progress",
      demo: result.demo,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de génération" },
      { status: 500 }
    );
  }
}
