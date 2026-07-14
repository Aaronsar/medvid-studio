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
import { Loader2, ArrowRight, Video, Clapperboard } from "lucide-react";

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
  const [demo, setDemo] = useState(false);
  const [done, setDone] = useState(!!project.animationVideoUrl);

  async function handleAnimate() {
    setAnimating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/animate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterImageUrl: project.characterImageUrl,
          script: project.script,
          voiceId: project.voiceId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDemo(data.demo);
        setDone(true);
        await onUpdate({
          animationVideoUrl: data.animationVideoUrl,
          currentStep: "export",
          status: "in_progress",
        });
      }
    } finally {
      setAnimating(false);
    }
  }

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
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Voix</p>
              <p className="font-medium mt-1">
                {project.voiceAudioUrl ? "✓ Prêt" : "Optionnel"}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Format</p>
              <p className="font-medium mt-1">1080×1920 (Reels)</p>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge>HeyGen Avatar IV</Badge>
              <span className="text-xs text-muted-foreground">
                Optimisé pour personnages 3D/cartoon
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Le personnage parlera le script avec synchronisation labiale
              naturelle, expressions faciales et mouvements subtils.
            </p>
          </div>

          <Button
            onClick={handleAnimate}
            disabled={
              animating ||
              !project.characterImageUrl ||
              !project.script
            }
            className="gap-2 w-full"
            size="lg"
          >
            {animating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Video className="size-4" />
            )}
            {animating
              ? "Animation en cours (peut prendre 2-5 min)..."
              : "Lancer l'animation"}
          </Button>

          {demo && (
            <p className="text-xs text-amber-400">
              Mode démo : ajoutez HEYGEN_API_KEY dans .env pour la vraie
              animation
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu</CardTitle>
          <CardDescription>
            Prévisualisation du personnage à animer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {project.characterImageUrl ? (
            <div className="space-y-4">
              <div className="relative aspect-[9/16] max-h-[400px] overflow-hidden rounded-xl border border-border mx-auto">
                <Image
                  src={project.characterImageUrl}
                  alt="Personnage à animer"
                  fill
                  className="object-cover"
                  unoptimized
                />
                {done && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Badge variant="success" className="text-sm px-4 py-2">
                      Animation lancée ✓
                    </Badge>
                  </div>
                )}
              </div>
              {done && (
                <Button onClick={onNext} className="gap-2 w-full">
                  Continuer vers l&apos;export
                  <ArrowRight className="size-4" />
                </Button>
              )}
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
