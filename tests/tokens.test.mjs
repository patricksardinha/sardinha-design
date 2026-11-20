import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildTokens, ROOT } from "../scripts/build-tokens.mjs";
import { cssVarName, formatErrors, generateCss, validateTokens } from "../scripts/tokens-lib.mjs";

const fixture = () => JSON.parse(readFileSync(join(ROOT, "tests", "fixtures", "tokens.sample.json"), "utf8"));

/** Valide une version modifiée du jeu d'essai et rend les erreurs. */
function errorsAfter(mutate) {
  const t = fixture();
  mutate(t);
  const r = validateTokens(t);
  expect(r.ok).toBe(false);
  return r.errors;
}

describe("génération déterministe", () => {
  it("le jeu d'essai est valide", () => {
    expect(validateTokens(fixture()).ok).toBe(true);
  });

  it("mêmes jetons → même CSS (snapshot)", async () => {
    const a = validateTokens(fixture());
    const b = validateTokens(fixture());
    if (!a.ok || !b.ok) throw new Error("jeu d'essai invalide");
    const css = generateCss(a.tokens);
    expect(generateCss(b.tokens)).toBe(css);
    await expect(css).toMatchFileSnapshot("./__snapshots__/tokens.sample.css");
  });

  it("l'ordre du thème sombre suit celui du thème clair", () => {
    const t = fixture();
    const reversed = Object.fromEntries(Object.entries(t.color.dark).reverse());
    t.color.dark = reversed;
    const a = validateTokens(fixture());
    const b = validateTokens(t);
    if (!a.ok || !b.ok) throw new Error("invalide");
    expect(generateCss(b.tokens)).toBe(generateCss(a.tokens));
  });

  it("thème clair sous :root, sombre sous [data-theme=\"dark\"]", () => {
    const r = validateTokens(fixture());
    if (!r.ok) throw new Error("invalide");
    const css = generateCss(r.tokens);
    expect(css).toMatch(/:root,\n\[data-theme="light"\] \{\n {2}color-scheme: light;\n {2}--color-background: #ffffff;/);
    expect(css).toMatch(/\[data-theme="dark"\] \{\n {2}color-scheme: dark;\n {2}--color-background: #101010;/);
    expect(css).toContain("--font-size-lg: 1.25rem;");
    expect(css).toContain("--border-width-thin: 1px;");
    expect(cssVarName("fontSize", "xxl")).toBe("--font-size-xxl");
  });

  it("normalise les couleurs en minuscules", () => {
    const t = fixture();
    t.color.light.accent = "#ABCDEF";
    const r = validateTokens(t);
    if (!r.ok) throw new Error("invalide");
    expect(r.tokens.color.light.accent).toBe("#abcdef");
  });

  it("buildTokens écrit dist/tokens.css et dist/tokens.json, deux fois à l'identique", () => {
    const dir = mkdtempSync(join(tmpdir(), "sd-"));
    const input = join(dir, "tokens.json");
    writeFileSync(input, JSON.stringify(fixture()));
    const first = buildTokens({ input, outDir: join(dir, "dist") });
    const css1 = readFileSync(join(dir, "dist", "tokens.css"), "utf8");
    const second = buildTokens({ input, outDir: join(dir, "dist") });
    expect(first.ok && second.ok).toBe(true);
    expect(readFileSync(join(dir, "dist", "tokens.css"), "utf8")).toBe(css1);
    expect(JSON.parse(readFileSync(join(dir, "dist", "tokens.json"), "utf8")).space.md).toBe("12px");
  });

  it("le dist/ commité correspond à tokens.json (npm run build:tokens a été lancé)", () => {
    const r = validateTokens(JSON.parse(readFileSync(join(ROOT, "tokens.json"), "utf8")));
    if (!r.ok) throw new Error(formatErrors(r.errors));
    expect(readFileSync(join(ROOT, "dist", "tokens.css"), "utf8")).toBe(generateCss(r.tokens));
  });
});

describe("refus des jetons invalides, avec chemin et raison", () => {
  const cases = [
    ["couleur mal formée", (t) => (t.color.light.accent = "#12345"), "color.light.accent", /couleur invalide « #12345 »/],
    ["couleur nommée", (t) => (t.color.dark.text = "white"), "color.dark.text", /couleur invalide/],
    ["taille sans unité", (t) => (t.space.md = "12"), "space.md", /taille invalide « 12 ».*px, rem ou em/],
    ["taille unité inconnue", (t) => (t.radius.md = "8pt"), "radius.md", /taille invalide/],
    ["taille négative", (t) => (t.space.sm = "-4px"), "space.sm", /taille invalide/],
    ["taille de texte nulle", (t) => (t.fontSize.xs = "0"), "fontSize.xs", /strictement positive/],
    ["durée invalide", (t) => (t.duration.fast = "fast"), "duration.fast", /durée invalide « fast »/],
    ["durée sans unité", (t) => (t.duration.slow = "300"), "duration.slow", /ms ou s/],
    ["clé manquante dans le thème sombre", (t) => {
      t.color.light.brand = "#ff0000";
    }, "color.dark.brand", /clé manquante dans le thème sombre/],
    ["clé manquante dans le thème clair", (t) => {
      t.color.dark.brand = "#ff0000";
    }, "color.light.brand", /clé manquante dans le thème clair/],
    ["nom illégal (tiret)", (t) => (t.space["extra-large"] = "48px"), "space.extra-large", /nom illégal/],
    ["nom illégal (chiffre en tête)", (t) => (t.fontSize["2xl"] = "2rem"), "fontSize.2xl", /nom illégal/],
    ["jeton requis supprimé", (t) => delete t.color.dark.accent, "color.dark.accent", /requis par les composants/],
    ["catégorie inconnue", (t) => (t.zIndex = { top: "10" }), "zIndex", /catégorie inconnue/],
    ["catégorie manquante", (t) => delete t.duration, "duration", /catégorie manquante/],
    ["thème inconnu", (t) => (t.color.sepia = {}), "color.sepia", /thème inconnu/],
    ["valeur non textuelle", (t) => (t.space.lg = 16), "space.lg", /chaîne de caractères \(reçu : number\)/],
    ["police avec injection CSS", (t) => (t.font.sans = "Inter; } body { color: red"), "font.sans", /police invalide/],
    ["ombre sans décalage", (t) => (t.shadow.md = "#000"), "shadow.md", /ombre invalide/],
  ];

  for (const [label, mutate, path, message] of cases) {
    it(label, () => {
      const errors = errorsAfter(mutate);
      const hit = errors.find((e) => e.path === path && message.test(e.message));
      expect(hit, `attendu une erreur ${message} sur ${path}, reçu :\n${formatErrors(errors)}`).toBeDefined();
    });
  }

  it("le CLI refuse, n'écrit rien et affiche un message clair", async () => {
    const { execFileSync } = await import("node:child_process");
    const dir = mkdtempSync(join(tmpdir(), "sd-"));
    const t = fixture();
    t.space.md = "12";
    writeFileSync(join(dir, "tokens.json"), JSON.stringify(t));
    let stderr = "";
    let code = 0;
    try {
      execFileSync("node", [join(ROOT, "scripts", "build-tokens.mjs"), join(dir, "tokens.json"), join(dir, "dist")], {
        stdio: "pipe",
      });
    } catch (err) {
      code = err.status;
      stderr = String(err.stderr);
    }
    expect(code).toBe(1);
    expect(stderr).toContain("space.md : taille invalide « 12 »");
    expect(existsSync(join(dir, "dist", "tokens.css"))).toBe(false);
  });

  it("JSON mal formé", () => {
    const dir = mkdtempSync(join(tmpdir(), "sd-"));
    writeFileSync(join(dir, "tokens.json"), "{ \"color\": ");
    const r = buildTokens({ input: join(dir, "tokens.json"), outDir: join(dir, "dist") });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0].message).toMatch(/JSON invalide/);
  });
});
