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
  characterHeygenAssetId: string | null;
  characterHeygenAvatarId: string | null;
  characterMedvidUrl: string | null;
  voiceId: string;
  voiceAudioUrl: string | null;
  voiceGeneratedWithId: string | null;
  voiceHeygenAssetId: string | null;
  voiceMedvidUrl: string | null;
  animationVideoUrl: string | null;
  heygenVideoId: string | null;
  animationProvider: "heygen" | "medvid" | null;
  animationModel: "kling" | "memo" | "sadtalker" | null;
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
  {
    id: "french-male-1",
    name: "Louis — narrateur documentaire",
    lang: "fr",
    description: "Voix masculine posée, idéale pour les cours",
  },
  {
    id: "french-female-1",
    name: "Marilène — narratrice",
    lang: "fr",
    description: "Voix féminine claire et professionnelle",
  },
  {
    id: "french-male-2",
    name: "Yann — formateur",
    lang: "fr",
    description: "Ton pédagogique, dynamique et naturel",
  },
];

export const STYLE_OPTIONS = [
  {
    id: "pixar" as const,
    name: "3D Animation",
    description: "Style cartoon type film d'animation",
    promptSuffix:
      "3D Pixar-style cartoon medical professor, warm cinematic lighting, friendly expressive face with clear eyes nose and mouth facing camera directly, bust shot from chest up, cozy armchair, soft blurred background, tarbaland educational reel style, high quality render",
  },
  {
    id: "realistic" as const,
    name: "Réaliste",
    description: "Avatar photo-réaliste du professeur",
    promptSuffix:
      "photorealistic medical professor, white coat, simple blurred studio background, neutral pose, confident warm expression, professional headshot",
  },
  {
    id: "anime" as const,
    name: "Anime",
    description: "Style manga/anime éducatif",
    promptSuffix:
      "anime style medical professor, clean lines, vibrant colors, simple gradient background, bust portrait, educational manga aesthetic",
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
    id: "medvid-engine",
    name: "MedVid Engine",
    role: "Animation & lip-sync",
    step: "animation",
    description: "Notre moteur propriétaire — MEMO + SadTalker, visages cartoon",
    integrated: true,
    url: null,
  },
  {
    id: "heygen",
    name: "HeyGen",
    role: "Animation & lip-sync",
    step: "animation",
    description: "Option premium externe — ~4–5 $/min (non requis)",
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
    name: "Export MedVid",
    role: "Sous-titres & téléchargement",
    step: "export",
    description: "Lecteur vidéo, export MP4, SRT et script — tout sur la plateforme",
    integrated: true,
    url: null,
  },
];
