#!/usr/bin/env node
// Lit tokens.json, le valide strictement, puis écrit dist/tokens.css et dist/tokens.json.
// Usage : npm run build:tokens   (ou node scripts/build-tokens.mjs [entrée] [dossier de sortie])
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { formatErrors, generateCss, serializeTokens, validateTokens } from "./tokens-lib.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Lit et valide un fichier de jetons. Rend { ok, tokens } ou { ok: false, errors }. */
export function readTokensFile(input) {
  let text;
  try {
    text = readFileSync(input, "utf8");
  } catch (err) {
    return { ok: false, errors: [{ path: "(fichier)", message: `lecture impossible de ${input} : ${err.message}` }] };
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    return { ok: false, errors: [{ path: "(fichier)", message: `JSON invalide : ${err.message}` }] };
  }
  return validateTokens(data);
}

/**
 * Construit les livrables. Rend { ok: true, css, json, files } ou { ok: false, errors }.
 * Rien n'est écrit si un jeton est invalide.
 */
export function buildTokens({ input = join(ROOT, "tokens.json"), outDir = join(ROOT, "dist") } = {}) {
  const result = readTokensFile(input);
  if (!result.ok) return result;
  const css = generateCss(result.tokens);
  const json = serializeTokens(result.tokens);
  mkdirSync(outDir, { recursive: true });
  const files = [join(outDir, "tokens.css"), join(outDir, "tokens.json")];
  writeFileSync(files[0], css);
  writeFileSync(files[1], json);
  return { ok: true, css, json, files };
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isCli) {
  const [inputArg, outArg] = process.argv.slice(2);
  const input = inputArg ? resolve(inputArg) : undefined;
  const outDir = outArg ? resolve(outArg) : undefined;
  const result = buildTokens({ input, outDir });
  if (!result.ok) {
    console.error(`Jetons refusés (${result.errors.length} erreur${result.errors.length > 1 ? "s" : ""}) :`);
    console.error(formatErrors(result.errors));
    process.exit(1);
  }
  const count = (result.css.match(/^\s+--/gm) || []).length;
  for (const f of result.files) console.log(`✓ ${relative(process.cwd(), f)}`);
  console.log(`  ${count} variables CSS générées.`);
}
