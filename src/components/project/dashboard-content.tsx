"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/types";
import { getAllProjectsClient } from "@/lib/projects-client";
import { NewProjectDialog } from "@/components/project/new-project-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getProjectProgress } from "@/components/project/step-indicator";
import { ArrowRight, Video } from "lucide-react";

interface ApiKeyStatus {
  heygen: boolean;
  elevenlabs: boolean;
  openai: boolean;
  replicate: boolean;
}

export function DashboardContent({
  apiStatus,
}: {
  apiStatus: ApiKeyStatus;
}) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getAllProjectsClient());
  }, []);

  const stats = {
    total: projects.length,
    completed: projects.filter((p) => p.status === "completed").length,
    inProgress: projects.filter((p) => p.status === "in_progress").length,
  };

  const recentProjects = projects.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Créez des vidéos pédagogiques style animation 3D avec vos
            professeurs de médecine
          </p>
        </div>
        <NewProjectDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Projets totaux", value: stats.total },
          { label: "En cours", value: stats.inProgress },
          { label: "Terminés", value: stats.completed },
          {
            label: "Outils connectés",
            value: Object.values(apiStatus).filter(Boolean).length,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Projets récents</h2>
          {recentProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Video className="size-12 text-muted-foreground/30 mb-4" />
                <p className="font-medium">Aucun projet pour le moment</p>
                <div className="mt-4">
                  <NewProjectDialog />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:border-primary/50 transition-all cursor-pointer">
                    <CardContent className="flex items-center gap-4 pt-6">
                      <div className="flex-1">
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.professorName} — {project.specialty}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <Progress
                            value={getProjectProgress(project)}
                            className="flex-1 h-1.5"
                          />
                          <span className="text-xs text-muted-foreground">
                            {getProjectProgress(project)}%
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clés API</CardTitle>
            <CardDescription>État des intégrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { name: "OpenAI", ok: apiStatus.openai },
              { name: "ElevenLabs", ok: apiStatus.elevenlabs },
              { name: "HeyGen", ok: apiStatus.heygen },
            ].map((api) => (
              <div key={api.name} className="flex justify-between">
                <span>{api.name}</span>
                <Badge variant={api.ok ? "success" : "outline"}>
                  {api.ok ? "Connecté" : "Non configuré"}
                </Badge>
              </div>
            ))}
            <Link
              href="/settings"
              className="block text-primary hover:underline mt-2"
            >
              Paramètres →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
