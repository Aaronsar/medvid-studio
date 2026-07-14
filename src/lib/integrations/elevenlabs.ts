const FRENCH_VOICES: Record<string, string> = {
  "french-male-1": "pNInz6obpgDQGcFmaJgB",
  "french-female-1": "EXAVITQu4vr4xnSDxMaL",
  "french-male-2": "VR6AewLTigWG4xSOukaG",
};

interface GenerateVoiceParams {
  text: string;
  voiceId: string;
}

export async function generateVoice(
  params: GenerateVoiceParams
): Promise<{ audioBase64: string; demo: boolean }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return { audioBase64: "", demo: true };
  }

  const elevenLabsVoiceId =
    FRENCH_VOICES[params.voiceId] ?? FRENCH_VOICES["french-male-1"];

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: params.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${error}`);
  }

  const buffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(buffer).toString("base64");
  return { audioBase64, demo: false };
}

export async function listVoices() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return [];

  const response = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return data.voices ?? [];
}
