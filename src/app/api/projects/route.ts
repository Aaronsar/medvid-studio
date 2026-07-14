import { NextResponse } from "next/server";
import {
  getAllProjects,
  createProject,
} from "@/lib/projects";

export async function GET() {
  const projects = await getAllProjects();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, professorName, specialty, style } = body;

  if (!title || !professorName || !specialty) {
    return NextResponse.json(
      { error: "title, professorName et specialty sont requis" },
      { status: 400 }
    );
  }

  const project = await createProject({
    title,
    professorName,
    specialty,
    style: style ?? "pixar",
  });

  return NextResponse.json(project, { status: 201 });
}
