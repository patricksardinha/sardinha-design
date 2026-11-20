import { type ReactNode } from "react";
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
/**
 * Fenêtre modale accessible : rôle dialog + aria-modal, focus placé dans la fenêtre
 * et gardé à l'intérieur (Tab / Maj+Tab), Échap ferme, clic sur le fond ferme,
 * le focus revient à l'élément d'origine à la fermeture, défilement de la page bloqué.
 * Le thème (data-theme) de l'endroit où le Dialog est écrit est conservé.
 */
export declare function Dialog({ open, onClose, title, children, footer, closeLabel, closeOnOverlay, }: DialogProps): import("react").JSX.Element;
