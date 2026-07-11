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
- `js/music-theory.js` — noyau theorie pur, sans dependance au DOM : notes
  (`LETTERS`, `SOLFEGE`, `SEMI`, `CHROMATIC`), positions sur le manche
  (`STRINGS`, `fretboardNotesAll`, `absToNote`, `fretMarkerDots`), calcul
  d'intervalles (`intervalDetails`), enharmonie (`enharmonicOf`, dieses vers
  bemols), rendu SVG reutilisable de portee, de tablature et de manche
  (`staffSVG`, `tabSVG`, `fretboardSVG`, parametrables via un objet
  d'options — couleur par note/case, dieses, hampes, marqueur de question
  courante, cellules interactives ou non — utilises tels quels par
  Intervalles et enrichis d'options par Notes, sans dupliquer le SVG),
  `stepOf`/`noteY`/`ledgerSteps`/`fretboardCellX`/`fretboardStringY`,
  utilitaires (`shuffle`, `buildQueueOfLength`). `fretboardSVG` dessine
  toujours le squelette du manche (cordes, sillet, cases, reperes) a partir
  de `opts.range`, meme si `cells` est vide (cas d'une simple revelation) ;
  la corde aigue ("1") est en haut, la corde grave ("6") en bas (convention
  standard des diagrammes de manche). Exporte ses fonctions via
  `module.exports` (actif seulement sous Node, inerte dans le navigateur)
  pour etre teste isolement — voir `test/music-theory.test.js`, lance avec
  `npm test` (testeur integre a Node, aucune dependance).
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
  silencieusement. Le manche interactif (`buildFretTable`/
  `buildFretHighlight`) construit un tableau de cellules puis appelle
  `fretboardSVG` ; `wireFretCells` attache ensuite les ecouteurs clic +
  clavier (Entree/Espace, avec verification `aria-disabled` pour ne pas
  intercepter le raccourci global "passer a la suite" une fois la case
  repondue) sur les `<circle role="button">` generes.
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
- Toute interface representant un manche de guitare doit utiliser
  `fretboardSVG` (diagramme a cercles, sillet, reperes de case, corde aigue
  en haut) et etre interactive quand une interaction est necessaire —
  jamais de tableau HTML brut pour representer un manche.

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
