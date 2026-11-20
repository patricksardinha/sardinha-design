// Logique pure des jetons : validation, normalisation et génération du CSS.
// Aucune dépendance, aucun accès au disque : utilisable par Node (build-tokens,
// tests, plugin Vite) comme par le navigateur (studio).

/** Catégories de jetons, dans l'ordre canonique de sortie. */
export const CATEGORIES = [
  {
    key: "color",
    kind: "color",
    themed: true,
    cssPrefix: "color",
    label: "Couleurs",
    required: [
      "background",
      "surface",
      "surfaceMuted",
      "text",
      "textMuted",
      "border",
      "accent",
      "onAccent",
      "success",
      "warning",
      "danger",
      "focus",
      "overlay",
    ],
  },
  { key: "font", kind: "font", cssPrefix: "font", label: "Polices", required: ["sans", "mono"] },
  {
    key: "fontSize",
    kind: "length",
    positive: true,
    cssPrefix: "font-size",
    label: "Tailles de texte",
    required: ["xs", "sm", "md", "lg", "xl"],
  },
  {
    key: "space",
    kind: "length",
    cssPrefix: "space",
    label: "Espacements",
    required: ["xxs", "xs", "sm", "md", "lg", "xl"],
  },
  { key: "radius", kind: "length", cssPrefix: "radius", label: "Arrondis", required: ["sm", "md", "lg", "pill"] },
  {
    key: "borderWidth",
    kind: "length",
    cssPrefix: "border-width",
    label: "Épaisseurs de bordure",
    required: ["thin", "thick"],
  },
  { key: "shadow", kind: "shadow", cssPrefix: "shadow", label: "Ombres", required: ["sm", "md", "lg"] },
  {
    key: "duration",
    kind: "duration",
    cssPrefix: "duration",
    label: "Durées d'animation",
    required: ["fast", "normal", "slow"],
  },
];

export const THEMES = ["light", "dark"];
export const DESCRIPTION_KEY = "$description";

const NAME_RE = /^[a-z][a-zA-Z0-9]*$/;
const COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const LENGTH_RE = /^(?:0|(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em))$/;
const DURATION_RE = /^(?:\d+(?:\.\d+)?|\.\d+)(?:ms|s)$/;
const FORBIDDEN_CHARS_RE = /[;{}<>\\]/;
const SHADOW_LENGTH_RE = /(?:^|[\s(,])-?(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em)|(?:^|\s)0(?=\s|$)/g;

const isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const typeName = (v) => (v === null ? "null" : Array.isArray(v) ? "tableau" : typeof v);

/** camelCase → kebab-case : fontSize → font-size. */
export function kebab(name) {
  return name.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

/** Nom de la variable CSS d'un jeton : cssVarName("fontSize", "lg") → "--font-size-lg". */
export function cssVarName(categoryKey, name) {
  const cat = CATEGORIES.find((c) => c.key === categoryKey);
  const prefix = cat ? cat.cssPrefix : kebab(categoryKey);
  return `--${prefix}-${kebab(name)}`;
}

function balanced(value) {
  let depth = 0;
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth < 0) return false;
  }
  if (depth !== 0) return false;
  return (value.split('"').length - 1) % 2 === 0 && (value.split("'").length - 1) % 2 === 0;
}

/**
 * Vérifie une valeur selon le type de sa catégorie.
 * Rend { value } (normalisée) ou { error } (message en français).
 */
