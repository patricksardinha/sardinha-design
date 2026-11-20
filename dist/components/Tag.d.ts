import type { HTMLAttributes } from "react";
export type TagVariant = "neutral" | "success" | "warning" | "danger";
export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
    /** neutre (par défaut), succès, alerte, erreur. */
    variant?: TagVariant;
    /** Affiche une pastille devant le texte. */
    dot?: boolean;
}
/** Étiquette de statut. Le texte porte le sens : la couleur ne fait que l'appuyer. */
export declare function Tag({ variant, dot, className, children, ...rest }: TagProps): import("react").JSX.Element;
