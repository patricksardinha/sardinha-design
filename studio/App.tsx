import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import tokensFile from "../tokens.json";
import { generateCss, validateTokens, type TokenError } from "../scripts/tokens-lib.mjs";
import { TokenEditor } from "./TokenEditor";
import { Preview } from "./Preview";
import type { Doc } from "./tokenModel";

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; files: string[] }
  | { kind: "error"; errors: TokenError[]; message: string };

const ENDPOINT = "/__tokens";
const initialDoc = tokensFile as Doc;

function cssFor(doc: Doc): string | null {
  const r = validateTokens(doc);
  return r.ok ? generateCss(r.tokens) : null;
}

export function App() {
  const reduce = useReducedMotion();
  const [doc, setDoc] = useState<Doc>(initialDoc);
  const [savedDoc, setSavedDoc] = useState<Doc>(initialDoc);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const lastCss = useRef<string>(cssFor(initialDoc) ?? "");

  // En développement, on relit le fichier sur le disque (il a pu changer depuis le chargement).
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let alive = true;
    fetch(ENDPOINT)
      .then((r) => r.json())
      .then((data: { ok: boolean; tokens?: Doc }) => {
        if (alive && data.ok && data.tokens) {
          setDoc(data.tokens);
          setSavedDoc(data.tokens);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const validation = useMemo(() => validateTokens(doc), [doc]);
  const liveErrors = validation.ok ? [] : validation.errors;
  const css = useMemo(() => {
    if (validation.ok) lastCss.current = generateCss(validation.tokens);
    return lastCss.current;
  }, [validation]);
  const dirty = useMemo(() => JSON.stringify(doc) !== JSON.stringify(savedDoc), [doc, savedDoc]);

  const onSave = useCallback(async () => {
    setSave({ kind: "saving" });
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
      });
      if (!(response.headers.get("content-type") ?? "").includes("application/json")) throw new Error("hors studio");
      const data = (await response.json()) as { ok: boolean; tokens?: Doc; files?: string[]; errors?: TokenError[] };
      if (data.ok && data.tokens) {
        setDoc(data.tokens);
        setSavedDoc(data.tokens);
        setSave({ kind: "saved", files: data.files ?? [] });
      } else {
        const errors = data.errors ?? [];
        setSave({
          kind: "error",
          errors,
          message: `Enregistrement refusé : ${errors.length} jeton${errors.length > 1 ? "s" : ""} invalide${errors.length > 1 ? "s" : ""}. Rien n'a été écrit.`,
        });
      }
    } catch {
      setSave({
        kind: "error",
        errors: [],
        message: "Le serveur du studio ne répond pas. L'enregistrement ne fonctionne qu'avec « npm run studio ».",
      });
    }
  }, [doc]);

  // Ctrl/Cmd + S : enregistrer.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void onSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSave]);

  // Le bandeau de succès s'efface tout seul.
  useEffect(() => {
    if (save.kind !== "saved") return;
    const t = window.setTimeout(() => setSave({ kind: "idle" }), 4500);
    return () => window.clearTimeout(t);
  }, [save]);

  const status = liveErrors.length
    ? { cls: "st-status--error", text: `${liveErrors.length} erreur${liveErrors.length > 1 ? "s" : ""}` }
    : dirty
      ? { cls: "st-status--dirty", text: "Modifications non enregistrées" }
      : import.meta.env.DEV
        ? { cls: "st-status--ok", text: "À jour avec tokens.json" }
        : { cls: "st-status--dirty", text: "Aperçu statique : enregistrement via npm run studio" };

  return (
    <div className="st-app">
      <style>{css}</style>
      <div className="st-backdrop" aria-hidden="true">
        <span className="st-halo st-halo--a" />
        <span className="st-halo st-halo--b" />
        <span className="st-halo st-halo--c" />
      </div>

      <header className="st-top">
        <div className="st-brand">
          <svg className="st-logo" viewBox="0 0 64 32" aria-hidden="true">
            <defs>
              <linearGradient id="st-fish" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#b9e2ff" />
                <stop offset="0.55" stopColor="#6d8cff" />
                <stop offset="1" stopColor="#ff8f70" />
              </linearGradient>
            </defs>
            <path d="M3 16 C 13 4, 35 3, 47 13 L 61 5 L 57 16 L 61 27 L 47 19 C 35 29, 13 28, 3 16 Z" fill="url(#st-fish)" />
            <circle cx="12" cy="14" r="2.2" fill="#0d1018" />
            <path d="M21 9.5 C 25 13, 25 19, 21 22.5" stroke="#0d101866" strokeWidth="1.6" fill="none" />
          </svg>
          <div>
            <h1>
              sardinha<span>·design</span>
            </h1>
            <p className="st-sub">Studio des jetons — clair et sombre, en direct</p>
          </div>
        </div>
        <div className="st-actions">
          <span className={`st-status ${status.cls}`} role="status" aria-live="polite">
            {status.text}
          </span>
          <button
            type="button"
            className="st-btn st-btn--ghost"
            disabled={!dirty || save.kind === "saving"}
            onClick={() => {
              setDoc(savedDoc);
              setSave({ kind: "idle" });
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            className="st-btn st-btn--primary"
            disabled={save.kind === "saving"}
            onClick={() => void onSave()}
            title="Valide, réécrit tokens.json puis régénère dist/ (Ctrl+S)"
          >
            {save.kind === "saving" ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </header>

      <div className="st-notices" aria-live="assertive">
        <AnimatePresence>
          {save.kind === "saved" ? (
            <motion.div
              key="saved"
              className="st-notice st-notice--ok"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              <strong>✓ Enregistré.</strong> {save.files.join(", ")} {save.files.length > 1 ? "ont été réécrits" : "a été réécrit"}.
              Pensez à commiter <code>tokens.json</code> et <code>dist/</code>.
            </motion.div>
          ) : null}
          {save.kind === "error" ? (
            <motion.div
              key={`error-${save.message}-${save.errors.length}`}
              className="st-notice st-notice--error"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -20 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, x: [0, -10, 10, -6, 6, -2, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="st-notice__row">
                <strong>✗ {save.message}</strong>
                <button type="button" className="st-btn st-btn--ghost st-btn--sm" onClick={() => setSave({ kind: "idle" })}>
                  Fermer
                </button>
              </div>
              {save.errors.length ? (
                <ul>
                  {save.errors.map((e) => (
                    <li key={e.path + e.message}>
                      <code>{e.path}</code> : {e.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <main className="st-main">
        <aside className="st-bench" aria-label="Établi : jetons modifiables">
          <TokenEditor doc={doc} savedDoc={savedDoc} errors={liveErrors} onChange={setDoc} />
        </aside>
        <section className="st-proofs" aria-label="Épreuves clair et sombre">
          <Preview theme="light" doc={doc} />
          <Preview theme="dark" doc={doc} />
        </section>
      </main>
    </div>
  );
}
