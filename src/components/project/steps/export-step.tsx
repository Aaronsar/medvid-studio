"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Project } from "@/lib/types";
import {
  Download,
  CheckCircle,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  PartyPopper,
  Home,
} from "lucide-react";

export function ExportStep({
  project,
  onUpdate,
}: {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
}) {
  const [subtitles, setSubtitles] = useState(
    project.subtitles || project.script
  );
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalized, setFinalized] = useState(project.status === "completed");
  const [error, setError] = useState("");
  const [fetchingVideo, setFetchingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(project.animationVideoUrl);

  const heygenId = project.heygenVideoId;
  const downloadUrl = videoUrl ?? project.animationVideoUrl;

  async function fetchVideoFromHeyGen() {
    if (!heygenId) return;
    setFetchingVideo(true);
    setError("");
    try {
      const res = await fetch(
        `/api/projects/${project.id}/animate?videoId=${heygenId}`
      );
      const data = await res.json();
      if (data.status === "completed" && data.videoUrl) {
        setVideoUrl(data.videoUrl);
        await onUpdate({ animationVideoUrl: data.videoUrl });
      } else if (data.status === "processing" || data.status === "waiting") {
        setError("La vidéo est encore en cours de génération sur HeyGen. Réessayez dans 1-2 minutes.");
      } else {
        setError("Vidéo pas encore prête. Ouvrez HeyGen pour la télécharger.");
      }
    } catch {
      setError("Impossible de récupérer la vidéo.");
    } finally {
      setFetchingVideo(false);
    }
  }

  async function handleSaveSubtitles() {
    setSaving(true);
    setError("");
    try {
      await onUpdate({
        subtitles,
        status: "completed",
        currentStep: "export",
      });
      setFinalized(true);
    } catch {
      setError("Erreur de sauvegarde. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  function copySubtitles() {
    navigator.clipboard.writeText(subtitles);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const checklist = [
    { label: "Script rédigé", done: !!project.script },
    { label: "Personnage généré", done: !!project.characterImageUrl },
    { label: "Voix synthétisée", done: !!project.voiceAudioUrl },
    {
      label: "Animation lancée",
      done: !!project.animationVideoUrl || project.currentStep === "export",
    },
    { label: "Sous-titres prêts", done: !!subtitles },
  ];

  if (finalized) {
    return (
      <div className="space-y-6">
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <PartyPopper className="size-16 text-accent mb-4" />
            <h2 className="text-2xl font-bold">Projet finalisé !</h2>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Voici comment récupérer votre vidéo et la publier :
            </p>

            <div className="mt-6 w-full max-w-md space-y-3 text-left text-sm">
              <div className="rounded-lg border border-border bg-card p-4 space-y-1">
                <p className="font-semibold">1. Télécharger la vidéo animée</p>
                <p className="text-muted-foreground text-xs">
                  C&apos;est la vidéo où le professeur parle (générée par HeyGen).
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 space-y-1">
                <p className="font-semibold">2. Ajouter les sous-titres dans CapCut</p>
                <p className="text-muted-foreground text-xs">
                  Importez la vidéo + collez le script comme sous-titres animés.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 space-y-1">
                <p className="font-semibold">3. Publier en Reels / TikTok</p>
                <p className="text-muted-foreground text-xs">
                  Format vertical 9:16, idéal Instagram.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive mt-4">{error}</p>
            )}

            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="gap-2">
                    <Download className="size-4" />
                    Télécharger la vidéo
                  </Button>
                </a>
              ) : heygenId ? (
                <>
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={fetchVideoFromHeyGen}
                    disabled={fetchingVideo}
                  >
                    {fetchingVideo ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    Récupérer ma vidéo
                  </Button>
                  <a
                    href={`https://app.heygen.com/videos/${heygenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" variant="outline" className="gap-2">
                      <ExternalLink className="size-4" />
                      Ouvrir sur HeyGen
                    </Button>
                  </a>
                </>
              ) : (
                <a
                  href="https://app.heygen.com/home"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="outline" className="gap-2">
                    <ExternalLink className="size-4" />
                    Mes vidéos sur HeyGen
                  </Button>
                </a>
              )}
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <Home className="size-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {downloadUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aperçu de votre vidéo</CardTitle>
            </CardHeader>
            <CardContent>
              <video
                src={downloadUrl}
                controls
                className="w-full max-w-md mx-auto rounded-xl border border-border"
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="size-5 text-primary" />
              Export & Sous-titres
            </CardTitle>
            <CardDescription>
              Finalisez votre vidéo pour Instagram Reels / TikTok
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subtitles">Sous-titres (format CapCut)</Label>
              <Textarea
                id="subtitles"
                rows={8}
                value={subtitles}
                onChange={(e) => setSubtitles(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSaveSubtitles}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle className="size-4" />
                )}
                {saving ? "Finalisation..." : "Finaliser le projet"}
              </Button>
              <Button
                variant="outline"
                onClick={copySubtitles}
                className="gap-2"
              >
                <Copy className="size-4" />
                {copied ? "Copié !" : "Copier"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outils de montage externe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              {
                name: "CapCut",
                desc: "Ajouter sous-titres animés + musique",
                url: "https://www.capcut.com",
              },
              {
                name: "HeyGen Dashboard",
                desc: "Télécharger la vidéo animée",
                url: "https://app.heygen.com",
              },
            ].map((tool) => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:border-primary/50 transition-all"
              >
                <div>
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.desc}</p>
                </div>
                <ExternalLink className="size-4 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif du projet</CardTitle>
          <CardDescription>{project.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 text-sm"
              >
                <CheckCircle
                  className={`size-4 ${item.done ? "text-accent" : "text-muted-foreground/30"}`}
                />
                <span className={item.done ? "" : "text-muted-foreground"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-secondary/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Professeur</span>
              <span className="font-medium">{project.professorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spécialité</span>
              <span className="font-medium">{project.specialty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Style</span>
              <Badge variant="secondary" className="capitalize">
                {project.style}
              </Badge>
            </div>
          </div>

          {project.animationVideoUrl && (
            <div className="space-y-2">
              <Label>Aperçu vidéo</Label>
              <video
                src={project.animationVideoUrl}
                controls
                className="w-full rounded-xl border border-border"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
