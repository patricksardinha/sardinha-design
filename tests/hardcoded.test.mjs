import { describe, expect, it } from "vitest";
import { findHardcoded, scanComponents, usedCssVars } from "../scripts/check-hardcoded.mjs";
import { requiredCssVars } from "../scripts/tokens-lib.mjs";

describe("composants : uniquement des variables CSS", () => {
  it("aucune couleur ni taille en dur dans src/components", () => {
    const problems = scanComponents();
    expect(problems.map((p) => `${p.file}:${p.line} ${p.why} ${p.match}`)).toEqual([]);
  });

  it("chaque variable utilisée correspond à un jeton requis (non supprimable)", () => {
    const required = new Set(requiredCssVars());
    const unknown = usedCssVars().filter((v) => !required.has(v));
    expect(unknown).toEqual([]);
  });

  it("le détecteur repère bien les valeurs en dur", () => {
    const sample = [
      ".a { color: #fff; }",
      ".b { background: rgba(0, 0, 0, 0.5); }",
      ".c { padding: 12px; margin: 1.5rem; }",
      ".d { border-color: white; }",
      ".e { gap: var(--space-md); color: var(--color-text); } /* #abc 4px en commentaire */",
    ].join("\n");
    const found = findHardcoded(sample).map((f) => `${f.line}:${f.match}`);
    expect(found).toEqual(["1:#fff", "2:rgba(", "3:12px", "3:1.5rem", "4:white"]);
  });
});
