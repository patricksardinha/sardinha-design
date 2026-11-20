#!/usr/bin/env node
// Refuse toute couleur ou taille écrite en dur dans les composants :
// hexadécimal, rgb()/rgba()/hsl()/hsla(), couleurs nommées courantes, et px/rem/em.
// Les composants ne doivent utiliser que les variables CSS des jetons.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const COMPONENTS_DIR = join(ROOT, "src", "components");

const RULES = [
  { re: /#[0-9a-fA-F]{3,8}\b/g, why: "couleur hexadécimale en dur" },
  { re: /\b(?:rgba?|hsla?|hwb|lab|lch|oklch|oklab)\s*\(/g, why: "couleur fonctionnelle en dur" },
  {
    re: /(?<![-\w])(?:white|black|red|green|blue|gray|grey|orange|yellow|purple|pink)(?![-\w])/g,
    why: "couleur nommée en dur",
    cssOnly: true,
  },
  { re: /(?<![\w.-])-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em|vh|vw|pt)\b/g, why: "taille en dur" },
];

/** Retire les commentaires (/* *\/ et //) en conservant les sauts de ligne. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`])\/\/.*$/gm, (m, p) => p + " ".repeat(m.length - p.length));
}

/** Cherche les valeurs en dur dans un texte. Rend [{ line, match, why }]. */
export function findHardcoded(text, { isCss = true } = {}) {
  const clean = stripComments(text);
  const found = [];
  const lines = clean.split("\n");
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.cssOnly && !isCss) continue;
      for (const m of line.matchAll(rule.re)) found.push({ line: i + 1, match: m[0], why: rule.why });
    }
  });
  return found;
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return listFiles(p);
    return [".css", ".tsx", ".ts"].includes(extname(p)) ? [p] : [];
  });
}

/** Analyse tout le dossier des composants. */
export function scanComponents(dir = COMPONENTS_DIR) {
  const problems = [];
  for (const file of listFiles(dir)) {
    const isCss = extname(file) === ".css";
    for (const p of findHardcoded(readFileSync(file, "utf8"), { isCss })) {
      problems.push({ file: relative(ROOT, file), ...p });
    }
  }
  return problems;
}

/** Variables CSS utilisées par les composants (var(--x)). */
export function usedCssVars(dir = COMPONENTS_DIR) {
  const vars = new Set();
  for (const file of listFiles(dir)) {
    for (const m of readFileSync(file, "utf8").matchAll(/var\(\s*(--[a-z0-9-]+)/g)) vars.add(m[1]);
  }
  return [...vars].sort();
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isCli) {
  const problems = scanComponents();
  if (problems.length > 0) {
    console.error(`Valeurs en dur interdites dans les composants (${problems.length}) :`);
    for (const p of problems) console.error(`  ✗ ${p.file}:${p.line} — ${p.why} : ${p.match}`);
    console.error("Utilisez les variables CSS des jetons (var(--color-…), var(--space-…)…).");
    process.exit(1);
  }
  console.log("✓ Composants : aucune couleur ni taille en dur.");
}