export function checkValue(kind, raw, options = {}) {
  if (typeof raw !== "string") {
    return { error: `doit être une chaîne de caractères (reçu : ${typeName(raw)})` };
  }
  const value = raw.trim();
  if (value === "") return { error: "valeur vide" };
  switch (kind) {
    case "color":
      if (!COLOR_RE.test(value)) {
        return { error: `couleur invalide « ${value} » : attendu #rgb, #rgba, #rrggbb ou #rrggbbaa (hexadécimal)` };
      }
      return { value: value.toLowerCase() };
    case "length":
      if (!LENGTH_RE.test(value)) {
        return {
          error: `taille invalide « ${value} » : attendu un nombre positif suivi de px, rem ou em (ex. 12px, 1.5rem) ou 0`,
        };
      }
      if (options.positive && parseFloat(value) === 0) {
        return { error: `taille invalide « ${value} » : doit être strictement positive` };
      }
      return { value };
    case "duration":
      if (!DURATION_RE.test(value)) {
        return { error: `durée invalide « ${value} » : attendu un nombre positif suivi de ms ou s (ex. 200ms, 0.3s)` };
      }
      return { value };
    case "font":
      if (FORBIDDEN_CHARS_RE.test(value) || !balanced(value)) {
        return { error: `police invalide « ${value} » : caractères interdits (; { } < > \\) ou guillemets non fermés` };
      }
      return { value };
    case "shadow": {
      if (FORBIDDEN_CHARS_RE.test(value) || !balanced(value)) {
        return { error: `ombre invalide « ${value} » : caractères interdits (; { } < > \\) ou parenthèses non fermées` };
      }
      if (value === "none") return { value };
      const lengths = value.match(SHADOW_LENGTH_RE) || [];
      if (lengths.length < 2) {
        return { error: `ombre invalide « ${value} » : attendu « none » ou au moins deux décalages (ex. 0 4px 12px #0003)` };
      }
      return { value };
    }
    default:
      return { error: `type inconnu « ${kind} »` };
  }
}

function checkGroup(group, path, cat, errors) {
  const out = {};
  for (const [name, raw] of Object.entries(group)) {
    const p = `${path}.${name}`;
    if (!NAME_RE.test(name)) {
      errors.push({
        path: p,
        message: `nom illégal « ${name} » : lettres et chiffres en camelCase, commençant par une minuscule (ex. surfaceMuted, xl)`,
      });
      continue;
    }
    const res = checkValue(cat.kind, raw, cat);
    if (res.error) errors.push({ path: p, message: res.error });
    else out[name] = res.value;
  }
  return out;
}

function checkRequired(names, path, cat, errors) {
  for (const req of cat.required) {
    if (!names.includes(req)) {
      errors.push({ path: `${path}.${req}`, message: "jeton manquant : il est requis par les composants" });
    }
  }
}

/**
 * Valide un objet de jetons.
 * Rend { ok: true, tokens } (copie normalisée, ordre canonique) ou { ok: false, errors: [{ path, message }] }.
 */
