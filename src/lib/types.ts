export type ProjectStep =
  | "script"
  | "character"
  | "voice"
  | "animation"
  | "export";

export type ProjectStatus = "draft" | "in_progress" | "completed";

export interface Project {
  id: string;
  title: string;
  professorName: string;
  specialty: string;
  status: ProjectStatus;
  currentStep: ProjectStep;
  createdAt: string;
  updatedAt: string;
  script: string;
  characterPrompt: string;
  characterImageUrl: string | null;
  voiceId: string;
  voiceAudioUrl: string | null;
  animationVideoUrl: string | null;
  heygenVideoId: string | null;
  subtitles: string;
  style: "pixar" | "realistic" | "anime";
}

export interface ApiKeyStatus {
  heygen: boolean;
  elevenlabs: boolean;
  openai: boolean;
  replicate: boolean;
}

export const STEPS: { id: ProjectStep; label: string; description: string }[] = [
  {
    id: "script",
    label: "Script",
    description: "Rédigez le contenu pédagogique",
  },
  {
    id: "character",
    label: "Personnage",
    description: "Générez l'avatar 3D du professeur",
  },
  {
    id: "voice",
    label: "Voix",
    description: "Synthétisez la narration",
  },
  {
    id: "animation",
    label: "Animation",
    description: "Animez le personnage (lip-sync)",
  },
  {
    id: "export",
    label: "Export",
    description: "Sous-titres et export final",
  },
];

export const VOICE_OPTIONS = [
  { id: "french-male-1", name: "Professeur (homme)", lang: "fr" },
  { id: "french-female-1", name: "Professeure (femme)", lang: "fr" },
  { id: "french-male-2", name: "Narrateur médical", lang: "fr" },
];

export const STYLE_OPTIONS = [
  {
    id: "pixar" as const,
    name: "3D Animation",
    description: "Style cartoon type film d'animation",
    promptSuffix:
      "3D animated character, Pixar-style, warm cinematic lighting, expressive face, sitting in cozy armchair, high quality render",
  },
  {
    id: "realistic" as const,
    name: "Réaliste",
    description: "Avatar photo-réaliste du professeur",
    promptSuffix:
      "professional medical professor portrait, photorealistic, studio lighting, white coat, confident expression",
  },
  {
    id: "anime" as const,
    name: "Anime",
    description: "Style manga/anime éducatif",
    promptSuffix:
      "anime style medical professor character, clean lines, vibrant colors, educational manga aesthetic",
  },
];

export const TOOLS = [
  {
    id: "midjourney",
    name: "Midjourney",
    role: "Génération d'images",
    step: "character",
    description: "Créez des personnages 3D stylisés",
    integrated: false,
    url: "https://midjourney.com",
  },
  {
    id: "openai",
    name: "DALL·E 3",
    role: "Génération d'images",
    step: "character",
    description: "Génération d'images intégrée via OpenAI",
    integrated: true,
    url: null,
  },
  {
    id: "heygen",
    name: "HeyGen",
    role: "Animation & lip-sync",
    step: "animation",
    description: "Avatar IV — animez vos personnages 3D",
    integrated: true,
    url: "https://heygen.com",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    role: "Synthèse vocale",
    step: "voice",
    description: "Voix françaises naturelles",
    integrated: true,
    url: "https://elevenlabs.io",
  },
  {
    id: "hedra",
    name: "Hedra",
    role: "Animation alternative",
    step: "animation",
    description: "Lip-sync expressif pour avatars",
    integrated: false,
    url: "https://hedra.com",
  },
  {
    id: "capcut",
    name: "CapCut",
    role: "Montage & sous-titres",
    step: "export",
    description: "Montage final et sous-titres",
    integrated: false,
    url: "https://capcut.com",
  },
];
