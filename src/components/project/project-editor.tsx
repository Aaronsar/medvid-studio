"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Project, ProjectStep } from "@/lib/types";
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

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    setProject(data);
    setActiveStep(data.currentStep ?? "script");
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  async function handleUpdate(updates: Partial<Project>) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    setProject(data);
    return data;
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
        onStepClick={setActiveStep}
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
          />
        )}
        {activeStep === "export" && (
          <ExportStep project={project} onUpdate={handleUpdate} />
        )}
      </div>
    </div>
  );
}
