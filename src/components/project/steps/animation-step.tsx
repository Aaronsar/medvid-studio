"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Project, ProjectStep } from "@/lib/types";
import { VOICE_OPTIONS } from "@/lib/types";
import { parseApiResponse } from "@/lib/api-client";
import { resolveMedvidAssetUrls } from "@/lib/medvid-assets-client";
import { isCharacterBlobRef } from "@/lib/project-blobs";
import { downloadVideoFromUrl } from "@/lib/subtitles";
import {
  Loader2,
  ArrowRight,
  Video,
  Clapperboard,
  Download,
  RefreshCw,
  Clock,
} from "lucide-react";

function estimateFromScript(script: string): {
  wordCount: number;
  audioMin: number;
  heygenMin: number;
} {
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const audioMin = Math.max(0.5, wordCount / 140);
  // Avatar IV cartoon : ~2,5–4× la durée audio côté serveur HeyGen
  const heygenMin = Math.max(3, Math.ceil(audioMin * 3));
  return {
    wordCount,
    audioMin: Math.round(audioMin * 10) / 10,
    heygenMin,
  };
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AnimationStep({
  project,
  onUpdate,
  onNext,
  onGoToStep,
}: {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
  onNext: () => void;
  onGoToStep?: (step: ProjectStep) => void;
}) {
  const [animating, setAnimating] = useState(false);
  const [polling, setPolling] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  const [videoId, setVideoId] = useState<string | null>(
    project.heygenVideoId
  );
  const [videoUrl, setVideoUrl] = useState(project.animationVideoUrl);
  const [statusMessage, setStatusMessage] = useState("");
  const [heygenStatus, setHeygenStatus] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [animationProvider, setAnimationProvider] = useState<
    "heygen" | "medvid" | null
  >(project.animationProvider ?? "medvid");
  const [animationModel, setAnimationModel] = useState<
    "kling" | "memo" | "sadtalker" | null
  >(project.animationModel);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceReady =
    !!project.voiceId &&
    (project.voiceGeneratedWithId === project.voiceId ||
      (!project.voiceGeneratedWithId && !!project.voiceAudioUrl));
  const characterReady =
    animationProvider === "medvid"
      ? isCharacterBlobRef(project.characterImageUrl) ||
        !!project.characterImageUrl?.startsWith("data:")
      : !!project.characterHeygenAssetId || !!project.characterHeygenAvatarId;
  const { wordCount, audioMin, heygenMin } = estimateFromScript(project.script);
  const estimatedMin =
    animationProvider === "medvid"
      ? Math.max(4, Math.ceil(audioMin * 3.5))
      : heygenMin;

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.animationProvider) {
          setAnimationProvider(data.animationProvider);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setVideoUrl(project.animationVideoUrl);
    setVideoId(project.heygenVideoId);
  }, [
    project.animationVideoUrl,
    project.heygenVideoId,
    project.voiceId,
    project.voiceGeneratedWithId,
  ]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
    setPolling(false);
  }, []);

  const checkVideoStatus = useCallback(
    async (id: string): Promise<boolean> => {
      const res = await fetch(
        `/api/projects/${project.id}/animate?videoId=${id}&provider=${animationProvider ?? project.animationProvider ?? "medvid"}&model=${animationModel ?? project.animationModel ?? "kling"}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur de suivi");
        stopPolling();
        return true;
      }

      setHeygenStatus(data.status);

      if (data.status === "completed" && data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setStatusMessage("Vidéo prête !");
        await onUpdate({
          animationVideoUrl: data.videoUrl,
          heygenVideoId: id,
          animationProvider: animationProvider ?? project.animationProvider,
          animationModel: animationModel ?? project.animationModel,
          currentStep: "export",
          status: "in_progress",
        });
        stopPolling();
        return true;
      }

      if (data.status === "failed") {
        const detail = data.error
          ? `HeyGen : ${data.error}`
          : "La génération a échoué chez HeyGen. Réessayez ou regénérez le personnage (un seul visage de face).";
        setError(detail);
        setVideoId(null);
        await onUpdate({ heygenVideoId: null, animationVideoUrl: null });
        stopPolling();
        return true;
      }

      return false;
    },
    [project.id, onUpdate, stopPolling, animationProvider, project.animationProvider, animationModel, project.animationModel]
  );

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      setPolling(true);
      setElapsedSec(0);
      setError("");
      setStatusMessage(
        animationProvider === "medvid"
          ? `MedVid Engine en cours (~${estimatedMin} min)...`
          : `Génération HeyGen en cours (~${heygenMin} min pour ${audioMin} min de vidéo)...`
      );

      timerRef.current = setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);

      checkVideoStatus(id);

      pollRef.current = setInterval(async () => {
        const done = await checkVideoStatus(id);
        if (done) return;
      }, 5000);
    },
    [checkVideoStatus, heygenMin, audioMin, stopPolling]
  );

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  async function syncExistingVideo() {
    setSyncing(true);
    setError("");
    try {
      const res = await fetch("/api/projects/sync-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heygenVideoId: project.heygenVideoId ?? videoId,
          projectTitle: project.title,
        }),
      });
      const data = await res.json();

      if (data.found && data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setVideoId(data.videoId);
        setStatusMessage("Vidéo récupérée !");
        stopPolling();
        await onUpdate({
          animationVideoUrl: data.videoUrl,
          heygenVideoId: data.videoId,
        });
      } else if (data.found) {
        setVideoId(data.videoId);
        setHeygenStatus(data.status);
        if (data.status === "failed") {
          setVideoId(null);
          await onUpdate({ heygenVideoId: null, animationVideoUrl: null });
          setStatusMessage(
            "La dernière tentative a échoué. Cliquez « Lancer l'animation » pour réessayer."
          );
        } else if (
          data.status === "processing" ||
          data.status === "waiting" ||
          data.status === "pending"
        ) {
          startPolling(data.videoId);
        }
      }
    } catch {
      setError("Impossible de récupérer la vidéo.");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (!videoUrl && (project.heygenVideoId || videoId)) {
      const provider = project.animationProvider ?? animationProvider;
      if (provider === "medvid" && (project.heygenVideoId || videoId)) {
        startPolling((project.heygenVideoId ?? videoId)!);
      } else {
        syncExistingVideo();
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAnimate() {
    stopPolling();
    setAnimating(true);
    setError("");
    setVideoUrl(null);
    setVideoId(null);
    try {
      if (!voiceReady) {
        setError(
          "Retournez à l'étape Voix, choisissez votre voix et cliquez « Générer la voix »."
        );
        return;
      }

      setStatusMessage("Préparation de la voix...");

      const provider =
        animationProvider ??
        project.animationProvider ??
        ("medvid" as const);

      let voiceAssetId = project.voiceHeygenAssetId;
      let characterMedvidUrl = project.characterMedvidUrl;
      let voiceMedvidUrl = project.voiceMedvidUrl;

      if (!voiceReady || (provider === "heygen" && !voiceAssetId)) {
        const voiceRes = await fetch(`/api/projects/${project.id}/voice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            voiceId: project.voiceId,
            text: project.script,
          }),
        });
        const { ok, data: voiceData } = await parseApiResponse<{
          error?: string;
          voiceAudioUrl?: string;
          voiceHeygenAssetId?: string;
          voiceMedvidUrl?: string;
          voiceGeneratedWithId?: string;
        }>(voiceRes);
        if (!ok) {
          setError(voiceData.error ?? "Erreur génération vocale");
          return;
        }
        voiceAssetId = voiceData.voiceHeygenAssetId ?? null;
        voiceMedvidUrl = voiceData.voiceMedvidUrl ?? voiceMedvidUrl;
        await onUpdate({
          voiceGeneratedWithId: voiceData.voiceGeneratedWithId,
          voiceHeygenAssetId: voiceAssetId,
          voiceMedvidUrl,
        });
      }

      if (provider === "heygen" && !voiceAssetId) {
        setError("Upload voix HeyGen échoué. Réessayez à l'étape Voix.");
        return;
      }

      if (provider === "medvid") {
        setStatusMessage("Préparation des fichiers MedVid...");
        try {
          const urls = await resolveMedvidAssetUrls({
            ...project,
            characterMedvidUrl,
            voiceMedvidUrl,
          });
          characterMedvidUrl = urls.characterMedvidUrl;
          voiceMedvidUrl = urls.voiceMedvidUrl;
          if (
            characterMedvidUrl !== project.characterMedvidUrl ||
            voiceMedvidUrl !== project.voiceMedvidUrl
          ) {
            await onUpdate({
              characterMedvidUrl,
              voiceMedvidUrl,
            });
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erreur préparation MedVid");
          return;
        }
      }

      if (
        provider === "heygen" &&
        !project.characterHeygenAssetId &&
        !project.characterHeygenAvatarId
      ) {
        setError(
          "Personnage non uploadé. Retournez à l'étape Personnage et regénérez."
        );
        return;
      }

      setStatusMessage(
        provider === "medvid"
          ? "Lancement MedVid Engine..."
          : "Lancement animation HeyGen (Avatar IV cartoon)..."
      );
      await onUpdate({
        animationVideoUrl: null,
        heygenVideoId: null,
      });

      const res = await fetch(`/api/projects/${project.id}/animate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          provider === "medvid"
            ? {
                provider: "medvid",
                characterMedvidUrl,
                voiceMedvidUrl,
                professorName: project.professorName,
                title: project.title,
              }
            : {
                provider: "heygen",
                characterAssetId: project.characterHeygenAssetId,
                characterAvatarId: project.characterHeygenAvatarId,
                voiceAssetId,
                title: project.title,
              }
        ),
      });
      const { ok, data } = await parseApiResponse<{
        error?: string;
        demo?: boolean;
        videoId?: string;
        animationProvider?: "heygen" | "medvid";
        animationModel?: "kling" | "memo" | "sadtalker" | null;
        characterHeygenAvatarId?: string | null;
      }>(res);

      if (!ok) {
        setError(data.error ?? "Erreur d'animation");
        return;
      }

      setDemo(data.demo ?? false);

      if (data.demo) {
        setStatusMessage("Mode démo — ajoutez REPLICATE_API_TOKEN");
        return;
      }

      if (!data.videoId) {
        setError("HeyGen n'a pas retourné d'identifiant vidéo.");
        return;
      }

      setVideoId(data.videoId);
      const activeProvider = data.animationProvider ?? provider;
      setAnimationProvider(activeProvider);
      if (data.animationModel) setAnimationModel(data.animationModel);
      await onUpdate({
        heygenVideoId: data.videoId,
        animationProvider: activeProvider,
        animationModel: data.animationModel ?? null,
        currentStep: "animation",
        ...(data.characterHeygenAvatarId
          ? { characterHeygenAvatarId: data.characterHeygenAvatarId }
          : {}),
      });
      startPolling(data.videoId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau, réessayez");
    } finally {
      setAnimating(false);
    }
  }

  const isWorking = animating || polling || syncing;
  const canAnimate =
    characterReady && !!project.script && voiceReady && !isWorking;
  const progressPct = polling
    ? Math.min(
        98,
        elapsedSec < estimatedMin * 60
          ? Math.round((elapsedSec / (estimatedMin * 60)) * 90)
          : 90 + Math.min(8, Math.floor((elapsedSec - estimatedMin * 60) / 30))
      )
    : 0;
  const overEstimate = polling && elapsedSec > estimatedMin * 60;
  const safeFilename = project.title
    .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/gi, "")
    .trim();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clapperboard className="size-5 text-primary" />
            Animation & Lip-sync
          </CardTitle>
          <CardDescription>
            MedVid Engine — lip-sync cartoon 3D avec notre propre moteur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isWorking}
              onClick={() => setAnimationProvider("medvid")}
              className={`rounded-lg border p-3 text-left text-sm transition-all ${
                animationProvider === "medvid"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <p className="font-medium">MedVid Engine</p>
              <p className="text-xs text-muted-foreground mt-1">
                Kling Avatar V2 — cartoon 3D, lip-sync pro, ~1–2 $/vidéo
              </p>
              <Badge variant="success" className="mt-2 text-[10px]">
                Recommandé
              </Badge>
            </button>
            <button
              type="button"
              disabled={isWorking}
              onClick={() => setAnimationProvider("heygen")}
              className={`rounded-lg border p-3 text-left text-sm transition-all ${
                animationProvider === "heygen"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <p className="font-medium">HeyGen Avatar IV</p>
              <p className="text-xs text-muted-foreground mt-1">
                Référence qualité externe — ~4–5 $/min
              </p>
            </button>
          </div>

          {animationProvider === "medvid" && (
            <p className="text-xs text-primary/90 rounded-lg border border-primary/30 bg-primary/5 p-3">
              MedVid Engine utilise <strong>Kling Avatar V2</strong> (cartoon,
              stylisé, 1080p). En cas d&apos;échec, bascule automatique vers
              MEMO puis SadTalker.
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Personnage</p>
              <p className="font-medium mt-1">
                {characterReady ? "✓ Prêt" : "✗ Regénérer"}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Script</p>
              <p className="font-medium mt-1">
                {project.script ? "✓ Prêt" : "✗ Manquant"}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Voix validée</p>
              <p className="font-medium mt-1 text-xs leading-snug">
                {voiceReady
                  ? `✓ ${VOICE_OPTIONS.find((v) => v.id === project.voiceId)?.name ?? project.voiceId}`
                  : "✗ Générez la voix d'abord"}
              </p>
            </div>
          </div>

          {(!characterReady || !voiceReady) && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-2">
              <p className="font-medium text-amber-200/90">
                Étapes manquantes avant de regénérer :
              </p>
              {!characterReady && animationProvider === "heygen" && (
                <div className="flex items-center justify-between gap-2">
                  <span>Personnage à regénérer (upload HeyGen)</span>
                  {onGoToStep && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      onClick={() => onGoToStep("character")}
                    >
                      Étape Personnage →
                    </Button>
                  )}
                </div>
              )}
              {!characterReady && animationProvider === "medvid" && (
                <div className="flex items-center justify-between gap-2">
                  <span>Personnage à regénérer</span>
                  {onGoToStep && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      onClick={() => onGoToStep("character")}
                    >
                      Étape Personnage →
                    </Button>
                  )}
                </div>
              )}
              {!voiceReady && (
                <div className="flex items-center justify-between gap-2">
                  <span>Voix non validée — générez-la d&apos;abord</span>
                  {onGoToStep && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      onClick={() => onGoToStep("voice")}
                    >
                      Étape Voix →
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {polling && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Clock className="size-4" />
                  Génération en cours
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {formatElapsed(elapsedSec)}
                  {!overEstimate && ` / ~${estimatedMin} min`}
                </span>
              </div>
              <Progress value={progressPct} />
              <p className="text-xs text-muted-foreground">
                {wordCount > 0 ? (
                  <>
                    Script : <strong>{wordCount} mots</strong> (~{audioMin} min
                    de vidéo).
                    {animationProvider === "medvid" ? (
                      <>
                        {" "}
                        MedVid Engine (Kling Avatar V2) — lip-sync cartoon 3D.
                      </>
                    ) : (
                      <>
                        {" "}
                        HeyGen Avatar IV traite en{" "}
                        <strong>2 à 4× temps réel</strong>.
                      </>
                    )}
                  </>
                ) : (
                  <>Génération en cours…</>
                )}{" "}
                Vous pouvez quitter cette page — récupérez la vidéo à
                l&apos;étape Export.
              </p>
              {overEstimate && (
                <p className="text-xs text-amber-200/90">
                  Plus long que prévu — le GPU Replicate est encore en file
                  d&apos;attente. La génération continue.
                </p>
              )}
              {heygenStatus && animationProvider === "heygen" && (
                <Badge variant="secondary" className="capitalize">
                  Statut HeyGen : {heygenStatus}
                </Badge>
              )}
              {animationProvider === "medvid" && heygenStatus && (
                <Badge variant="secondary" className="capitalize">
                  MedVid Engine : {heygenStatus}
                </Badge>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              {error}
            </p>
          )}

          {statusMessage && !error && !polling && (
            <p className="text-sm text-muted-foreground text-center">
              {statusMessage}
            </p>
          )}

          {wordCount > 0 && !polling && !videoUrl && (
            <p className="text-xs text-muted-foreground rounded-lg bg-secondary/40 p-3">
              Durée estimée : <strong>~{audioMin} min</strong> de vidéo →{" "}
              {animationProvider === "heygen" ? (
                <>
                  comptez <strong>~{heygenMin} min</strong> de génération (~4–5
                  $/min)
                </>
              ) : (
                <>
                  comptez <strong>~{estimatedMin} min</strong> via MedVid Engine
                  (~1–2 $ total, Kling Avatar V2)
                </>
              )}
            </p>
          )}

          <Button
            onClick={handleAnimate}
            disabled={!canAnimate}
            className="gap-2 w-full"
            size="lg"
            variant={videoUrl ? "outline" : "default"}
          >
            {isWorking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Video className="size-4" />
            )}
            {animating
              ? "Lancement..."
              : polling
                ? "Génération en cours..."
                : videoUrl
                  ? "Regénérer la vidéo"
                  : "Lancer l'animation"}
          </Button>

          {polling && (
            <Button
              variant="outline"
              className="gap-2 w-full"
              onClick={onNext}
            >
              Aller à l&apos;export (en arrière-plan)
              <ArrowRight className="size-4" />
            </Button>
          )}

          {(videoId || project.heygenVideoId) && !videoUrl && !polling && (
            <Button
              variant="outline"
              className="gap-2 w-full"
              onClick={syncExistingVideo}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Récupérer la vidéo
            </Button>
          )}

          {demo && (
            <p className="text-xs text-amber-400">
              Mode démo : ajoutez REPLICATE_API_TOKEN dans .env
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
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleAnimate}
                  disabled={!canAnimate}
                >
                  <RefreshCw className="size-4" />
                  Regénérer
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    downloadVideoFromUrl(videoUrl, `${safeFilename}.mp4`)
                  }
                >
                  <Download className="size-4" />
                  Télécharger
                </Button>
                <Button onClick={onNext} className="gap-2 col-span-2">
                  Export
                  <ArrowRight className="size-4" />
                </Button>
              </div>
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
                {(polling || syncing || animating) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-2">
                    <Loader2 className="size-8 animate-spin text-white" />
                    {polling && (
                      <p className="text-white text-xs px-4 text-center">
                        {overEstimate
                          ? "HeyGen finalise encore…"
                          : `~${Math.max(1, estimatedMin - Math.floor(elapsedSec / 60))} min restantes`}
                      </p>
                    )}
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
