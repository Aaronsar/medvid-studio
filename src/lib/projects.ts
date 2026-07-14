import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { Project } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readProjects(): Promise<Project[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(PROJECTS_FILE, "utf-8");
    return JSON.parse(data) as Project[];
  } catch {
    return [];
  }
}

async function writeProjects(projects: Project[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

export async function getAllProjects(): Promise<Project[]> {
  const projects = await readProjects();
  return projects.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getProject(id: string): Promise<Project | null> {
  const projects = await readProjects();
  return projects.find((p) => p.id === id) ?? null;
}

export async function createProject(
  data: Pick<Project, "title" | "professorName" | "specialty" | "style">
): Promise<Project> {
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

  const projects = await readProjects();
  projects.push(project);
  await writeProjects(projects);
  return project;
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project | null> {
  const projects = await readProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return null;

  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeProjects(projects);
  return projects[index];
}

export async function deleteProject(id: string): Promise<boolean> {
  const projects = await readProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  await writeProjects(filtered);
  return true;
}
