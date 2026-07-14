import { NextResponse } from "next/server";
import { getProject, updateProject, deleteProject } from "@/lib/projects";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const project = await updateProject(id, body);
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteProject(id);
  if (!deleted) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
