import { buildCharacterPrompt } from "./config";

interface GenerateImageParams {
  prompt: string;
  professorName: string;
  specialty: string;
  styleSuffix: string;
  referenceImageBase64?: string;
}

async function analyzeReferencePhoto(
  apiKey: string,
  referenceImageBase64: string
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyse ce visage en détail pour créer un personnage 3D qui lui ressemble. Décris : forme du visage, couleur de peau, yeux, nez, bouche, cheveux (couleur, style, calvitie), barbe/moustache si présents, âge approximatif, traits distinctifs. Réponds en anglais, de façon précise et objective, en 3-4 phrases.",
            },
            {
              type: "image_url",
              image_url: {
                url: referenceImageBase64.startsWith("data:")
                  ? referenceImageBase64
                  : `data:image/jpeg;base64,${referenceImageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Analyse photo échouée: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "";
}

export async function generateCharacterImage(
  params: GenerateImageParams
): Promise<{ imageUrl: string; prompt: string; demo: boolean }> {
  const apiKey = process.env.OPENAI_API_KEY;

  let faceDescription = "";
  if (params.referenceImageBase64 && apiKey) {
    faceDescription = await analyzeReferencePhoto(
      apiKey,
      params.referenceImageBase64
    );
  }

  const enrichedPrompt = faceDescription
    ? `${params.prompt}. The character must closely resemble this person: ${faceDescription}`
    : params.prompt;

  const fullPrompt = buildCharacterPrompt(
    params.professorName,
    params.specialty,
    params.styleSuffix,
    enrichedPrompt
  );

  if (!apiKey) {
    const seed = encodeURIComponent(fullPrompt.slice(0, 50));
    return {
      imageUrl: `https://picsum.photos/seed/${seed}/512/768`,
      prompt: fullPrompt,
      demo: true,
    };
  }

  const response = await fetch(
    "https://api.openai.com/v1/images/generations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: fullPrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return {
    imageUrl: data.data[0].url as string,
    prompt: fullPrompt,
    demo: false,
  };
}
