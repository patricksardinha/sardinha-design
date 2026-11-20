import { useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CATEGORIES, type CategoryInfo, type ThemeName, type TokenError } from "../scripts/tokens-lib.mjs";
import {
  addToken,
  checkNewName,
  defaultValue,
  descriptionOf,
  formatNumber,
  groupOf,
  parseNumeric,
  removeToken,
  setToken,
  sliderRange,
  splitHex,
  tokenNames,
  type Doc,
} from "./tokenModel";

interface EditorProps {
  doc: Doc;
  savedDoc: Doc;
  errors: TokenError[];
  onChange: (doc: Doc) => void;
}

const THEME_LABEL: Record<ThemeName, string> = { light: "Clair", dark: "Sombre" };

export function TokenEditor({ doc, savedDoc, errors, onChange }: EditorProps) {
  const reduce = useReducedMotion();
  return (
    <div className="ed">
      {CATEGORIES.map((cat, i) => (
        <motion.section
          key={cat.key}
          className="ed-cat"
          id={`cat-${cat.key}`}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.04 * i, type: "spring", stiffness: 260, damping: 26 }}
        >
          <header className="ed-cat__head">
            <h2>{cat.label}</h2>
            <code>{cat.key}</code>
          </header>
          {descriptionOf(doc, cat.key) ? <p className="ed-cat__desc">{descriptionOf(doc, cat.key)}</p> : null}
          <ul className="ed-rows">
            <AnimatePresence initial={false}>
              {tokenNames(doc, cat.key).map((name) => (
                <motion.li
                  key={name}
                  layout={!reduce}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: -24, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24, height: 0, marginBottom: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                >
                  <TokenRow
                    cat={cat}
                    name={name}
                    doc={doc}
                    savedDoc={savedDoc}
                    errors={errors.filter(
                      (e) => e.path === `${cat.key}.${name}` || e.path === `${cat.key}.light.${name}` || e.path === `${cat.key}.dark.${name}`,
                    )}
                    onChange={onChange}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <AddToken cat={cat} doc={doc} onChange={onChange} />
        </motion.section>
      ))}
    </div>
  );
}

interface RowProps {
  cat: CategoryInfo;
  name: string;
  doc: Doc;
  savedDoc: Doc;
  errors: TokenError[];
  onChange: (doc: Doc) => void;
}

function TokenRow({ cat, name, doc, savedDoc, errors, onChange }: RowProps) {
  const required = cat.required.includes(name);
  const themes: (ThemeName | undefined)[] = cat.themed ? ["light", "dark"] : [undefined];
  const changed = themes.some((t) => groupOf(doc, cat.key, t)[name] !== groupOf(savedDoc, cat.key, t)[name]);
  const isNew = themes.every((t) => groupOf(savedDoc, cat.key, t)[name] === undefined);

  return (
    <div className={`ed-row${errors.length ? " ed-row--error" : ""}`} data-token={`${cat.key}.${name}`}>
      <div className="ed-row__head">
        <span className="ed-row__name">{name}</span>
        {isNew ? (
          <span className="ed-badge ed-badge--new">nouveau</span>
        ) : changed ? (
          <span className="ed-badge">modifié</span>
        ) : null}
        <button
          type="button"
          className="ed-del"
          disabled={required}
          title={required ? "Requis par les composants : ne peut pas être supprimé" : `Supprimer ${name}`}
          aria-label={required ? `${name} (requis, non supprimable)` : `Supprimer le jeton ${name}`}
          onClick={() => onChange(removeToken(doc, cat.key, name))}
        >
          {required ? "🔒" : "×"}
        </button>
      </div>
      <div className={cat.themed ? "ed-row__themes" : "ed-row__body"}>
        {themes.map((theme) => {
          const value = groupOf(doc, cat.key, theme)[name] ?? "";
          const set = (v: string) => onChange(setToken(doc, cat.key, name, v, theme));
          const label = theme ? `${name} — ${THEME_LABEL[theme]}` : name;
          return (
            <div key={theme ?? "single"} className="ed-control">
              {theme ? <span className="ed-control__theme">{THEME_LABEL[theme]}</span> : null}
              <ValueControl kind={cat.kind} catKey={cat.key} value={value} label={label} onSet={set} />
            </div>
          );
        })}
      </div>
      {errors.map((e) => (
        <p key={e.path + e.message} className="ed-row__error" role="alert">
          {e.path} : {e.message}
        </p>
      ))}
    </div>
  );
}

interface ControlProps {
  kind: CategoryInfo["kind"];
  catKey: string;
  value: string;
  label: string;
  onSet: (value: string) => void;
}

function ValueControl({ kind, catKey, value, label, onSet }: ControlProps) {
  if (kind === "color") {
    const split = splitHex(value);
    return (
      <div className="ed-color">
        <label className="ed-pipette" style={{ background: split ? value : "transparent" }}>
          <input
            type="color"
            aria-label={`Pipette ${label}`}
            value={split ? split.rgb : "#000000"}
            onChange={(e) => onSet(e.target.value + (split ? split.alpha : ""))}
          />
        </label>
        <input
          className="ed-text ed-text--mono"
          aria-label={`Valeur ${label}`}
          value={value}
          spellCheck={false}
          onChange={(e) => onSet(e.target.value)}
        />
      </div>
    );
  }
  if (kind === "length" || kind === "duration") {
    const parsed = parseNumeric(value);
    const unit = parsed?.unit || (kind === "duration" ? "ms" : "px");
    const range = sliderRange(catKey, unit);
    const max = Math.max(range.max, parsed?.num ?? 0);
    return (
      <div className="ed-slider">
        <input
          type="range"
          aria-label={`Curseur ${label}`}
          min={range.min}
          max={max}
          step={range.step}
          value={parsed?.num ?? range.min}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            onSet(n === 0 && kind === "length" ? "0" : `${formatNumber(n)}${unit}`);
          }}
        />
        <input
          className="ed-text ed-text--mono ed-text--short"
          aria-label={`Valeur ${label}`}
          value={value}
          spellCheck={false}
          onChange={(e) => onSet(e.target.value)}
        />
      </div>
    );
  }
  return (
    <input
      className={`ed-text${kind === "font" ? "" : " ed-text--mono"}`}
      aria-label={`Valeur ${label}`}
      value={value}
      spellCheck={false}
      onChange={(e) => onSet(e.target.value)}
    />
  );
}

function AddToken({ cat, doc, onChange }: { cat: CategoryInfo; doc: Doc; onChange: (doc: Doc) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const problem = checkNewName(doc, cat.key, trimmed);
    setError(problem);
    if (problem) return;
    onChange(addToken(doc, cat.key, trimmed, defaultValue(cat.key)));
    setName("");
  }

  return (
    <form className="ed-add" onSubmit={submit}>
      <input
        className="ed-text"
        aria-label={`Nom du nouveau jeton (${cat.label})`}
        placeholder="nouveauJeton"
        value={name}
        spellCheck={false}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
      />
      <button type="submit" className="st-btn st-btn--ghost">
        + Ajouter
      </button>
      {error ? (
        <p className="ed-add__error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
