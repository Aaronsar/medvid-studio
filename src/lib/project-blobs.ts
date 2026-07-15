import type { Project } from "./types";

const DB_NAME = "medvid-studio-v1";
const STORE = "characters";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function characterBlobRef(projectId: string): string {
  return `idb:character:${projectId}`;
}

export function isCharacterBlobRef(url: string | null | undefined): boolean {
  return !!url?.startsWith("idb:character:");
}

export async function saveCharacterImage(
  projectId: string,
  dataUrl: string
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, `character:${projectId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadCharacterImage(
  projectId: string
): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.get(`character:${projectId}`);
    req.onsuccess = () => {
      const result = req.result as string | undefined;
      if (result) {
        resolve(result);
        return;
      }
      const legacy = store.get(projectId);
      legacy.onsuccess = () => resolve((legacy.result as string) ?? null);
      legacy.onerror = () => reject(legacy.error);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveVoiceAudio(
  projectId: string,
  dataUrl: string
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, `voice:${projectId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadVoiceAudio(
  projectId: string
): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(`voice:${projectId}`);
    req.onsuccess = () => resolve((req.result as string) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCharacterImage(projectId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(`character:${projectId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function resolveCharacterImage(
  projectId: string,
  url: string | null
): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  if (isCharacterBlobRef(url)) return loadCharacterImage(projectId);
  return null;
}

export async function hydrateProject(project: Project): Promise<Project> {
  if (project.characterImageUrl?.startsWith("data:")) {
    await saveCharacterImage(project.id, project.characterImageUrl);
    return {
      ...project,
      characterImageUrl: await loadCharacterImage(project.id),
    };
  }

  if (!isCharacterBlobRef(project.characterImageUrl)) {
    return project;
  }

  const image = await loadCharacterImage(project.id);
  return { ...project, characterImageUrl: image };
}
