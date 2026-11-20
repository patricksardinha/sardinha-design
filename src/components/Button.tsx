import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

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
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth = false, type = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx("sd-button", `sd-button--${variant}`, `sd-button--${size}`, fullWidth && "sd-button--full", className)}
      {...rest}
    />
  );
});
