import { v4 as uuidv4 } from "uuid";
import type { Project } from "./types";

const STORAGE_KEY = "medvid-projects";

function readProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as Project[]) : [];
  } catch {
    return [];
  }
}

function writeProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" || err.code === 22)
    ) {
      const light = projects.map(sanitizeProject);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(light));
      return;
    }
    throw err;
  }
}

function sanitizeProject(project: Project): Project {
  const copy = { ...project };
  if (copy.animationVideoUrl?.startsWith("http")) {
    if (copy.voiceAudioUrl?.startsWith("data:")) copy.voiceAudioUrl = null;
  }
  if (copy.characterImageUrl && copy.characterImageUrl.length > 200_000) {
    if (copy.animationVideoUrl?.startsWith("http")) {
      copy.characterImageUrl = null;
    }
  }
  return copy;
}

export function getAllProjectsClient(): Project[] {
  return readProjects().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getProjectClient(id: string): Project | null {
  return readProjects().find((p) => p.id === id) ?? null;
}

export function createProjectClient(
  data: Pick<Project, "title" | "professorName" | "specialty" | "style">
): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: uuidv4(),
    title: data.title,
    professorName: data.professorName,
    specialty: data.specialty,
    style: data.style,
    status: "draft",
    currentStep: "script",
    createdAt: now,
    updatedAt: now,
    script: "",
    characterPrompt: `Medical professor ${data.professorName}, specialist in ${data.specialty}`,
    characterImageUrl: null,
    voiceId: "french-male-1",
    voiceAudioUrl: null,
    animationVideoUrl: null,
    subtitles: "",
  };

  const projects = readProjects();
  projects.push(project);
  writeProjects(projects);
  return project;
}

export function updateProjectClient(
  id: string,
  updates: Partial<Project>
): Project | null {
  const projects = readProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return null;

  projects[index] = sanitizeProject({
    ...projects[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  writeProjects(projects);
  return projects[index];
}

export function deleteProjectClient(id: string): boolean {
  const projects = readProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  writeProjects(filtered);
  return true;
}
