// Manipulation du document de jetons dans le studio (fonctions pures, sans React).
import { CATEGORIES, DESCRIPTION_KEY, type CategoryInfo, type ThemeName } from "../scripts/tokens-lib.mjs";

export type Group = Record<string, string>;
export type Doc = Record<string, unknown>;

const NAME_RE = /^[a-z][a-zA-Z0-9]*$/;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function category(key: string): CategoryInfo {
  const cat = CATEGORIES.find((c) => c.key === key);
  if (!cat) throw new Error(`catégorie inconnue : ${key}`);
  return cat;
}

/** Les jetons d'une catégorie (d'un thème pour les couleurs), sans la description. */
export function groupOf(doc: Doc, catKey: string, theme?: ThemeName): Group {
  let raw = doc[catKey];
  if (theme && isObject(raw)) raw = raw[theme];
  if (!isObject(raw)) return {};
  const out: Group = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === DESCRIPTION_KEY) continue;
    out[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}

export function descriptionOf(doc: Doc, catKey: string): string | undefined {
  const raw = doc[catKey];
  return isObject(raw) && typeof raw[DESCRIPTION_KEY] === "string" ? (raw[DESCRIPTION_KEY] as string) : undefined;
}

/** Noms des jetons d'une catégorie, dans l'ordre du fichier (thème clair d'abord). */
export function tokenNames(doc: Doc, catKey: string): string[] {
  if (!category(catKey).themed) return Object.keys(groupOf(doc, catKey));
  const names = Object.keys(groupOf(doc, catKey, "light"));
  for (const n of Object.keys(groupOf(doc, catKey, "dark"))) if (!names.includes(n)) names.push(n);
  return names;
}

function targets(next: Record<string, unknown>, catKey: string, themes: ThemeName[] | null): Record<string, unknown>[] {
  if (!isObject(next[catKey])) next[catKey] = {};
  const group = next[catKey] as Record<string, unknown>;
  if (!themes) return [group];
  return themes.map((t) => {
    if (!isObject(group[t])) group[t] = {};
    return group[t] as Record<string, unknown>;
  });
}

export function setToken(doc: Doc, catKey: string, name: string, value: string, theme?: ThemeName): Doc {
  const next = structuredClone(doc);
  for (const g of targets(next, catKey, theme ? [theme] : null)) g[name] = value;
  return next;
}

export function addToken(doc: Doc, catKey: string, name: string, value: string): Doc {
  const next = structuredClone(doc);
  const themed = category(catKey).themed ? (["light", "dark"] as ThemeName[]) : null;
  for (const g of targets(next, catKey, themed)) g[name] = value;
  return next;
}

export function removeToken(doc: Doc, catKey: string, name: string): Doc {
  const next = structuredClone(doc);
  const themed = category(catKey).themed ? (["light", "dark"] as ThemeName[]) : null;
  for (const g of targets(next, catKey, themed)) delete g[name];
  return next;
}

/** Vérifie un nouveau nom de jeton ; rend un message d'erreur ou null. */
export function checkNewName(doc: Doc, catKey: string, name: string): string | null {
  if (name === "") return "Donnez un nom au jeton.";
  if (!NAME_RE.test(name)) return "Nom en camelCase : lettres et chiffres, commençant par une minuscule (ex. surfaceAlt).";
  if (tokenNames(doc, catKey).includes(name)) return "Ce nom existe déjà dans cette catégorie.";
  return null;
}

export function defaultValue(catKey: string): string {
  switch (category(catKey).kind) {
    case "color":
      return "#8a8f98";
    case "length":
      return catKey === "fontSize" ? "1rem" : "8px";
    case "duration":
      return "250ms";
    case "font":
      return "system-ui, sans-serif";
    case "shadow":
      return "0 2px 8px #00000026";
  }
}

export interface Numeric {
  num: number;
  unit: string;
}

export function parseNumeric(value: string): Numeric | null {
  const m = /^\s*(\d*\.?\d+)\s*(px|rem|em|ms|s)?\s*$/.exec(value);
  if (!m) return null;
  return { num: parseFloat(m[1]), unit: m[2] ?? "" };
}

/** Bornes du curseur selon la catégorie et l'unité. */
export function sliderRange(catKey: string, unit: string): { min: number; max: number; step: number } {
  const relative = unit === "rem" || unit === "em";
  switch (catKey) {
    case "fontSize":
      return relative ? { min: 0.5, max: 5, step: 0.0625 } : { min: 8, max: 80, step: 1 };
    case "space":
      return relative ? { min: 0, max: 6, step: 0.125 } : { min: 0, max: 96, step: 1 };
    case "radius":
      return relative ? { min: 0, max: 4, step: 0.125 } : { min: 0, max: 64, step: 1 };
    case "borderWidth":
      return relative ? { min: 0, max: 0.5, step: 0.0625 } : { min: 0, max: 8, step: 1 };
    case "duration":
      return unit === "s" ? { min: 0, max: 3, step: 0.05 } : { min: 0, max: 2000, step: 10 };
    default:
      return { min: 0, max: 100, step: 1 };
  }
}

export function formatNumber(n: number): string {
  return String(Math.round(n * 10000) / 10000);
}

/** Partie #rrggbb d'une couleur (pour la pipette) et suffixe alpha éventuel. */
export function splitHex(hex: string): { rgb: string; alpha: string } | null {
  const v = hex.trim().toLowerCase();
  if (/^#[0-9a-f]{3,4}$/.test(v)) {
    const full = v
      .slice(1)
      .split("")
      .map((c) => c + c)
      .join("");
    return { rgb: "#" + full.slice(0, 6), alpha: full.slice(6) };
  }
  if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(v)) return { rgb: v.slice(0, 7), alpha: v.slice(7) };
  return null;
}
