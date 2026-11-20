import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Titre de la carte (rendu en h3). */
  title?: ReactNode;
  /** Zone d'actions en bas de la carte. */
  footer?: ReactNode;
  /** Légère élévation au survol (carte cliquable). */
  interactive?: boolean;
}

/** Carte : surface encadrée avec titre, contenu et pied facultatifs. */
export function Card({ title, footer, interactive = false, className, children, ...rest }: CardProps) {
  return (
    <section className={cx("sd-card", interactive && "sd-card--interactive", className)} {...rest}>
      {title ? <h3 className="sd-card__title">{title}</h3> : null}
      {children ? <div className="sd-card__body">{children}</div> : null}
      {footer ? <div className="sd-card__footer">{footer}</div> : null}
    </section>
  );
}
