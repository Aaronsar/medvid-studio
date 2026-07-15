"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  generateSRT,
  generateVTT,
  downloadFile,
  downloadVideoFromUrl,
} from "@/lib/subtitles";
import {
  Download,
  CheckCircle,
  Copy,
  FileText,
  Loader2,
  PartyPopper,
  Home,
  RefreshCw,
  Subtitles,
  Film,
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
  const [syncing, setSyncing] = useState(false);
  const [videoUrl, setVideoUrl] = useState(project.animationVideoUrl);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [heygenId, setHeygenId] = useState(project.heygenVideoId);
  const [vttUrl, setVttUrl] = useState<string | null>(null);

  const syncVideo = useCallback(async () => {
    setSyncing(true);
    setError("");
    try {
      if (
        project.animationProvider === "medvid" &&
        heygenId
      ) {
        const res = await fetch(
          `/api/projects/${project.id}/animate?videoId=${heygenId}&provider=medvid&model=${project.animationModel ?? "kling"}`
        );
        const data = await res.json();
        setVideoStatus(data.status);
        if (data.status === "completed" && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          await onUpdate({ animationVideoUrl: data.videoUrl });
        } else if (
          data.status === "processing" ||
          data.status === "pending"
        ) {
          setError(
            "Vidéo en cours (MedVid Engine). Actualisation automatique..."
          );
        } else if (data.status === "failed") {
          setError(data.error ?? "Génération échouée");
        }
        return;
      }

      const res = await fetch("/api/projects/sync-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heygenVideoId: heygenId,
          projectTitle: project.title,
        }),
      });
      const data = await res.json();

      if (data.found) {
        setHeygenId(data.videoId);
        setVideoStatus(data.status);
        if (data.videoUrl) {
          setVideoUrl(data.videoUrl);
          await onUpdate({
            animationVideoUrl: data.videoUrl,
            heygenVideoId: data.videoId,
          });
        } else if (data.status === "processing" || data.status === "waiting") {
          setError(
            "Vidéo en cours chez HeyGen (5–10 min pour 2 min de contenu). Actualisation automatique..."
          );
        }
      } else if (!videoUrl) {
        setError(data.message ?? "Lancez l'animation à l'étape précédente.");
      }
    } catch {
      setError("Impossible de synchroniser la vidéo.");
    } finally {
      setSyncing(false);
    }
  }, [heygenId, project.title, project.id, project.animationProvider, videoUrl, onUpdate]);

  useEffect(() => {
    syncVideo();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (videoUrl || !heygenId) return;
    if (videoStatus !== "processing" && videoStatus !== "waiting") return;

    const interval = setInterval(() => {
      syncVideo();
    }, 15000);
    return () => clearInterval(interval);
  }, [videoUrl, heygenId, videoStatus, syncVideo]);

  useEffect(() => {
    if (!subtitles) return;
    const vtt = generateVTT(subtitles, 120);
    const blob = new Blob([vtt], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    setVttUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [subtitles]);

  async function handleFinalize() {
    setSaving(true);
    setError("");
    try {
      await onUpdate({
        subtitles,
        status: "completed",
        currentStep: "export",
        animationVideoUrl: videoUrl,
        heygenVideoId: heygenId,
      });
      setFinalized(true);
    } catch {
      setError("Erreur de sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  function copySubtitles() {
    navigator.clipboard.writeText(subtitles);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const safeFilename = project.title.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/gi, "").trim();

  return (
    <div className="space-y-6">
      {finalized && (
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="flex items-center gap-4 py-4">
            <PartyPopper className="size-8 text-accent shrink-0" />
            <div>
              <p className="font-semibold">Projet finalisé !</p>
              <p className="text-sm text-muted-foreground">
                Tous vos fichiers sont disponibles ci-dessous.
              </p>
            </div>
            <Link href="/" className="ml-auto">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="size-4" />
                Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lecteur vidéo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="size-5 text-primary" />
              Votre vidéo
            </CardTitle>
            <CardDescription>
              Aperçu et téléchargement direct
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncing && !videoUrl && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="size-8 animate-spin mb-3" />
                <p className="text-sm">Chargement de la vidéo...</p>
              </div>
            )}

            {videoUrl ? (
              <div className="space-y-3">
                <div className="relative mx-auto max-w-sm">
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    className="w-full rounded-xl border border-border"
                    crossOrigin="anonymous"
                  >
                    {vttUrl && (
                      <track
                        kind="subtitles"
                        src={vttUrl}
                        srcLang="fr"
                        label="Français"
                        default
                      />
                    )}
                  </video>
                </div>
                <Badge variant="success" className="gap-1">
                  <CheckCircle className="size-3" />
                  Vidéo prête
                </Badge>
              </div>
            ) : !syncing ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                <Film className="size-12 opacity-30 mb-3" />
                <p className="text-sm font-medium">Vidéo non disponible</p>
                <p className="text-xs mt-1 max-w-xs">
                  {videoStatus === "processing"
                    ? "Génération en cours chez HeyGen..."
                    : "Retournez à l'étape Animation pour lancer la génération."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={syncVideo}
                >
                  <RefreshCw className="size-3" />
                  Actualiser
                </Button>
              </div>
            ) : null}

            {error && (
              <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                {error}
              </p>
            )}

            {/* Boutons téléchargement */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="gap-2"
                disabled={!videoUrl}
                onClick={() =>
                  videoUrl &&
                  downloadVideoFromUrl(videoUrl, `${safeFilename}.mp4`)
                }
              >
                <Download className="size-4" />
                Vidéo MP4
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={!subtitles}
                onClick={() =>
                  downloadFile(
                    generateSRT(subtitles, 120),
                    `${safeFilename}.srt`,
                    "text/plain"
                  )
                }
              >
                <Subtitles className="size-4" />
                Sous-titres SRT
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={!project.script}
                onClick={() =>
                  downloadFile(
                    project.script,
                    `${safeFilename}-script.txt`,
                    "text/plain"
                  )
                }
              >
                <FileText className="size-4" />
                Script TXT
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={syncVideo}
                disabled={syncing}
              >
                {syncing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Actualiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sous-titres + finaliser */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Subtitles className="size-5 text-primary" />
                Sous-titres
              </CardTitle>
              <CardDescription>
                Modifiez le texte affiché sur la vidéo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                rows={10}
                value={subtitles}
                onChange={(e) => setSubtitles(e.target.value)}
                placeholder="Texte des sous-titres..."
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleFinalize}
                  disabled={saving || finalized}
                  className="gap-2 flex-1"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle className="size-4" />
                  )}
                  {finalized ? "Projet finalisé ✓" : "Finaliser le projet"}
                </Button>
                <Button variant="outline" onClick={copySubtitles} className="gap-2">
                  <Copy className="size-4" />
                  {copied ? "Copié !" : "Copier"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Titre</span>
                <span className="font-medium">{project.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Professeur</span>
                <span className="font-medium">{project.professorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format</span>
                <span>9:16 Reels</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vidéo</span>
                <Badge variant={videoUrl ? "success" : "outline"}>
                  {videoUrl ? "Prête" : videoStatus === "processing" ? "En cours" : "Manquante"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
