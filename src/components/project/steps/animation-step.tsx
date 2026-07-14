"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Project } from "@/lib/types";
import { Loader2, ArrowRight, Video, Clapperboard, ExternalLink } from "lucide-react";

export function AnimationStep({
  project,
  onUpdate,
  onNext,
}: {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
  onNext: () => void;
}) {
  const [animating, setAnimating] = useState(false);
  const [polling, setPolling] = useState(false);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState(project.animationVideoUrl);
  const [statusMessage, setStatusMessage] = useState("");

  async function pollVideoStatus(id: string) {
    setPolling(true);
    setStatusMessage("Génération en cours chez HeyGen...");

    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      const res = await fetch(
        `/api/projects/${project.id}/animate?videoId=${id}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur de suivi");
        setPolling(false);
        return;
      }

      if (data.status === "completed" && data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setStatusMessage("Vidéo prête !");
        await onUpdate({
          animationVideoUrl: data.videoUrl,
          currentStep: "export",
          status: "in_progress",
        });
        setPolling(false);
        return;
      }

      if (data.status === "failed") {
        setError(data.error ?? "La génération a échoué");
        setPolling(false);
        return;
      }

      setStatusMessage(
        `Génération en cours... (${Math.round(((i + 1) * 5) / 60)} min)`
      );
    }

    setStatusMessage(
      "La vidéo prend plus de temps que prévu. Retrouvez-la sur HeyGen."
    );
    setPolling(false);
  }

  async function handleAnimate() {
    setAnimating(true);
    setError("");
    setVideoUrl(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/animate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterImageUrl: project.characterImageUrl,
          script: project.script,
          voiceId: project.voiceId,
          title: project.title,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur d'animation");
        return;
      }

      setDemo(data.demo);

      if (data.demo) {
        setStatusMessage("Mode démo — ajoutez HEYGEN_API_KEY");
        return;
      }

      setVideoId(data.videoId);
      await pollVideoStatus(data.videoId);
    } catch {
      setError("Erreur réseau, réessayez");
    } finally {
      setAnimating(false);
    }
  }

  const isWorking = animating || polling;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clapperboard className="size-5 text-primary" />
            Animation & Lip-sync
          </CardTitle>
          <CardDescription>
            Animez le personnage avec HeyGen Avatar IV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Personnage</p>
              <p className="font-medium mt-1">
                {project.characterImageUrl ? "✓ Prêt" : "✗ Manquant"}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Script</p>
              <p className="font-medium mt-1">
                {project.script ? "✓ Prêt" : "✗ Manquant"}
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              {error}
            </p>
          )}

          {statusMessage && !error && (
            <p className="text-sm text-muted-foreground text-center">
              {statusMessage}
            </p>
          )}

          <Button
            onClick={handleAnimate}
            disabled={
              isWorking || !project.characterImageUrl || !project.script
            }
            className="gap-2 w-full"
            size="lg"
          >
            {isWorking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Video className="size-4" />
            )}
            {isWorking ? "Animation en cours..." : "Lancer l'animation"}
          </Button>

          {videoId && (
            <a
              href={`https://app.heygen.com/videos/${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
            >
              Voir sur HeyGen <ExternalLink className="size-3" />
            </a>
          )}

          {demo && (
            <p className="text-xs text-amber-400">
              Mode démo : ajoutez HEYGEN_API_KEY dans .env
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu</CardTitle>
        </CardHeader>
        <CardContent>
          {videoUrl ? (
            <div className="space-y-4">
              <video
                src={videoUrl}
                controls
                className="w-full rounded-xl border border-border"
              />
              <Button onClick={onNext} className="gap-2 w-full">
                Continuer vers l&apos;export
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : project.characterImageUrl ? (
            <div className="space-y-4">
              <div className="relative aspect-[9/16] max-h-[400px] overflow-hidden rounded-xl border border-border mx-auto">
                <Image
                  src={project.characterImageUrl}
                  alt="Personnage à animer"
                  fill
                  className="object-cover"
                  unoptimized
                />
                {polling && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="size-8 animate-spin text-white" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex aspect-[9/16] max-h-[400px] items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30">
              <p className="text-sm text-muted-foreground">
                Générez d&apos;abord le personnage
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
