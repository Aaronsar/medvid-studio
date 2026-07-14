"use client";

import { STEPS, type Project, type ProjectStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const stepOrder: ProjectStep[] = STEPS.map((s) => s.id);

function getStepIndex(step: ProjectStep) {
  return stepOrder.indexOf(step);
}

export function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: ProjectStep;
  onStepClick?: (step: ProjectStep) => void;
}) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isClickable = onStepClick && index <= currentIndex;

        return (
          <div key={step.id} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(step.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
                isCurrent && "bg-primary/15 text-primary font-medium",
                isCompleted && "text-accent",
                !isCurrent && !isCompleted && "text-muted-foreground",
                isClickable && "hover:bg-secondary cursor-pointer",
                !isClickable && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted && "bg-accent text-accent-foreground",
                  !isCurrent && !isCompleted && "bg-secondary"
                )}
              >
                {isCompleted ? <Check className="size-3" /> : index + 1}
              </span>
              <span className="hidden md:inline">{step.label}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-6",
                  index < currentIndex ? "bg-accent" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function getProjectProgress(project: Project): number {
  const index = getStepIndex(project.currentStep);
  return Math.round(((index + 1) / STEPS.length) * 100);
}
