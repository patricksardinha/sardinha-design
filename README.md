# sardinha-design

Le système de design commun à tous les logiciels de Patricko : **une seule source de jetons** (`tokens.json`) transformée en variables CSS (thème clair et sombre), **cinq composants React** qui n'utilisent que ces variables, et un **studio local** pour régler les jetons à la souris.

Dépôt : `github.com/patricksardinha/sardinha-design` · Paquet : `sardinha-design` (installé depuis GitHub, pas depuis le registre npm).

---

## 1. Installer dans un logiciel

Dans le dossier du logiciel (qui utilise déjà React 18 ou 19 et un outil de construction comme Vite) :

```bash
npm install github:patricksardinha/sardinha-design#v0.1.0
```

`#v0.1.0` est l'étiquette Git de la version voulue. Le dossier `dist/` étant commité, **rien n'est reconstruit à l'installation**.

### Les jetons (variables CSS)

Une fois, à l'entrée du logiciel (`main.tsx`, `main.ts`…) :

```ts
import "sardinha-design/tokens.css";      // variables --color-…, --space-…, etc.
import "sardinha-design/components.css";  // seulement si vous utilisez les composants
```

Puis dans vos propres styles, uniquement des variables :

```css
body {
  margin: 0;
  background: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: var(--font-size-md);
}
.panneau {
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: transform var(--duration-normal) ease;
}
```

Les valeurs brutes existent aussi en JSON (pour un canvas, un graphique, une appli native…) :

```ts
import tokens from "sardinha-design/tokens.json";
tokens.color.dark.accent; // "#5b9dff"
```

### Les composants React

```tsx
import { Button, Input, Card, Tag, Dialog } from "sardinha-design";

<Button>Enregistrer</Button>
<Button variant="secondary" size="sm">Annuler</Button>
<Button variant="danger" size="lg">Supprimer</Button>

<Input label="Adresse e-mail" hint="Nous ne la partageons pas." />
<Input label="Nom" error="Ce nom est déjà pris." />

<Card title="Synchronisation" footer={<Button size="sm">Ouvrir</Button>}>
  Tout est à jour.
</Card>

<Tag variant="success">Payé</Tag>   {/* neutral | success | warning | danger */}

const [open, setOpen] = useState(false);
<Dialog open={open} onClose={() => setOpen(false)} title="Supprimer ?"
        footer={<Button variant="danger" onClick={() => setOpen(false)}>Supprimer</Button>}>
  Cette action est définitive.
</Dialog>
```

