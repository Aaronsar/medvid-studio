/**
 * Transforme un script avec indications scéniques en texte Eleven v3.
 * Les tags [sighs], [short pause], etc. sont interprétés — pas lus mot pour mot.
 */

const V3_TAG =
  /\[(sighs?|laughs?|whispers?|short pause|long pause|pause|angry|excited|clears throat)\]/i;

const PRODUCTION_HEADER =
  /^\s*[\[*#_]*\s*\[?\s*(intro|outro|scène|scene|plan|cut|fin)\b[^[\]\n]*[\]*_]*\s*$/i;

const STANDALONE_BRACKETS = /^\s*\[\s*([^[\]]+)\s*\]\s*$/i;
const STANDALONE_PARENS = /^\s*\(\s*([^()]+)\s*\)\s*$/i;

const INLINE_DIRECTION =
  /[\[(]\s*([^)\]]{2,60})\s*[\])]/gi;

const DIRECTION_TO_TAG: Array<{ pattern: RegExp; tag: string }> = [
  { pattern: /\bsoupir(e|s)?\b/i, tag: "[sighs]" },
  { pattern: /\brire?s?\b/i, tag: "[laughs]" },
  { pattern: /\bchuchot(e|ement|ements)?\b/i, tag: "[whispers]" },
  { pattern: /(énerv|enerve|agac|col[eè]re|furieux)/i, tag: "[angry]" },
  { pattern: /\b(longue\s+pause|pause\s+longue)\b/i, tag: "[long pause]" },
  { pattern: /\b(courte\s+pause|pause\s+courte)\b/i, tag: "[short pause]" },
  { pattern: /\bpause\b/i, tag: "[short pause]" },
  { pattern: /\bsilence\b/i, tag: "[short pause]" },
];

function directionsToTags(text: string): string {
  const tags: string[] = [];
  for (const { pattern, tag } of DIRECTION_TO_TAG) {
    if (pattern.test(text)) {
      tags.push(tag);
      text = text.replace(pattern, " ");
    }
  }
  return tags.join(" ").trim();
}

function isProductionOnlyLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (PRODUCTION_HEADER.test(trimmed)) return true;
  if (/^\*\*[^*]+\*\*$/.test(trimmed) && /caméra|bras croisés|face caméra|plan|scène/i.test(trimmed)) {
    return true;
  }
  if (/^#{1,3}\s/.test(trimmed)) return true;
  return false;
}

function extractStandaloneDirection(line: string): string | null {
  return (
    STANDALONE_BRACKETS.exec(line)?.[1] ??
    STANDALONE_PARENS.exec(line)?.[1] ??
    null
  );
}

function isStageDirectionOnly(line: string): boolean {
  const inner = extractStandaloneDirection(line);
  if (!inner) return false;
  if (V3_TAG.test(inner)) return true;
  const tags = directionsToTags(inner);
  if (!tags) return false;
  let remainder = inner;
  for (const { pattern } of DIRECTION_TO_TAG) {
    remainder = remainder.replace(pattern, " ");
  }
  remainder = remainder
    .replace(/[,;.\-–—+()]/g, " ")
    .replace(/\b(et|puis|plus|encore|un\s+peu)\b/gi, " ")
    .trim();
  return remainder.split(/\s+/).filter(Boolean).length === 0;
}

function stripMarkdown(line: string): string {
  return line
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,3}\s+/, "");
}

function cleanInlineDirections(line: string): string {
  return line.replace(INLINE_DIRECTION, (_, inner: string) => {
    if (V3_TAG.test(inner)) return `[${inner.replace(/^\[|\]$/g, "")}]`;
    const tags = directionsToTags(inner);
    return tags || "";
  });
}

/** Texte prêt pour Eleven v3 (tags audio + dialogue). */
export function prepareScriptForSpeech(text: string): string {
  const parts: string[] = [];

  for (const rawLine of text.split("\n")) {
    const line = stripMarkdown(rawLine.trim());
    if (!line || isProductionOnlyLine(line)) continue;

    if (isStageDirectionOnly(line)) {
      const inner = extractStandaloneDirection(line) ?? line;
      const tags = directionsToTags(inner);
      if (tags) parts.push(tags);
      continue;
    }

    let spoken = cleanInlineDirections(line);
    spoken = spoken.replace(/\s+/g, " ").trim();
    if (spoken) parts.push(spoken);
  }

  return parts
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

/** Compte les mots parlés (hors indications scéniques). */
export function countSpokenWords(text: string): number {
  const spoken = prepareScriptForSpeech(text);
  return spoken
    .replace(/\[[^\]]+\]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
