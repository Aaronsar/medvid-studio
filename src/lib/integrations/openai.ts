import { buildCharacterPrompt } from "./config";

interface GenerateImageParams {
  prompt: string;
  professorName: string;
  specialty: string;
  styleSuffix: string;
}

export async function generateCharacterImage(
  params: GenerateImageParams
): Promise<{ imageUrl: string; prompt: string; demo: boolean }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const fullPrompt = buildCharacterPrompt(
    params.professorName,
    params.specialty,
    params.styleSuffix,
    params.prompt
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
