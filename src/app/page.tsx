import { getAllProjects } from "@/lib/projects";
import { getApiKeyStatus } from "@/lib/integrations/config";
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
import Link from "next/link";
import {
  Video,
  FolderOpen,
  Wand2,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { getProjectProgress } from "@/components/project/step-indicator";

export default async function DashboardPage() {
  const projects = await getAllProjects();
  const apiStatus = getApiKeyStatus();

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
          {
            label: "Projets totaux",
            value: stats.total,
            icon: FolderOpen,
            color: "text-primary",
          },
          {
            label: "En cours",
            value: stats.inProgress,
            icon: Video,
            color: "text-amber-400",
          },
          {
            label: "Terminés",
            value: stats.completed,
            icon: CheckCircle,
            color: "text-accent",
          },
          {
            label: "Outils connectés",
            value: Object.values(apiStatus).filter(Boolean).length,
            icon: Wand2,
            color: "text-primary",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-secondary">
                <stat.icon className={`size-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
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
                <p className="text-sm text-muted-foreground mt-1">
                  Créez votre première vidéo pédagogique
                </p>
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{project.title}</p>
                          <Badge variant="secondary" className="capitalize text-xs">
                            {project.style}
                          </Badge>
                        </div>
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

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">État des intégrations</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clés API</CardTitle>
              <CardDescription>
                Configurez vos clés dans le fichier .env
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "OpenAI (DALL·E)", key: "openai" as const },
                { name: "ElevenLabs (Voix)", key: "elevenlabs" as const },
                { name: "HeyGen (Animation)", key: "heygen" as const },
                { name: "Replicate", key: "replicate" as const },
              ].map((api) => (
                <div
                  key={api.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{api.name}</span>
                  {apiStatus[api.key] ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle className="size-3" />
                      Connecté
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <XCircle className="size-3" />
                      Non configuré
                    </Badge>
                  )}
                </div>
              ))}
              <Link
                href="/settings"
                className="block text-sm text-primary hover:underline mt-2"
              >
                Configurer les clés API →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                "1. Rédiger le script",
                "2. Générer le personnage 3D",
                "3. Synthétiser la voix",
                "4. Animer (lip-sync)",
                "5. Exporter avec sous-titres",
              ].map((step) => (
                <p key={step} className="text-muted-foreground">
                  {step}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