export function validateTokens(input) {
  const errors = [];
  if (!isPlainObject(input)) {
    return { ok: false, errors: [{ path: "(racine)", message: `doit être un objet JSON (reçu : ${typeName(input)})` }] };
  }
  const known = CATEGORIES.map((c) => c.key);
  for (const key of Object.keys(input)) {
    if (key === DESCRIPTION_KEY) {
      if (typeof input[key] !== "string") errors.push({ path: key, message: "doit être une chaîne de caractères" });
      continue;
    }
    if (!known.includes(key)) {
      errors.push({ path: key, message: `catégorie inconnue (catégories permises : ${known.join(", ")})` });
    }
  }

  const tokens = {};
  if (typeof input[DESCRIPTION_KEY] === "string") tokens[DESCRIPTION_KEY] = input[DESCRIPTION_KEY];

  for (const cat of CATEGORIES) {
    const group = input[cat.key];
    if (group === undefined) {
      errors.push({ path: cat.key, message: "catégorie manquante" });
      continue;
    }
    if (!isPlainObject(group)) {
      errors.push({ path: cat.key, message: `doit être un objet (reçu : ${typeName(group)})` });
      continue;
    }
    const outGroup = {};
    if (DESCRIPTION_KEY in group) {
      if (typeof group[DESCRIPTION_KEY] !== "string") {
        errors.push({ path: `${cat.key}.${DESCRIPTION_KEY}`, message: "doit être une chaîne de caractères" });
      } else outGroup[DESCRIPTION_KEY] = group[DESCRIPTION_KEY];
    }
    const entries = Object.fromEntries(Object.entries(group).filter(([k]) => k !== DESCRIPTION_KEY));

    if (cat.themed) {
      for (const key of Object.keys(entries)) {
        if (!THEMES.includes(key)) {
          errors.push({ path: `${cat.key}.${key}`, message: `thème inconnu (thèmes permis : ${THEMES.join(", ")})` });
        }
      }
      const themes = {};
      for (const theme of THEMES) {
        const t = entries[theme];
        if (t === undefined) {
          errors.push({ path: `${cat.key}.${theme}`, message: "thème manquant" });
        } else if (!isPlainObject(t)) {
          errors.push({ path: `${cat.key}.${theme}`, message: `doit être un objet (reçu : ${typeName(t)})` });
        } else {
          themes[theme] = t;
        }
      }
      if (themes.light && themes.dark) {
        const lightKeys = Object.keys(themes.light);
        const darkKeys = Object.keys(themes.dark);
        for (const k of lightKeys) {
          if (!darkKeys.includes(k)) {
            errors.push({ path: `${cat.key}.dark.${k}`, message: "clé manquante dans le thème sombre (présente dans le thème clair)" });
          }
        }
        for (const k of darkKeys) {
          if (!lightKeys.includes(k)) {
            errors.push({ path: `${cat.key}.light.${k}`, message: "clé manquante dans le thème clair (présente dans le thème sombre)" });
          }
        }
      }
      for (const theme of THEMES) {
        if (!themes[theme]) continue;
        checkRequired(Object.keys(themes[theme]), `${cat.key}.${theme}`, cat, errors);
        const checked = checkGroup(themes[theme], `${cat.key}.${theme}`, cat, errors);
        // Le thème sombre suit l'ordre du thème clair : sortie stable.
        const order = Object.keys(themes.light || themes[theme]);
        const ordered = {};
        for (const k of order) if (k in checked) ordered[k] = checked[k];
        for (const k of Object.keys(checked)) if (!(k in ordered)) ordered[k] = checked[k];
        outGroup[theme] = ordered;
      }
    } else {
      checkRequired(Object.keys(entries), cat.key, cat, errors);
      Object.assign(outGroup, checkGroup(entries, cat.key, cat, errors));
    }
    tokens[cat.key] = outGroup;
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, tokens };
}

/** Met les erreurs en texte lisible, une par ligne. */
export function formatErrors(errors) {
  return errors.map((e) => `  ✗ ${e.path} : ${e.message}`).join("\n");
}

function entriesOf(group) {
  return Object.entries(group).filter(([k]) => k !== DESCRIPTION_KEY);
}

/**
 * Génère le CSS à partir de jetons normalisés (sortie de validateTokens).
 * Déterministe : l'ordre suit l'ordre canonique des catégories puis celui du fichier.
 */
export function generateCss(tokens) {
  const lines = [
    "/* sardinha-design — jetons générés depuis tokens.json par `npm run build:tokens`.",
    "   Ne pas modifier à la main : éditer tokens.json (ou `npm run studio`). */",
    "",
    ":root {",
  ];
  for (const cat of CATEGORIES) {
    if (cat.themed) continue;
    for (const [name, value] of entriesOf(tokens[cat.key])) {
      lines.push(`  ${cssVarName(cat.key, name)}: ${value};`);
    }
  }
  lines.push("}", "");
  const colorCat = CATEGORIES.find((c) => c.themed);
  const selectors = { light: ':root,\n[data-theme="light"]', dark: '[data-theme="dark"]' };
  for (const theme of THEMES) {
    lines.push(`${selectors[theme]} {`, `  color-scheme: ${theme};`);
    for (const [name, value] of entriesOf(tokens[colorCat.key][theme])) {
      lines.push(`  ${cssVarName(colorCat.key, name)}: ${value};`);
    }
    lines.push("}", "");
  }
  return lines.join("\n");
}

/** JSON normalisé, indenté, terminé par un saut de ligne. */
export function serializeTokens(tokens) {
  return JSON.stringify(tokens, null, 2) + "\n";
}

/** Liste de toutes les variables CSS que produisent les jetons requis. */
export function requiredCssVars() {
  const vars = [];
  for (const cat of CATEGORIES) for (const name of cat.required) vars.push(cssVarName(cat.key, name));
  return vars;
}
