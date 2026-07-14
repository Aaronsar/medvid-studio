"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STYLE_OPTIONS } from "@/lib/types";
import { createProjectClient } from "@/lib/projects-client";
import { cn } from "@/lib/utils";
import { Plus, Loader2 } from "lucide-react";

export function NewProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [professorName, setProfessorName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [style, setStyle] = useState<"pixar" | "realistic" | "anime">("pixar");

  async function handleCreate() {
    if (!title || !professorName || !specialty) return;
    setLoading(true);
    setError("");
    try {
      const project = createProjectClient({
        title,
        professorName,
        specialty,
        style,
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la création"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="lg" className="gap-2">
        <Plus className="size-4" />
        Nouveau projet
      </Button>
    );
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Nouveau projet vidéo</CardTitle>
        <CardDescription>
          Créez une vidéo pédagogique avec un professeur de médecine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titre de la vidéo</Label>
          <Input
            id="title"
            placeholder="ex: Introduction biologie cellulaire"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="professor">Nom du professeur</Label>
          <Input
            id="professor"
            placeholder="ex: Professeur Koskas"
            value={professorName}
            onChange={(e) => setProfessorName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialty">Spécialité</Label>
          <Input
            id="specialty"
            placeholder="ex: Biologie cellulaire"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Style visuel</Label>
          <div className="grid grid-cols-3 gap-2">
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-all",
                  style === s.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.description}
                </p>
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleCreate}
            disabled={loading || !title || !professorName || !specialty}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Créer le projet"
            )}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
