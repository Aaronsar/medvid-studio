"use client";

import { useState } from "react";
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

  async function handleSaveSubtitles() {
    await onUpdate({ subtitles, status: "completed" });
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
    { label: "Animation lancée", done: !!project.animationVideoUrl || project.currentStep === "export" },
    { label: "Sous-titres prêts", done: !!subtitles },
  ];

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
            <div className="flex gap-2">
              <Button onClick={handleSaveSubtitles} className="gap-2">
                <CheckCircle className="size-4" />
                Finaliser le projet
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format</span>
              <span className="font-medium">9:16 (Reels)</span>
            </div>
          </div>

          {project.script && (
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Script
                </span>
              </div>
              <p className="text-sm line-clamp-4">{project.script}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
