"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/types";
import { getAllProjectsClient } from "@/lib/projects-client";
import { NewProjectDialog } from "@/components/project/new-project-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getProjectProgress } from "@/components/project/step-indicator";
import { ArrowRight, Video } from "lucide-react";

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getAllProjectsClient());
  }, []);

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Video className="size-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Aucun projet créé</p>
          <div className="mt-4">
            <NewProjectDialog />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <Card className="h-full hover:border-primary/50 transition-all cursor-pointer">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{project.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.professorName}
                  </p>
                </div>
                <Badge
                  variant={
                    project.status === "completed" ? "success" : "secondary"
                  }
                  className="text-xs"
                >
                  {project.status === "completed"
                    ? "Terminé"
                    : project.status === "in_progress"
                      ? "En cours"
                      : "Brouillon"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {project.style}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {project.specialty}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Progress
                  value={getProjectProgress(project)}
                  className="flex-1 h-1.5"
                />
                <span className="text-xs text-muted-foreground">
                  {getProjectProgress(project)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {new Date(project.updatedAt).toLocaleDateString("fr-FR")}
                </span>
                <ArrowRight className="size-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
