"use client";

import { useRef, useState, useEffect } from "react";
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
import {
  saveCharacterImage,
  characterBlobRef,
  loadCharacterImage,
  isCharacterBlobRef,
} from "@/lib/project-blobs";
import {
  Loader2,
  ArrowRight,
  ImageIcon,
  Wand2,
  Upload,
  User,
  X,
} from "lucide-react";

export function CharacterStep({
  project,
  onUpdate,
  onNext,
}: {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
  onNext: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState(project.characterPrompt);
  const [generating, setGenerating] = useState(false);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(project.characterImageUrl);
  const [saved, setSaved] = useState(
    !!project.characterImageUrl || isCharacterBlobRef(project.characterImageUrl)
  );
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);

  useEffect(() => {
    if (imageUrl || !isCharacterBlobRef(project.characterImageUrl)) return;
    loadCharacterImage(project.id).then((img) => {
      if (img) setImageUrl(img);
    });
  }, [project.id, project.characterImageUrl, imageUrl]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("Image trop lourde (max 4 Mo)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReferencePhoto(reader.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerate(usePhotoDirectly = false) {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${project.id}/character`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          professorName: project.professorName,
          specialty: project.specialty,
          style: project.style,
          referenceImageBase64: referencePhoto,
          usePhotoDirectly,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : "Erreur de génération";
        setError(errMsg);
        return;
      }
      setImageUrl(data.characterImageUrl);
      setDemo(data.demo);
      await saveCharacterImage(project.id, data.characterImageUrl);
      await onUpdate({
        characterPrompt: data.characterPrompt,
        characterImageUrl: characterBlobRef(project.id),
        characterHeygenAssetId: data.characterHeygenAssetId ?? null,
        characterHeygenAvatarId: data.characterHeygenAvatarId ?? null,
        characterMedvidUrl: data.characterMedvidUrl ?? null,
        currentStep: "voice",
        status: "in_progress",
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur réseau, réessayez"
      );
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
            Format Reels : le professeur seul en plan buste (style tarbaland).
            Évitez les scènes avec élèves — HeyGen anime tous les visages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Votre photo de référence</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            {referencePhoto ? (
              <div className="relative">
                <div className="relative aspect-square max-h-48 overflow-hidden rounded-xl border border-border">
                  <Image
                    src={referencePhoto}
                    alt="Photo de référence"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 size-7"
                  onClick={() => {
                    setReferencePhoto(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 p-8 transition-colors hover:border-primary/50 hover:bg-secondary/50"
              >
                <Upload className="size-8 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Cliquez pour uploader votre photo
                </span>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG ou WEBP — max 4 Mo
                </span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Style sélectionné</Label>
            <Badge variant="secondary" className="capitalize">
              {project.style}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Détails supplémentaires (optionnel)</Label>
            <Textarea
              id="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="ex: fauteuil orange, blouse blanche, fond chaleureux flou — pas de salle de classe ni d'élèves"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200/90 space-y-1">
            <p className="font-medium">Important pour l&apos;animation</p>
            <p>
              Utilisez une image avec <strong>un seul visage</strong> (prof en
              plan buste). Le style <strong>3D cartoon</strong> est supporté via
              HeyGen Avatar IV.
            </p>
          </div>

          <div className="space-y-2">
            {referencePhoto ? (
              <>
                <Button
                  onClick={() => handleGenerate(false)}
                  disabled={generating}
                  className="gap-2 w-full"
                >
                  {generating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Wand2 className="size-4" />
                  )}
                  {generating
                    ? "Génération 3D en cours..."
                    : "Générer version 3D à partir de ma photo"}
                </Button>
                <Button
                  onClick={() => handleGenerate(true)}
                  disabled={generating}
                  variant="outline"
                  className="gap-2 w-full"
                >
                  <User className="size-4" />
                  Utiliser ma photo directement
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleGenerate(false)}
                disabled={generating}
                className="gap-2 w-full"
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
                )}
                {generating
                  ? "Génération en cours..."
                  : "Générer sans photo"}
              </Button>
            )}
          </div>

          {saved && imageUrl && (
            <p className="text-xs text-accent text-center">
              Personnage enregistré — vous pouvez changer d&apos;étape
            </p>
          )}
          {generating && (
            <p className="text-xs text-muted-foreground text-center">
              La génération prend 30 à 60 secondes, patientez...
            </p>
          )}
          {demo && (
            <p className="text-xs text-amber-400">
              Mode démo : ajoutez OPENAI_API_KEY pour la vraie génération
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
                  Uploadez votre photo puis générez l&apos;avatar 3D
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
