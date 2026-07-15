export function getApiKeyStatus() {
  return {
    heygen: !!process.env.HEYGEN_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    replicate: !!process.env.REPLICATE_API_TOKEN,
  };
}

export type AnimationProvider = "medvid" | "heygen";

export function getAnimationProvider(): AnimationProvider {
  const forced = process.env.ANIMATION_PROVIDER?.toLowerCase();
  if (forced === "heygen" || forced === "medvid") return forced;
  if (process.env.REPLICATE_API_TOKEN) return "medvid";
  if (process.env.HEYGEN_API_KEY) return "heygen";
  return "medvid";
}

export function isMedVidEngineReady(): boolean {
  return !!process.env.REPLICATE_API_TOKEN;
}

export function buildCharacterPrompt(
  professorName: string,
  specialty: string,
  styleSuffix: string,
  customDetails?: string
): string {
  const framing =
    "SINGLE character ONLY, absolutely no other people, no students, no audience, no crowd. Bust shot from chest up, facing camera directly, centered in frame";
  const base = `Portrait of Dr. ${professorName}, medical professor specializing in ${specialty}. ${framing}`;
  const details = customDetails ? `, ${customDetails}` : "";
  return `${base}${details}. ${styleSuffix}`;
}
