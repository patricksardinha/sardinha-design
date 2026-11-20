# AVANCEMENT — sardinha-design

## Concept

Un **atelier** pour le design de Patricko : un studio sombre et feutré (fond ardoise pointillé, halos radiaux qui dérivent lentement, sardine-logo qui nage), avec à gauche l'établi (les jetons, réglables à la souris) et à droite deux « planches d'épreuve » côte à côte, **Clair** et **Sombre**, où tous les jetons et composants se mettent à jour en direct.

## Choix

- Jetons : `tokens.json` (racine) → `scripts/build-tokens.mjs` (Node pur, aucune dépendance) → `dist/tokens.css`, `dist/tokens.json`.
- Composants : sources TSX dans `src/components/`, **livrés construits** dans `dist/components/` (Vite mode bibliothèque + déclarations TS). Pas de script `prepare`.
- Studio : Vite (racine du projet, `index.html` → `studio/`), plugin `scripts/vite-plugin-tokens.mjs` (route `/__tokens`, `apply: "serve"`, localhost uniquement).
- Variables CSS sans préfixe : `--color-accent`, `--space-md`, `--font-size-lg`…
- Catégorie ajoutée `borderWidth` (pour qu'aucune épaisseur ne soit écrite en dur), couleurs `surfaceMuted`, `onAccent`, `focus`, `overlay`.
- Vitest 4 (Vitest 5 exige Node 22.12+ et plante sous Node 20).

## Fichiers

- [x] package.json, .gitignore, tsconfig*.json, vite.config.ts, vite.lib.config.ts
- [x] tokens.json
- [x] scripts/tokens-lib.mjs (+ .d.mts), build-tokens.mjs, check-hardcoded.mjs, vite-plugin-tokens.mjs
- [x] tests/tokens.test.mjs, tests/hardcoded.test.mjs (31 tests)
- [x] src/components : Button, Input, Card, Tag, Dialog, components.css, index.ts, entry.ts
- [x] studio : index.html, studio/main.tsx, App.tsx, TokenEditor.tsx, Preview.tsx, tokenModel.ts, studio.css
- [x] README.md
- [x] git init + premier commit

## Animations du studio

- [x] halos de fond qui dérivent (CSS, radial-gradient, sans filtre)
- [x] entrée en cascade des sections (ressorts)
- [x] ajout/suppression de jeton (AnimatePresence + layout)
- [x] bandeau de succès / panneau d'erreurs qui tremble
- [x] bille de durée (aller-retour à la durée du jeton)
- [x] Dialog : apparition (durées des jetons) ; prefers-reduced-motion respecté

## Vérifications

- [x] npm run build:tokens, npm test : 31/31
- [x] npm run build (jetons + contrôle des styles + tsc + composants), npm run studio:build
- [x] check_page ordinateur + téléphone (version statique du studio) : aucune erreur
- [x] parcours Playwright sur le serveur de dev : modifier → Enregistrer réécrit tokens.json et dist/ ; jeton invalide refusé (422) ; suppression ; Dialog au clavier ; rechargement
- [x] installation dans un logiciel test via git+file (sans construction)
