export async function parseApiResponse<T = Record<string, unknown>>(
  res: Response
): Promise<{ ok: boolean; status: number; data: T }> {
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) as T };
  } catch {
    const hint = text.slice(0, 80).replace(/\s+/g, " ");
    throw new Error(
      res.status === 413
        ? "Fichier trop volumineux. L'upload est en cours de préparation — réessayez dans quelques secondes."
        : `Erreur serveur (${res.status}) : ${hint}`
    );
  }
}
