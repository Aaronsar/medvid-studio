"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VOICE_OPTIONS, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, ArrowRight, Mic, Play, Pause } from "lucide-react";

export function VoiceStep({
  project,
  onUpdate,
  onNext,
}: {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
  onNext: () => void;
}) {
  const [voiceId, setVoiceId] = useState(project.voiceId);
  const [generating, setGenerating] = useState(false);
  const [demo, setDemo] = useState(false);
  const [audioUrl, setAudioUrl] = useState(project.voiceAudioUrl);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId, text: project.script }),
      });
      const data = await res.json();
      if (res.ok) {
        setAudioUrl(data.voiceAudioUrl);
        setDemo(data.demo);
        await onUpdate({
          voiceId: data.voiceId,
          voiceAudioUrl: data.voiceAudioUrl,
        });
      }
    } finally {
      setGenerating(false);
    }
  }

  function togglePlay() {
    if (!audioRef.current || !audioUrl) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="size-5 text-primary" />
            Synthèse vocale
          </CardTitle>
          <CardDescription>
            Générez la voix du professeur via ElevenLabs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Choisir une voix</Label>
            <div className="space-y-2">
              {VOICE_OPTIONS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVoiceId(v.id)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg border p-3 text-sm transition-all",
                    voiceId === v.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="font-medium">{v.name}</span>
                  <Badge variant="outline">{v.lang.toUpperCase()}</Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-secondary/50 p-3 text-sm">
            <p className="text-xs text-muted-foreground mb-1">Texte à lire :</p>
            <p className="line-clamp-4">{project.script || "Aucun script"}</p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || !project.script}
            className="gap-2 w-full"
          >
            {generating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mic className="size-4" />
            )}
            {generating ? "Génération en cours..." : "Générer la voix"}
          </Button>

          {demo && (
            <p className="text-xs text-amber-400">
              Mode démo : ajoutez ELEVENLABS_API_KEY dans .env pour la vraie
              synthèse vocale
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu audio</CardTitle>
          <CardDescription>Écoutez la narration générée</CardDescription>
        </CardHeader>
        <CardContent>
          {audioUrl ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center rounded-xl border border-border bg-secondary/30 p-12">
                <Button
                  size="lg"
                  variant="outline"
                  className="size-20 rounded-full"
                  onClick={togglePlay}
                >
                  {playing ? (
                    <Pause className="size-8" />
                  ) : (
                    <Play className="size-8 ml-1" />
                  )}
                </Button>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setPlaying(false)}
                />
              </div>
              <Button onClick={onNext} className="gap-2 w-full">
                Continuer vers l&apos;animation
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30">
              <div className="text-center text-muted-foreground">
                <Mic className="size-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucune voix générée</p>
                <p className="text-xs mt-1">
                  Sélectionnez une voix et cliquez sur Générer
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
