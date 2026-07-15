/**
 * Synthèse vocale ElevenLabs — eleven_v3 pour pauses, soupirs et émotions.
 */
import { prepareScriptForSpeech } from "@/lib/speech-script";

const FRENCH_VOICES: Record<string, string> = {
  // Louis – French Documentary Narrator (pédagogique, naturel)
  "french-male-1": "jGGIwkfv43kUFffPXEEO",
  // Yann – French Narrator & Training (professionnel, clair)
  "french-male-2": "dx2ORrUlXO5zZntMhZms",
  // Marilène – narratrice parisienne (féminin, posé)
  "french-female-1": "tRQeD4idfj7AuhU7ApjT",
};

interface GenerateVoiceParams {
  text: string;
  voiceId: string;
}

function getSpeechModel(): string {
  return process.env.ELEVENLABS_MODEL?.trim() || "eleven_v3";
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

  const speechText = prepareScriptForSpeech(params.text);
  if (!speechText) {
    throw new Error("Script vide après suppression des indications scéniques.");
  }

  const modelId = getSpeechModel();
  const body: Record<string, unknown> = {
    text: speechText,
    model_id: modelId,
    voice_settings: {
      stability: 0.4,
      similarity_boost: 0.88,
      style: 0.55,
      use_speaker_boost: true,
    },
  };

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(body),
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
