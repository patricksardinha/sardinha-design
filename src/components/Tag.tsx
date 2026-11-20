import type { HTMLAttributes } from "react";
import { cx } from "./cx";

export type TagVariant = "neutral" | "success" | "warning" | "danger";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** neutre (par défaut), succès, alerte, erreur. */
  variant?: TagVariant;
  /** Affiche une pastille devant le texte. */
  dot?: boolean;
}

/** Étiquette de statut. Le texte porte le sens : la couleur ne fait que l'appuyer. */
export function Tag({ variant = "neutral", dot = true, className, children, ...rest }: TagProps) {
  return (
    <span className={cx("sd-tag", `sd-tag--${variant}`, className)} {...rest}>
      {dot ? <span className="sd-tag__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
