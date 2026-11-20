import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { createPortal } from "react-dom";
// src/components/cx.ts
/** Assemble des noms de classes en ignorant les valeurs vides. */
function cx(...parts) {
	return parts.filter(Boolean).join(" ");
}
// src/components/Button.tsx
/** Bouton. Par défaut `type="button"` (pas d'envoi de formulaire involontaire). */
var Button = forwardRef(function Button({ variant = "primary", size = "md", fullWidth = false, type = "button", className, ...rest }, ref) {
	return /* @__PURE__ */ jsx("button", {
		ref,
		type,
		className: cx("sd-button", `sd-button--${variant}`, `sd-button--${size}`, fullWidth && "sd-button--full", className),
		...rest
	});
});
// src/components/Input.tsx
/** Champ de saisie avec libellé, aide et état d'erreur accessibles. */
var Input = forwardRef(function Input({ label, error, hint, id, className, ...rest }, ref) {
	const autoId = useId();
	const inputId = id ?? `sd-input-${autoId}`;
	const hintId = `${inputId}-aide`;
	const errorId = `${inputId}-erreur`;
	const hasError = error !== void 0 && error !== null && error !== false && error !== "";
	const describedBy = cx(hasError ? errorId : hint ? hintId : void 0, rest["aria-describedby"]) || void 0;
	return /* @__PURE__ */ jsxs("div", {
		className: cx("sd-field", hasError && "sd-field--error", className),
		children: [
			/* @__PURE__ */ jsx("label", {
				className: "sd-field__label",
				htmlFor: inputId,
				children: label
			}),
			/* @__PURE__ */ jsx("input", {
				ref,
				id: inputId,
				className: "sd-field__input",
				...rest,
				"aria-invalid": hasError || void 0,
				"aria-describedby": describedBy
			}),
			hasError ? /* @__PURE__ */ jsx("span", {
				id: errorId,
				className: "sd-field__error",
				role: "alert",
				children: error
			}) : hint ? /* @__PURE__ */ jsx("span", {
				id: hintId,
				className: "sd-field__hint",
				children: hint
			}) : null
		]
	});
});
// src/components/Card.tsx
/** Carte : surface encadrée avec titre, contenu et pied facultatifs. */
function Card({ title, footer, interactive = false, className, children, ...rest }) {
	return /* @__PURE__ */ jsxs("section", {
		className: cx("sd-card", interactive && "sd-card--interactive", className),
		...rest,
		children: [
			title ? /* @__PURE__ */ jsx("h3", {
				className: "sd-card__title",
				children: title
			}) : null,
			children ? /* @__PURE__ */ jsx("div", {
				className: "sd-card__body",
				children
			}) : null,
			footer ? /* @__PURE__ */ jsx("div", {
				className: "sd-card__footer",
				children: footer
			}) : null
		]
	});
}
// src/components/Tag.tsx
/** Étiquette de statut. Le texte porte le sens : la couleur ne fait que l'appuyer. */
function Tag({ variant = "neutral", dot = true, className, children, ...rest }) {
	return /* @__PURE__ */ jsxs("span", {
		className: cx("sd-tag", `sd-tag--${variant}`, className),
		...rest,
		children: [dot ? /* @__PURE__ */ jsx("span", {
			className: "sd-tag__dot",
			"aria-hidden": "true"
		}) : null, children]
	});
}
// src/components/Dialog.tsx
var FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";
/**
* Fenêtre modale accessible : rôle dialog + aria-modal, focus placé dans la fenêtre
* et gardé à l'intérieur (Tab / Maj+Tab), Échap ferme, clic sur le fond ferme,
* le focus revient à l'élément d'origine à la fermeture, défilement de la page bloqué.
* Le thème (data-theme) de l'endroit où le Dialog est écrit est conservé.
*/
function Dialog({ open, onClose, title, children, footer, closeLabel = "Fermer", closeOnOverlay = true }) {
	const anchorRef = useRef(null);
	const panelRef = useRef(null);
	const onCloseRef = useRef(onClose);
	const [theme, setTheme] = useState(void 0);
	const titleId = useId();
	useEffect(() => {
		onCloseRef.current = onClose;
	}, [onClose]);
	useLayoutEffect(() => {
		if (!open) return;
		const themed = anchorRef.current?.parentElement?.closest("[data-theme]");
		setTheme(themed?.getAttribute("data-theme") ?? void 0);
	}, [open]);
	useEffect(() => {
		if (!open) return;
		const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const panel = panelRef.current;
		(panel?.querySelector("[data-autofocus]") ?? panel?.querySelector(FOCUSABLE) ?? panel)?.focus();
		const overflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		function onKeyDown(event) {
			if (event.key === "Escape") {
				event.stopPropagation();
				onCloseRef.current();
				return;
			}
			if (event.key !== "Tab" || !panelRef.current) return;
			const items = Array.from(panelRef.current.querySelectorAll(FOCUSABLE));
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
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
		ref: anchorRef,
		hidden: true
	}), open && typeof document !== "undefined" ? createPortal(/* @__PURE__ */ jsxs("div", {
		className: "sd-dialog-root",
		"data-theme": theme,
		children: [/* @__PURE__ */ jsx("div", {
			className: "sd-dialog-overlay",
			"aria-hidden": "true",
			onClick: closeOnOverlay ? () => onCloseRef.current() : void 0
		}), /* @__PURE__ */ jsxs("div", {
			ref: panelRef,
			className: "sd-dialog",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": titleId,
			tabIndex: -1,
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "sd-dialog__header",
					children: [/* @__PURE__ */ jsx("h2", {
						id: titleId,
						className: "sd-dialog__title",
						children: title
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "sd-dialog__close",
						"aria-label": closeLabel,
						onClick: () => onCloseRef.current(),
						children: /* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							children: "×"
						})
					})]
				}),
				children ? /* @__PURE__ */ jsx("div", {
					className: "sd-dialog__body",
					children
				}) : null,
				footer ? /* @__PURE__ */ jsx("div", {
					className: "sd-dialog__footer",
					children: footer
				}) : null
			]
		})]
	}), document.body) : null] });
}
export { Button, Card, Dialog, Input, Tag };
