import { type ButtonHTMLAttributes } from "react";
export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Apparence : primaire (action principale), secondaire, danger (action destructrice). */
    variant?: ButtonVariant;
    /** Taille : sm, md (par défaut), lg. */
    size?: ButtonSize;
    /** Occupe toute la largeur disponible. */
    fullWidth?: boolean;
}
/** Bouton. Par défaut `type="button"` (pas d'envoi de formulaire involontaire). */
export declare const Button: import("react").ForwardRefExoticComponent<ButtonProps & import("react").RefAttributes<HTMLButtonElement>>;
