import { type InputHTMLAttributes, type ReactNode } from "react";
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
    /** Libellé visible, relié au champ. */
    label: ReactNode;
    /** Message d'erreur : passe le champ en état d'erreur (aria-invalid) et l'annonce. */
    error?: ReactNode;
    /** Aide affichée sous le champ (masquée quand il y a une erreur). */
    hint?: ReactNode;
}
/** Champ de saisie avec libellé, aide et état d'erreur accessibles. */
export declare const Input: import("react").ForwardRefExoticComponent<InputProps & import("react").RefAttributes<HTMLInputElement>>;
