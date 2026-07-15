"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Project, ProjectStep } from "@/lib/types";
import {
  getProjectClient,
  updateProjectClient,
} from "@/lib/projects-client";
import { hydrateProject } from "@/lib/project-blobs";
import { StepIndicator } from "@/components/project/step-indicator";
import { ScriptStep } from "@/components/project/steps/script-step";
import { CharacterStep } from "@/components/project/steps/character-step";
import { VoiceStep } from "@/components/project/steps/voice-step";
import { AnimationStep } from "@/components/project/steps/animation-step";
import { ExportStep } from "@/components/project/steps/export-step";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getProjectProgress } from "@/components/project/step-indicator";
import { Loader2 } from "lucide-react";

const STEP_ORDER: ProjectStep[] = [
  "script",
  "character",
  "voice",
  "animation",
  "export",
];

export function ProjectEditor() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<ProjectStep>("script");

  const loadProject = useCallback(async () => {
    const data = getProjectClient(id);
    if (!data) {
      setProject(null);
      setLoading(false);
      return;
    }
    const hydrated = await hydrateProject(data);
    setProject(hydrated);
    setActiveStep(hydrated.currentStep ?? "script");
    if (data.characterImageUrl?.startsWith("data:")) {
      updateProjectClient(id, {
        characterImageUrl: `idb:character:${id}`,
      });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  async function handleUpdate(updates: Partial<Project>) {
    const updated = updateProjectClient(id, updates);
    if (updated) {
      const hydrated = await hydrateProject(updated);
      setProject(hydrated);
    }
  }

  function goToStep(step: ProjectStep) {
    void (async () => {
      const fresh = getProjectClient(id);
      if (fresh) {
        const hydrated = await hydrateProject(fresh);
        setProject(hydrated);
      }
      setActiveStep(step);
      updateProjectClient(id, { currentStep: step });
    })();
  }

  function goToNextStep() {
    const currentIndex = STEP_ORDER.indexOf(activeStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      const next = STEP_ORDER[currentIndex + 1];
      setActiveStep(next);
      handleUpdate({ currentStep: next });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Projet introuvable
      </div>
    );
  }

  const progress = getProjectProgress(project);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground mt-1">
            {project.professorName} — {project.specialty}
          </p>
        </div>
        <Badge
          variant={
            project.status === "completed" ? "success" : "secondary"
          }
        >
          {project.status === "completed"
            ? "Terminé"
            : project.status === "in_progress"
              ? "En cours"
              : "Brouillon"}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progression</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <StepIndicator
        currentStep={activeStep}
        onStepClick={goToStep}
      />

      <div className="pt-2">
        {activeStep === "script" && (
          <ScriptStep
            project={project}
            onUpdate={handleUpdate}
            onNext={goToNextStep}
          />
        )}
        {activeStep === "character" && (
          <CharacterStep
            project={project}
            onUpdate={handleUpdate}
            onNext={goToNextStep}
          />
        )}
        {activeStep === "voice" && (
          <VoiceStep
            project={project}
            onUpdate={handleUpdate}
            onNext={goToNextStep}
          />
        )}
        {activeStep === "animation" && (
          <AnimationStep
            project={project}
            onUpdate={handleUpdate}
            onNext={goToNextStep}
            onGoToStep={goToStep}
          />
        )}
        {activeStep === "export" && (
          <ExportStep
            project={project}
            onUpdate={handleUpdate}
            onGoToStep={goToStep}
          />
        )}
      </div>
    </div>
  );
}
