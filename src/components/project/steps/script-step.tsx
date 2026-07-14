"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Project } from "@/lib/types";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";

const SCRIPT_TEMPLATES = [
  {
    title: "Introduction médicale",
    content:
      "Bonjour, je suis le Dr. [NOM], spécialiste en [SPÉCIALITÉ]. Aujourd'hui, je vais vous expliquer [SUJET] en quelques minutes. Restez avec moi, c'est plus simple que vous ne le pensez.",
  },
  {
    title: "3 points clés",
    content:
      "Il y a trois choses essentielles à retenir sur [SUJET]. Premièrement... Deuxièmement... Et troisièmement... Ces trois éléments pourraient vous sauver la vie.",
  },
  {
    title: "Mythe vs Réalité",
    content:
      "On entend souvent dire que [MYTHE]. C'est faux. La réalité, c'est que [FAIT]. Laissez-moi vous expliquer pourquoi.",
  },
];

export function ScriptStep({
  project,
  onUpdate,
  onNext,
}: {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
  onNext: () => void;
}) {
  const [script, setScript] = useState(project.script);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onUpdate({ script, subtitles: script });
    setSaving(false);
    onNext();
  }

  function applyTemplate(template: string) {
    const filled = template
      .replace(/\[NOM\]/g, project.professorName)
      .replace(/\[SPÉCIALITÉ\]/g, project.specialty)
      .replace(/\[SUJET\]/g, project.title);
    setScript(filled);
  }

  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const estimatedDuration = Math.ceil(wordCount / 2.5);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Rédiger le script
            </CardTitle>
            <CardDescription>
              Écrivez le contenu que le professeur dira dans la vidéo (60-90
              secondes recommandé)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="script">Script de narration</Label>
              <Textarea
                id="script"
                rows={12}
                placeholder="Bonjour, je suis le Dr. Martin Dupont, cardiologue. Aujourd'hui je vais vous parler des signes d'alerte cardiaque..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="font-mono text-sm leading-relaxed"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{wordCount} mots</span>
              <span>~{estimatedDuration}s de vidéo</span>
            </div>
            <Button
              onClick={handleSave}
              disabled={!script.trim() || saving}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Enregistrer et continuer
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modèles de script</CardTitle>
            <CardDescription>Cliquez pour pré-remplir</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {SCRIPT_TEMPLATES.map((t) => (
              <button
                key={t.title}
                type="button"
                onClick={() => applyTemplate(t.content)}
                className="w-full rounded-lg border border-border p-3 text-left text-sm hover:border-primary/50 hover:bg-secondary/50 transition-all"
              >
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {t.content}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
