import { NextResponse } from "next/server";
import { generateCharacterImage } from "@/lib/integrations/openai";
import { uploadImageFromDataUrl, createPhotoAvatar } from "@/lib/integrations/heygen";
import { uploadDataUrlToReplicate } from "@/lib/integrations/replicate-files";
import { STYLE_OPTIONS } from "@/lib/types";

export const maxDuration = 60;

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
  const referenceImageBase64 = body.referenceImageBase64 as string | undefined;
  const usePhotoDirectly = body.usePhotoDirectly as boolean;

  if (!professorName || !specialty) {
    return NextResponse.json(
      { error: "professorName et specialty sont requis" },
      { status: 400 }
    );
  }

  if (usePhotoDirectly) {
    if (!referenceImageBase64) {
      return NextResponse.json(
        { error: "Aucune photo fournie" },
        { status: 400 }
      );
    }
    const imageUrl = referenceImageBase64.startsWith("data:")
      ? referenceImageBase64
      : `data:image/jpeg;base64,${referenceImageBase64}`;
    const characterHeygenAssetId = await uploadImageFromDataUrl(imageUrl);
    const characterMedvidUrl = await uploadDataUrlToReplicate(
      imageUrl,
      `${professorName}-character`
    );
    let characterHeygenAvatarId: string | null = null;
    if (characterHeygenAssetId) {
      try {
        characterHeygenAvatarId = await createPhotoAvatar(
          characterHeygenAssetId,
          `${professorName} — MedVid`
        );
      } catch {
        characterHeygenAvatarId = null;
      }
    }

    return NextResponse.json({
      characterPrompt: customPrompt || `Photo de ${professorName}`,
      characterImageUrl: imageUrl,
      characterHeygenAssetId,
      characterHeygenAvatarId,
      characterMedvidUrl,
      referencePhotoUrl: referenceImageBase64,
      currentStep: "voice",
      status: "in_progress",
      demo: false,
    });
  }

  const styleOption = STYLE_OPTIONS.find((s) => s.id === style);

  try {
    const result = await generateCharacterImage({
      prompt: customPrompt,
      professorName,
      specialty,
      styleSuffix: styleOption?.promptSuffix ?? STYLE_OPTIONS[0].promptSuffix,
      referenceImageBase64,
    });

    const characterHeygenAssetId = await uploadImageFromDataUrl(
      result.imageUrl
    );
    const characterMedvidUrl = await uploadDataUrlToReplicate(
      result.imageUrl,
      `${professorName}-character`
    );

    let characterHeygenAvatarId: string | null = null;
    if (characterHeygenAssetId) {
      try {
        characterHeygenAvatarId = await createPhotoAvatar(
          characterHeygenAssetId,
          `${professorName} — MedVid`
        );
      } catch {
        characterHeygenAvatarId = null;
      }
    }

    return NextResponse.json({
      characterPrompt: result.prompt,
      characterImageUrl: result.imageUrl,
      characterHeygenAssetId,
      characterHeygenAvatarId,
      characterMedvidUrl,
      referencePhotoUrl: referenceImageBase64 ?? null,
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
