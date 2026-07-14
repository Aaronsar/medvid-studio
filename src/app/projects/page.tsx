import { NewProjectDialog } from "@/components/project/new-project-dialog";
import { ProjectsList } from "@/components/project/projects-list";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projets</h1>
          <p className="text-muted-foreground mt-1">
            Vos projets vidéo sauvegardés dans ce navigateur
          </p>
        </div>
        <NewProjectDialog />
      </div>
      <ProjectsList />
    </div>
  );
}
