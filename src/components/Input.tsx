import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "./cx";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Libellé visible, relié au champ. */
  label: ReactNode;
  /** Message d'erreur : passe le champ en état d'erreur (aria-invalid) et l'annonce. */
  error?: ReactNode;
  /** Aide affichée sous le champ (masquée quand il y a une erreur). */
  hint?: ReactNode;
}

/** Champ de saisie avec libellé, aide et état d'erreur accessibles. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `sd-input-${autoId}`;
  const hintId = `${inputId}-aide`;
  const errorId = `${inputId}-erreur`;
  const hasError = error !== undefined && error !== null && error !== false && error !== "";
  const describedBy = cx(hasError ? errorId : hint ? hintId : undefined, rest["aria-describedby"]) || undefined;

  return (
    <div className={cx("sd-field", hasError && "sd-field--error", className)}>
      <label className="sd-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className="sd-field__input"
        {...rest}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
      />
      {hasError ? (
        <span id={errorId} className="sd-field__error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="sd-field__hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
