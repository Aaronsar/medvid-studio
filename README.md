# MedVid Studio

Plateforme unifiée pour créer des vidéos pédagogiques avec des professeurs de médecine en style animation 3D (type tarbaland).

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## Configuration des clés API

Copiez `.env.example` en `.env` et ajoutez vos clés :

```env
OPENAI_API_KEY=sk-...      # DALL·E 3 — génération de personnages
ELEVENLABS_API_KEY=sk_...  # Synthèse vocale française
HEYGEN_API_KEY=hg_...      # Animation & lip-sync
```

Sans clés, la plateforme fonctionne en **mode démo**.

## Pipeline de création

1. **Script** — Rédigez le contenu pédagogique (60-90s)
2. **Personnage** — Générez l'avatar 3D via DALL·E 3
3. **Voix** — Synthétisez la narration via ElevenLabs
4. **Animation** — Animez le personnage via HeyGen Avatar IV
5. **Export** — Sous-titres + liens vers CapCut pour le montage final

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Vue d'ensemble et projets récents |
| Projets | `/projects` | Liste de tous les projets |
| Éditeur | `/projects/[id]` | Workflow complet en 5 étapes |
| Outils IA | `/tools` | Intégrations et liens externes |
| Paramètres | `/settings` | Configuration des clés API |

## Stack technique

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS 4
- Stockage local JSON (`data/projects.json`)
- Intégrations : OpenAI, ElevenLabs, HeyGen
