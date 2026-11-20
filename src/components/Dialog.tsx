import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface DialogProps {
  /** Ouverte ou fermée (composant contrôlé). */
  open: boolean;
  /** Appelée sur Échap, clic sur le fond ou bouton de fermeture. */
  onClose: () => void;
  /** Titre (annoncé comme nom de la fenêtre). */
  title: ReactNode;
  children?: ReactNode;
  /** Boutons d'action, en bas à droite. */
  footer?: ReactNode;
  /** Libellé du bouton de fermeture (lecteurs d'écran). */
  closeLabel?: string;
  /** Fermer en cliquant sur le fond (oui par défaut). */
  closeOnOverlay?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Fenêtre modale accessible : rôle dialog + aria-modal, focus placé dans la fenêtre
 * et gardé à l'intérieur (Tab / Maj+Tab), Échap ferme, clic sur le fond ferme,
 * le focus revient à l'élément d'origine à la fermeture, défilement de la page bloqué.
 * Le thème (data-theme) de l'endroit où le Dialog est écrit est conservé.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  closeLabel = "Fermer",
  closeOnOverlay = true,
}: DialogProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [theme, setTheme] = useState<string | undefined>(undefined);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    if (!open) return;
    const themed = anchorRef.current?.parentElement?.closest("[data-theme]");
    setTheme(themed?.getAttribute("data-theme") ?? undefined);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === firstItem || active === panelRef.current)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && active === lastItem) {
        event.preventDefault();
        firstItem.focus();
      } else if (!panelRef.current.contains(active)) {
        event.preventDefault();
        firstItem.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  return (
    <>
      <span ref={anchorRef} hidden />
      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="sd-dialog-root" data-theme={theme}>
              <div
                className="sd-dialog-overlay"
                aria-hidden="true"
                onClick={closeOnOverlay ? () => onCloseRef.current() : undefined}
              />
              <div
                ref={panelRef}
                className="sd-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
              >
                <div className="sd-dialog__header">
                  <h2 id={titleId} className="sd-dialog__title">
                    {title}
                  </h2>
                  <button
                    type="button"
                    className="sd-dialog__close"
                    aria-label={closeLabel}
                    onClick={() => onCloseRef.current()}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                {children ? <div className="sd-dialog__body">{children}</div> : null}
                {footer ? <div className="sd-dialog__footer">{footer}</div> : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
