import type { HTMLAttributes, ReactNode } from "react";
export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
    /** Titre de la carte (rendu en h3). */
    title?: ReactNode;
    /** Zone d'actions en bas de la carte. */
    footer?: ReactNode;
    /** Légère élévation au survol (carte cliquable). */
    interactive?: boolean;
}
/** Carte : surface encadrée avec titre, contenu et pied facultatifs. */
export declare function Card({ title, footer, interactive, className, children, ...rest }: CardProps): import("react").JSX.Element;
