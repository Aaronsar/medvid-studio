import { getAllProjects } from "@/lib/projects";
import { NewProjectDialog } from "@/components/project/new-project-dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProjectProgress } from "@/components/project/step-indicator";

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projets</h1>
          <p className="text-muted-foreground mt-1">
            {projects.length} projet{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <NewProjectDialog />
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">Aucun projet créé</p>
            <div className="mt-4">
              <NewProjectDialog />
            </div>
          </CardContent>
        </Card>
      ) : (
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
                        project.status === "completed"
                          ? "success"
                          : "secondary"
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
      )}
    </div>
  );
}
