"use client";

import { useState } from "react";
import Image from "next/image";
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
import { Loader2, ArrowRight, ImageIcon, Wand2 } from "lucide-react";

export function CharacterStep({
  project,
  onUpdate,
  onNext,
}: {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
  onNext: () => void;
}) {
  const [prompt, setPrompt] = useState(project.characterPrompt);
  const [generating, setGenerating] = useState(false);
  const [demo, setDemo] = useState(false);
  const [imageUrl, setImageUrl] = useState(project.characterImageUrl);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/character`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          professorName: project.professorName,
          specialty: project.specialty,
          style: project.style,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setImageUrl(data.characterImageUrl);
        setDemo(data.demo);
        await onUpdate({
          characterPrompt: data.characterPrompt,
          characterImageUrl: data.characterImageUrl,
          currentStep: "voice",
          status: "in_progress",
        });
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="size-5 text-primary" />
            Générer le personnage
          </CardTitle>
          <CardDescription>
            Créez l&apos;avatar 3D du professeur via DALL·E 3 (ou Midjourney en
            externe)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Style sélectionné</Label>
            <Badge variant="secondary" className="capitalize">
              {project.style}
            </Badge>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt personnalisé</Label>
            <Textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Décrivez l'apparence du professeur..."
            />
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Prompt complet généré :</p>
            <p>
              Portrait of Dr. {project.professorName}, medical professor
              specializing in {project.specialty}. {prompt}
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="gap-2 w-full"
          >
            {generating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Wand2 className="size-4" />
            )}
            {generating ? "Génération en cours..." : "Générer le personnage"}
          </Button>
          {demo && (
            <p className="text-xs text-amber-400">
              Mode démo : ajoutez OPENAI_API_KEY dans .env pour la vraie
              génération
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu du personnage</CardTitle>
          <CardDescription>
            Ce personnage sera animé à l&apos;étape suivante
          </CardDescription>
        </CardHeader>
        <CardContent>
          {imageUrl ? (
            <div className="space-y-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border">
                <Image
                  src={imageUrl}
                  alt={`Avatar de ${project.professorName}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <Button onClick={onNext} className="gap-2 w-full">
                Continuer vers la voix
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="size-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucun personnage généré</p>
                <p className="text-xs mt-1">
                  Cliquez sur &quot;Générer&quot; pour créer l&apos;avatar
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
