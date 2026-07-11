# Theorie et lecture — guitare classique

Application web une page (SPA statique, sans framework) pour s'entrainer a la
theorie musicale appliquee a la guitare classique : lecture de notes sur la
portee, reperage sur le manche, intervalles, et a terme gammes/armures,
accords, harmonie fonctionnelle. Interface en francais.

## Architecture des fichiers

- `index.html` — structure de la page : l'ecran d'accueil (menu de modules) et
  un conteneur par module (`#notes-module`, `#intervals-module`, ...). Les
  modules non implementes restent en cartes `.soon` desactivees sur l'accueil.
- `styles.css` — tout le CSS de l'appli (variables de couleurs en haut du
  fichier, layout, composants partages : cartes, boutons segmentes, portee,
  tableau de manche, barres de progression, feedback de reponse).
- `js/music-theory.js` — logique musicale reutilisable, sans dependance au DOM
  des modules : notes (`LETTERS`, `SOLFEGE`, `SEMI`), positions sur le manche
  (`STRINGS`, `fretboardNotesAll`, `absToNote`), calcul d'intervalles
  (`intervalDetails`), rendu SVG de portee (`staffSVG`, `stepOf`, `noteY`,
  `ledgerSteps`), utilitaires (`shuffle`, `buildQueueOfLength`).
- `js/storage.js` — persistance locale (`localStorage`) : historique des
  scores par module (`recordSessionResult`, `lastSessionResult`) et banque
  d'erreurs a reviser qui survit aux sessions/rechargements
  (`addToMissedBank`, `removeFromMissedBank`, `getMissedBank`). Sans
  dependance au DOM, comme `music-theory.js`.
- `js/nav.js` — navigation entre l'accueil et les modules (`openModule`,
  `backToHome`), bascule de notation Do-Re-Mi / C-D-E (`useSolfege`,
  `dispName`), et petits helpers UI partages (`radioValue`, `updateProgress`,
  `setFeedback`). `openModule` declenche aussi l'affichage du rappel
  "derniere session / erreurs a reviser" de chaque module.
- `js/session-ui.js` — gabarit de session partage entre les modules :
  raccourcis clavier (touches `1`-`9`/`0` selectionnent une reponse dans le
  conteneur `#notes-answers`/`#intervals-answers` visible, `Entree` saute le
  delai d'avancement automatique via `registerPendingAdvance`/
  `clearPendingAdvance`), gestion du focus clavier apres chaque question
  (`focusFirstIn`), et le bouton "Signaler" pour marquer une question
  ambigue (`wireFlagButton`/`resetFlagButton`, stocke via `flagItem` dans
  `js/storage.js`). Sans connaissance de la structure interne de
  `nState`/`iState` : les modules lui passent des callbacks/ids, pas leur
  etat.
- `js/notes.js` — module 1 "Notes" : config (position sur le manche, vitesse,
  nombre de questions), les 3 sous-modes (portee -> nom, nom -> manche,
  manche -> nom), scoring, resultats et rejeu des erreurs (banque persistante
  via `js/storage.js`). Changer de sous-mode en cours de session demande
  confirmation (`notesQuizInProgress`) plutot que de reinitialiser
  silencieusement.
- `js/intervals.js` — module 2 "Intervalles" : config (types d'intervalles,
  racine fixe/aleatoire, nombre de questions), generation du quiz, scoring,
  resultats et rejeu des erreurs (banque persistante via `js/storage.js`).

Les scripts sont charges en balises `<script>` classiques (pas de modules ES),
dans cet ordre precis car chaque fichier depend des globales definies par les
precedents :

```
music-theory.js -> storage.js -> nav.js -> session-ui.js -> notes.js -> intervals.js
```

## PWA (installation Android / PC)

- `manifest.json` + `icons/icon-192.png` + `icons/icon-512.png` rendent
  l'appli installable depuis Chrome ("Ajouter a l'ecran d'accueil").
- `service-worker.js` met en cache les fichiers principaux pour un
  fonctionnement hors-ligne ; enregistre depuis `index.html` en fin de page.
  A mettre a jour (nom de `CACHE_NAME`) si des fichiers core sont ajoutes ou
  renommes, sinon les anciens fichiers restent servis depuis le cache.
- Hebergee via GitHub Pages (branche `master`, racine du depot).

## Conventions

- Pas de build, pas de framework : JS "vanilla" ES5-ish (var, function),
  DOM API directe. Rester dans ce style pour les modules existants.
- Un nouveau module suit le meme patron que Notes/Intervalles : un bloc
  `#xxx-module.hidden` dans `index.html` avec `#xxx-config` (options),
  `#xxx-quiz` (questions) et `#xxx-results` (score + bouton rejouer/menu),
  un fichier `js/xxx.js` dedie, et une carte cliquable sur l'accueil qui
  appelle `openModule("xxx")`.
- Toute logique de calcul musical generique (intervalles, gammes, degres,
  armures...) va dans `js/music-theory.js`, pas dans le fichier du module,
  pour rester reutilisable par les futurs modules (accords, harmonie).
- `dispName()` (bascule Do-Re-Mi / C-D-E) doit etre utilise partout ou une
  note est affichee a l'utilisateur.
- Le comportement et le rendu visuel de l'appli ne doivent pas changer sans
  raison explicite ; toute refonte doit rester une amelioration incrementale.

## Feuille de route des modules

1. **Notes** — implemente. Lecture sur portee + reperage sur le manche.
2. **Intervalles** — implemente. Qualite et degre entre deux notes.
3. **Gammes et armures** — a venir. Majeures/mineures, construction, armures
   a la clef, identification a l'oreille/a la vue.
4. **Accords** — a venir. Triades et septiemes, positions sur le manche,
   renversements.
5. **Harmonie fonctionnelle** — a venir. Degres, cadences, enchainements
   d'accords dans une tonalite.

## Lancer l'appli en developpement

```
npm install
npm run dev
```

Ouvre l'URL affichee par Vite (rechargement automatique a chaque
modification de fichier).
