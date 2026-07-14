export function getApiKeyStatus() {
  return {
    heygen: !!process.env.HEYGEN_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    replicate: !!process.env.REPLICATE_API_TOKEN,
  };
}

export function buildCharacterPrompt(
  professorName: string,
  specialty: string,
  styleSuffix: string,
  customDetails?: string
): string {
  const base = `Portrait of Dr. ${professorName}, medical professor specializing in ${specialty}`;
  const details = customDetails ? `, ${customDetails}` : "";
  return `${base}${details}. ${styleSuffix}`;
}