| Composant | Propriétés principales |
| --- | --- |
| `Button` | `variant` : `primary` (défaut), `secondary`, `danger` · `size` : `sm`, `md` (défaut), `lg` · `fullWidth` · tout attribut de `<button>` (`type="button"` par défaut) |
| `Input` | `label` (obligatoire) · `error` (passe en état d'erreur, `aria-invalid`, message annoncé) · `hint` · tout attribut de `<input>` |
| `Card` | `title` · `footer` · `interactive` (élévation au survol) |
| `Tag` | `variant` : `neutral` (défaut), `success`, `warning`, `danger` · `dot` (pastille, oui par défaut) |
| `Dialog` | `open`, `onClose`, `title` (obligatoires) · `footer` · `closeLabel` · `closeOnOverlay` |

Le `Dialog` est une fenêtre modale accessible : `role="dialog"` + `aria-modal`, focus placé dans la fenêtre et gardé à l'intérieur (Tab / Maj+Tab), **Échap** et un clic sur le fond la ferment, le focus revient au bouton d'origine, la page ne défile plus derrière. Mettez `data-autofocus` sur l'élément qui doit recevoir le focus à l'ouverture.

Les composants sont livrés construits (`dist/components/index.js`, ESM, avec les types TypeScript) ; React reste celui du logiciel (`peerDependencies`).

### Le thème sombre

Le thème clair s'applique par défaut (`:root`). Pour le sombre, posez l'attribut `data-theme="dark"` :

```html
<html data-theme="dark">
```

```ts
// basculer depuis le code
document.documentElement.dataset.theme = "dark";   // ou "light"

// suivre le réglage du système
const media = matchMedia("(prefers-color-scheme: dark)");
document.documentElement.dataset.theme = media.matches ? "dark" : "light";
```

L'attribut marche aussi sur n'importe quel élément (`<section data-theme="dark">`) : seule cette zone change. `data-theme="light"` rétablit le clair à l'intérieur d'une zone sombre. Un `Dialog` garde le thème de l'endroit où il est écrit.

---

## 2. Les jetons (`tokens.json`)

C'est **la seule source** : ne modifiez jamais `dist/` à la main.

| Catégorie | Variable CSS | Type de valeur accepté |
| --- | --- | --- |
| `color.light` / `color.dark` | `--color-<nom>` | hexadécimal `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` ; **les deux thèmes ont exactement les mêmes clés** |
| `font` | `--font-<nom>` | liste `font-family` (sans `; { } < > \`) |
| `fontSize` | `--font-size-<nom>` | nombre + `px`, `rem` ou `em`, strictement positif |
| `space` | `--space-<nom>` | nombre + `px`, `rem` ou `em`, ou `0` |
| `radius` | `--radius-<nom>` | idem |
| `borderWidth` | `--border-width-<nom>` | idem |
| `shadow` | `--shadow-<nom>` | valeur `box-shadow` (au moins deux décalages) ou `none` |
| `duration` | `--duration-<nom>` | nombre + `ms` ou `s` |

- **Noms** : camelCase, lettres et chiffres, commençant par une minuscule (`surfaceMuted` → `--color-surface-muted`).
- **Jetons requis** : ceux qu'utilisent les composants (par ex. `color.*.accent`, `space.md`, `duration.fast`) ne peuvent pas être supprimés. Les autres (comme `space.xxl`) peuvent l'être.
- **Couleurs actuelles** : `background`, `surface`, `surfaceMuted`, `text`, `textMuted`, `border`, `accent`, `onAccent` (texte posé sur l'accent), `success`, `warning`, `danger`, `focus`, `overlay` (fond des fenêtres modales).
- Une clé `$description` (texte) est permise à la racine et dans chaque catégorie, pour documenter.

`npm run build:tokens` valide strictement le fichier. Un jeton invalide est refusé, **rien n'est écrit**, et le message donne le chemin et la raison :

```
Jetons refusés (2 erreurs) :
  ✗ space.md : taille invalide « 12 » : attendu un nombre positif suivi de px, rem ou em (ex. 12px, 1.5rem) ou 0
  ✗ color.dark.brand : clé manquante dans le thème sombre (présente dans le thème clair)
```

La sortie est déterministe : catégories dans un ordre fixe, jetons dans l'ordre du fichier, thème sombre dans l'ordre du thème clair.

---

## 3. Changer un style et publier une version

Il faut Node.js (version 20.19 ou plus récente) et, une fois, `npm install` dans ce dossier.

1. **Ouvrir le studio** :
   ```bash
   npm run studio
   ```
   Le navigateur s'ouvre sur `http://127.0.0.1:5180/`. À gauche, l'établi : pipette pour les couleurs, curseurs pour les tailles, espacements, arrondis, épaisseurs et durées, champs texte pour les polices et les ombres, « + Ajouter » et « × » pour ajouter ou supprimer un jeton. À droite, les deux épreuves **Clair** et **Sombre** montrent tous les jetons et tous les composants, mis à jour en direct.
2. **Enregistrer** (bouton ou Ctrl+S) : le studio envoie les jetons au serveur local, qui les valide, réécrit `tokens.json` et relance `build:tokens` (→ `dist/tokens.css`, `dist/tokens.json`). Un jeton invalide est signalé dans le studio et rien n'est écrit. *(On peut aussi éditer `tokens.json` à la main puis lancer `npm run build:tokens`.)*
3. **Vérifier** :
   ```bash
   npm test          # générateur de jetons + contrôle des valeurs en dur
   npm run build     # jetons + contrôle + TypeScript + composants (dist/components)
   ```
   `npm run build` n'est indispensable que si vous avez touché aux composants (`src/components/`).
4. **Commiter, avec `dist/`** (il doit être dans le commit : c'est lui que les logiciels installent) :
   ```bash
   git add -A
   git commit -m "Accent plus chaud"
   ```
5. **Numéroter la version et l'étiqueter** : `npm version` met à jour `package.json`, commite et crée l'étiquette Git `vX.Y.Z` :
   ```bash
   npm version patch   # 0.1.0 → 0.1.1 : retouche (une couleur, un espacement)
   npm version minor   # 0.1.0 → 0.2.0 : ajout (nouveau jeton, nouveau composant)
   npm version major   # 0.1.0 → 1.0.0 : rupture (jeton renommé ou supprimé)
   ```
6. **Pousser, étiquettes comprises** :
   ```bash
   git push && git push --tags
   ```

La route d'enregistrement (`/__tokens`) n'existe que dans le serveur de développement du studio (`npm run studio`), n'écoute que sur `127.0.0.1` et refuse les requêtes venues d'une autre machine. Elle n'est jamais dans le paquet.

## 4. Mettre un logiciel à jour

Dans le logiciel, changez l'étiquette, soit par la commande :

```bash
npm install github:patricksardinha/sardinha-design#v0.2.0
```

soit dans son `package.json`, puis `npm install` :

```json
"dependencies": {
  "sardinha-design": "github:patricksardinha/sardinha-design#v0.2.0"
}
```

Relancez le logiciel : les nouvelles valeurs des variables s'appliquent partout. Pour une version **major**, lisez d'abord ce qui a été renommé ou supprimé.

---

## Organisation du dépôt

```
tokens.json                    LA source des jetons
dist/                          livrable commité : tokens.css, tokens.json, components/ (JS, CSS, types)
scripts/tokens-lib.mjs         validation + génération du CSS (pur, sans dépendance, utilisé aussi par le studio)
scripts/build-tokens.mjs       npm run build:tokens
scripts/check-hardcoded.mjs    refuse toute couleur (hex, rgb…) ou taille (px, rem…) écrite en dur dans les composants
scripts/vite-plugin-tokens.mjs route locale /__tokens du studio (dev uniquement)
src/components/                Button, Input, Card, Tag, Dialog + components.css
studio/                        le studio (React + Vite + Framer Motion)
tests/                         tests Vitest (snapshot du CSS, jetons invalides, valeurs en dur)
```

## Commandes

| Commande | Effet |
| --- | --- |
| `npm run studio` | studio local avec enregistrement |
| `npm run build:tokens` | `tokens.json` → `dist/tokens.css` + `dist/tokens.json` |
| `npm run check:styles` | échoue si une couleur ou une taille est écrite en dur dans `src/components/` |
| `npm run build` | jetons, contrôle des styles, TypeScript, composants → `dist/components/` |
| `npm test` | tests (déterminisme et snapshot, refus des jetons invalides, contrôle des styles) |
| `npm run studio:build` | version statique du studio dans `dist/studio/` (aperçu sans enregistrement, non commitée) |

Le snapshot du test de déterminisme est `tests/__snapshots__/tokens.sample.css` (généré depuis `tests/fixtures/tokens.sample.json`). Si vous changez volontairement le format du CSS, mettez-le à jour avec `npx vitest run -u`.

Pas de script `prepare` dans `package.json`, volontairement : npm le lancerait à chaque installation depuis GitHub.
