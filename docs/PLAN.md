# SAR Prep — Plan de refonte (CEO → CTO)

> **Destinataire :** l'agent d'implémentation (Sonnet).
> **Objectif :** faire de SAR Prep la référence mondiale de la préparation au GRE : couverture complète du programme officiel, des questions au format exact du vrai test, sur ordinateur comme sur téléphone, et une pédagogie qui fait progresser vite.
> **Contraintes non négociables :** tout le produit est **en anglais**. **Aucun module de paiement.** **Rien d'inventé** : chaque leçon est rattachée à une source officielle ETS.

Lis ce document en entier avant d'écrire une ligne de code. Il fixe le *quoi* et le *pourquoi*. Le *comment* est à toi, dans le respect des règles ci-dessous.

---

## 0. Résumé exécutif

1. **Le modèle à reproduire : Target Test Prep (TTP).** Des chapitres, chaque chapitre contient des leçons, chaque leçon se termine par des questions, et une banque finie et cochable : quand tu as fait 100 % des questions, tu as couvert 100 % du programme. On garde cette dynamique, on l'étend au Verbal et à l'Analytical Writing, et on va plus loin sur trois points :
   - une **interface d'examen fidèle** au vrai GRE ;
   - un **mobile irréprochable**, alors que les concurrents restent pensés pour l'ordinateur ;
   - des **leçons courtes et sourcées**, sans remplissage.
2. **On garde la stack** (Next.js 16, React 19, Tailwind 4, Neon + Drizzle, Auth.js Google, PWA). On garde aussi ce qui fonctionne déjà : les types de questions (`src/types/questions.ts`), les générateurs paramétriques, la notation, le deck de vocabulaire et les séries.
3. **Le contenu devient du code.** Leçons et questions vivent dans `content/` (MDX + JSON validés par Zod), sont relues en PR et embarquées au build. La base de données ne garde que les **données utilisateur**.
4. **Le travail est organisé en équipe d'agents IA** (section 9) : auteurs, solveurs indépendants, vérificateur de sources, éditeur pédagogique, QA visuelle avec captures d'écran.

---

## 1. État des lieux du dépôt (à connaître avant de toucher quoi que ce soit)

| Élément | État | Décision |
|---|---|---|
| `gre-prep/` Next.js 16.2 / React 19 | OK. ⚠️ `AGENTS.md` : « This is NOT the Next.js you know ». Lire `node_modules/next/dist/docs/` avant de coder. | Garder |
| Auth.js v5 + Google + Drizzle + Neon | OK | Garder |
| `@supabase/*` dans `package.json`, `supabase_migration.sql`, README qui décrit Supabase | Restes de l'ancienne version | **Supprimer** et réécrire le README |
| `src/types/questions.ts` (TC/SE/RC/QC/PS/NE/DI, réponses, figures) | Bon modèle, aligné sur les specs ETS | Garder et étendre (voir §5) |
| `src/lib/generators/**` (quant paramétrique + verbal à partir de frames) | Bonne base, mais une couverture de topics inégale (2 templates seulement sur beaucoup de sujets) | Garder, étendre, faire passer par le pipeline QA |
| `src/lib/grading.ts` | Notation sans crédit partiel | Garder et couvrir par des tests |
| Vocabulaire : 995 mots, séries thématiques, QCM, saisie, flashcards | Fonctionne | Garder comme module « Vocabulary » (voir §3.4) |
| UI | Thème sombre violet. Quelques chaînes en français (`Blanc`, `Réinitialiser…`) | Tout passer en anglais |
| Tests | Aucun test automatisé | Mettre en place Vitest et Playwright (§8) |
| `.DS_Store` versionnés | Bruit | Supprimer et ajouter au `.gitignore` |

---

## 2. Le format officiel du GRE à reproduire (source : ETS, « shorter GRE », en vigueur depuis le 22 sept. 2023)

**À vérifier sur ets.org/gre au début du projet** (page *Test Content and Structure*). Si quelque chose a changé, ETS fait foi et tu mets ce document à jour.

| Section | Questions | Durée |
|---|---|---|
| Analytical Writing : 1 tâche « Analyze an Issue » | 1 essai | 30 min |
| Verbal Reasoning, section 1 | 12 | 18 min |
| Verbal Reasoning, section 2 (adaptative selon la section 1) | 15 | 23 min |
| Quantitative Reasoning, section 1 | 12 | 21 min |
| Quantitative Reasoning, section 2 (adaptative selon la section 1) | 15 | 26 min |

- Durée totale d'environ 1 h 58. Pas de pause. *(Correction après lecture de la page ETS : une section non notée peut être ajoutée, après l'écriture, et une section « research » identifiée peut venir en fin de test ; chaque section doit donc être traitée comme notée.)*
- Scores : Verbal et Quant de 130 à 170 (par pas de 1), AW de 0 à 6 (par pas de 0,5).
- **Adaptatif au niveau de la section**, pas de la question. À l'intérieur d'une section, on peut revenir en arrière, marquer une question (**Mark**) et ouvrir l'écran **Review**.
- Pas de pénalité pour une mauvaise réponse. Une calculatrice à l'écran est disponible **uniquement en Quant**.

### Formats de questions (tous déjà typés dans `src/types/questions.ts`)

- **Verbal**
  - **TC** (Text Completion) : 1 à 3 blancs. 5 choix s'il y a un seul blanc, 3 choix par blanc sinon. Aucun crédit partiel.
  - **SE** (Sentence Equivalence) : 6 choix, il faut en cocher exactement 2.
  - **RC** (Reading Comprehension) : choix unique (5 choix), « select one or more » (**exactement 3 choix, 1 à 3 bonnes réponses**) ou « select-in-passage » (clic sur une phrase du ou des paragraphes désignés).
- **Quant**
  - **QC** (Quantitative Comparison) : 4 choix fixes, toujours dans le même ordre.
  - **PS** (Problem Solving) : choix unique (5 choix) ou « select one or more ».
  - **NE** (Numeric Entry) : une case, ou deux cases pour une fraction.
  - **DI** (Data Interpretation) : des groupes de questions sur un même graphique ou tableau.

---

## 3. Architecture pédagogique : chapitres → leçons → questions

### 3.1 Règle d'or n° 1 : rien d'inventé

Chaque leçon porte un champ obligatoire **`officialRef`** qui pointe vers un document ETS public et une section précise. Le build **échoue** si une leçon n'a pas d'`officialRef` valide (validation Zod, plus un contrôle en CI).

Sources officielles autorisées (liste fermée, enregistrée dans `content/sources.json`) :

| ID | Document ETS | Usage |
|---|---|---|
| `ets-math-review` | *GRE Math Review* (PDF gratuit sur ets.org) | Tout le programme Quant. **C'est le squelette des chapitres Quant.** |
| `ets-math-conventions` | *GRE Math Conventions* (PDF) | Notations, figures « not drawn to scale », arrondis, etc. |
| `ets-quant-overview` | Page *Quantitative Reasoning* (types de questions et conseils officiels) | Leçons de format et de stratégie QC/PS/NE/DI |
| `ets-verbal-overview` | Page *Verbal Reasoning* (compétences mesurées, types de questions, conseils officiels pour TC/SE/RC) | Leçons Verbal |
| `ets-aw-overview` | Page *Analytical Writing* + *Issue scoring guide* | Leçons AW |
| `ets-issue-pool` | *Pool of Issue Topics* publié par ETS | Sujets d'entraînement AW |
| `ets-test-structure` | Page *Test Content and Structure* + *Test-taking strategies* | Leçons sur l'interface, la gestion du temps et le scoring |
| `ets-official-guide` | *The Official Guide to the GRE General Test* (référence de section uniquement, **ne jamais copier de contenu**) | Référence complémentaire |

Interdits :
- copier un texte ou une question ETS (droit d'auteur) ;
- utiliser le logo ETS ou GRE dans l'interface ;
- créer une leçon sur un sujet absent des sources ci-dessus.

Ajouter dans le footer : *« GRE® is a registered trademark of ETS. SAR Prep is not affiliated with or endorsed by ETS. »*

### 3.2 Règle d'or n° 2 : zéro remplissage, 100 % compris

Gabarit **imposé** pour chaque leçon (composant `<Lesson>`, sections fixes) :

1. **Why it matters** : 1 phrase (où et comment le sujet apparaît au GRE).
2. **The rule** : l'explication minimale suffisante. Si 2 lignes suffisent, 2 lignes. Formules en KaTeX.
3. **Worked example** : 1 à 2 exemples résolus pas à pas, au format GRE.
4. **Trap** : le piège classique du sujet, en 1 à 3 lignes (ex. en QC, oublier les nombres négatifs ou les fractions).
5. **Check yourself** : 2 ou 3 micro-questions, avec correction immédiate et explication courte.
6. **→ Practice set** : lien vers les questions de la leçon.

Budget de longueur, contrôlé automatiquement : la partie « The rule » fait **120 mots maximum** par défaut. Un dépassement est autorisé, mais seulement avec un champ `lengthJustification`, relu par l'éditeur pédagogique.

Le test de l'éditeur pour chaque leçon : *« Un élève qui ne lit que cette leçon peut-il résoudre 100 % des questions de son practice set ? »* Si la réponse est non, la leçon est incomplète. Si un paragraphe peut être retiré sans que la réponse change, on le retire.

### 3.3 Plan des chapitres

**Quant** : calqué sur la table des matières de l'*ETS Math Review*. Vérifie les numéros de section dans le PDF : ils deviennent les `officialRef`.

- **Ch. Q0 : Quant format & strategy.** Les 4 formats, la calculatrice à l'écran et quand l'utiliser, le gabarit QC (stratégies officielles ETS), la saisie en NE (arrondis, fractions), le DI.
- **Ch. Q1 : Arithmetic** (Math Review partie 1)
  - Integers : divisibilité, facteurs, multiples, premiers, pair/impair, restes.
  - Fractions.
  - Exponents and Roots.
  - Decimals.
  - Real Numbers : droite réelle, valeur absolue, ordre.
  - Ratio.
  - Percent.
- **Ch. Q2 : Algebra** (partie 2)
  - Algebraic expressions.
  - Rules of exponents.
  - Linear equations.
  - Quadratic equations.
  - Linear inequalities.
  - Functions.
  - Applications : intérêts simples et composés, taux, travail, mélanges, etc., uniquement ce que la section Applications cite.
  - Coordinate geometry.
  - Graphs of functions.
- **Ch. Q3 : Geometry** (partie 3)
  - Lines and angles.
  - Polygons.
  - Triangles.
  - Quadrilaterals.
  - Circles.
  - Three-dimensional figures.
- **Ch. Q4 : Data Analysis** (partie 4)
  - Graphical methods.
  - Numerical methods : moyenne, médiane, mode, quartiles, écart interquartile, écart-type, percentiles.
  - Counting methods.
  - Probability.
  - Distributions, random variables, normal distribution.
  - Data interpretation.

**Verbal** : calqué sur les compétences et les types de questions décrits par ETS.

- **Ch. V0 : Verbal format & strategy.** Les 3 types, l'écran RC en vue partagée, le select-in-passage, l'absence de crédit partiel.
- **Ch. V1 : Text Completion.** Stratégies officielles ETS : lire toute la phrase, repérer les mots-indices, prédire un mot avant de regarder les choix, commencer par le blanc le plus facile, relire la phrase complétée. Indices de contraste et de continuité, double négation, 1 / 2 / 3 blancs.
- **Ch. V2 : Sentence Equivalence.** Stratégies officielles, le piège de la « paire de synonymes qui ne colle pas au sens de la phrase ».
- **Ch. V3 : Reading Comprehension.** Une leçon par compétence listée par ETS :
  - sens d'un mot ou d'une phrase en contexte ;
  - idée principale et résumé ;
  - distinguer les points majeurs et mineurs ;
  - inférence ;
  - structure et fonction d'une phrase ou d'un paragraphe ;
  - perspective et hypothèses de l'auteur ;
  - analyser un argument : renforcer, affaiblir, hypothèse, explication alternative.

  Puis une leçon par format : select one, select one or more, select-in-passage. La taxonomie RC existe déjà dans `src/lib/generators/verbal/taxonomy.ts` : l'aligner sur la liste ETS.
- **Ch. V4 : Vocabulary toolkit**, voir §3.4.

**Analytical Writing**

- **Ch. W1 : The Issue task.** La consigne, la grille officielle 0–6 (expliquée niveau par niveau, en paraphrasant, sans copier), un plan d'essai en 4 à 5 paragraphes, la gestion des 30 minutes.
- **Ch. W2 : Practice.** Sujets tirés du pool officiel ETS (lien vers la source, pas de copie si la licence l'interdit). Éditeur de texte **sans correcteur orthographique** (comme le vrai test) et timer de 30 min. Auto-évaluation guidée par une checklist fondée sur la grille. Notation par IA en option (§6.6).

**Test-taking**

- **Ch. T1 : Test day & scoring** : sections adaptatives, Mark/Review, absence de pénalité (« always answer »), gestion du temps par section, rapport de score (`ets-test-structure`).

### 3.4 Le vocabulaire : honnêteté sur la source

ETS **ne publie pas de liste de mots**. Le vocabulaire est évalué *en contexte* dans les TC et SE (c'est cité dans `ets-verbal-overview`). Le module Vocabulary est donc légitime comme **outil** au service de TC et SE, mais :

- l'afficher comme **« Vocabulary toolkit — supports TC & SE »**, et non comme un chapitre du programme officiel ;
- rattacher chaque série à des questions TC et SE qui utilisent ces mots (lien « Practice these words in context ») ;
- supprimer la traduction française comme champ par défaut (produit en anglais) et la garder derrière un réglage « Show translation », désactivé par défaut. Décision CEO : utile pour l'apprentissage, mais pas imposée.

### 3.5 La dynamique « TTP » : une banque finie et cochable

- Chaque leçon a un **practice set fixe** de 10 à 25 questions, avec une difficulté croissante (1 → 5).
- Chaque chapitre a un **chapter test** de 15 à 20 questions, chronométré.
- Un compteur visible partout : **« 412 / 2 700 questions done · 87 % accuracy »**.
- Un objectif atteint = 100 % des questions faites **et** toutes les questions ratées refaites jusqu'à les réussir (file « Redo missed »).
- Volume cible de la banque, en v1 complète :
  - Quant ≈ 1 500 questions ;
  - Verbal ≈ 1 200 questions, dont environ 120 passages RC ;
  - 6 mock tests complets, avec des questions exclusives aux mocks.

---

## 4. Fonctionnalités : le benchmark et ce qu'on prend

| Concurrent | Ce qu'ils font bien | Ce qu'on reprend |
|---|---|---|
| **Target Test Prep** | Chapitres et leçons, banque finie, analytics par sujet, **error tracker**, plan d'étude personnalisé, assistant IA | Tout : c'est le modèle |
| **Magoosh** | Vidéos courtes, vocabulaire, application mobile | Le côté mobile d'abord, le vocabulaire. Pas de vidéo en v1 |
| **Manhattan Prep** | Profondeur stratégique, guides par thème, mocks de qualité | Les mocks réalistes, les leçons de stratégie |
| **Kaplan** | Mocks adaptatifs réalistes, Qbank filtrable | Le Qbank filtrable (« custom quiz builder ») |
| **GregMat** | Excellent rapport qualité-prix, méthodologie verbale claire | La clarté des explications verbales |
| **ETS POWERPREP** | L'interface officielle | **Notre interface d'examen doit être visuellement équivalente** (§6.1) |

Différenciateurs SAR Prep :

1. Un mobile au même niveau que l'ordinateur, y compris pour les questions RC et DI.
2. Des leçons sourcées et courtes.
3. Des explications « pourquoi chaque mauvaise réponse est fausse » pour toutes les questions.
4. Un error log avec la *raison* de chaque erreur.
5. La répétition espacée appliquée aux **questions ratées**, pas seulement au vocabulaire.
6. Entièrement gratuit, sans paywall.

---

## 5. Modèle de contenu (content-as-code)

```
content/
  sources.json                      # liste fermée des sources ETS (§3.1)
  chapters/
    quant/q1-arithmetic/
      chapter.json                  # id, title, order, officialRef
      lessons/
        q1-01-integers.mdx          # frontmatter + gabarit imposé
        q1-01-integers.questions.json
    verbal/...
    writing/...
  passages/*.json                   # passages RC (texte original)
  mocks/mock-01.json                # 5 sections, ids de questions exclusives
```

Frontmatter de leçon (schéma Zod dans `src/content/schema.ts`) :

```yaml
id: q1-01-integers
chapter: q1-arithmetic
title: Integers
order: 1
officialRef: { source: ets-math-review, section: "1.1", label: "Integers" }
objectives: ["Apply divisibility rules", "Find GCD/LCM", "Work with remainders"]
estMinutes: 8
lengthJustification: null
```

Une question reprend les types existants de `src/types/questions.ts`, avec en plus :

- `id` stable : `q1-01-integers-007` ;
- `lessonId` ;
- `difficulty` (1 à 5) ;
- `explanation` : l'explication de la bonne réponse ;
- `choiceExplanations` : 1 ligne par mauvaise réponse ;
- `estSeconds` : temps cible ;
- `skills[]` ;
- `review` : statut du pipeline (§9), de la forme `{ solvedBy: [...], approvedBy, sourceChecked }`.

Les questions générées par `src/lib/generators` sont **matérialisées** (sérialisées en JSON avec un seed fixe) dans `content/`. Elles passent ensuite par le même pipeline QA que les autres. On ne génère jamais à la volée en production : un élève doit retrouver la même question n° 7.

Un script `npm run content:check` vérifie, et la CI le bloque en cas d'échec :

- le schéma Zod ;
- l'`officialRef` valide ;
- les ids uniques ;
- le nombre de choix conforme au format (TC 5 ou 3, SE 6 avec exactement 2 bonnes, QC 4) ;
- qu'une réponse NE est un nombre valide ;
- qu'aucune paire de distracteurs SE ne forme une 2ᵉ réponse (réutiliser `checkVocab`) ;
- le budget de longueur ;
- que les liens vocabulaire → questions existent.

**Base de données** (Drizzle, migrations versionnées) : uniquement les données utilisateur.

- `attempts` : existe déjà. `questionId` devient un `text` qui reçoit l'id de contenu.
- `test_sessions` : existe déjà, à étendre pour les mocks : sections, routage adaptatif, scores.
- `lesson_progress` : statut de lecture et résultat du check.
- `review_queue` : la répétition espacée des erreurs, en FSRS ou SM-2 simplifié.
- `error_log` : la raison de l'erreur, choisie par l'élève (`concept` | `careless` | `misread` | `time` | `guess`) et une note libre.
- `essays` : texte, durée, auto-évaluation, score IA éventuel.
- `users_progress` (vocabulaire) : on garde la table.

Les tables `questions`, `passages` et `figures` en base deviennent inutiles. Il faut les migrer proprement (`drizzle-kit generate`), et non les supprimer à la main.

Offline : le contenu étant embarqué, le service worker le met en cache. Les tentatives faites hors ligne sont stockées dans IndexedDB puis synchronisées. Réutiliser la logique de fusion existante.

---

## 6. Expérience produit

### 6.1 Deux modes visuels distincts

- **Learn mode** (leçons, dashboard, vocabulaire) : l'identité SAR Prep, refondue (§6.4).
- **Exam mode** (practice sets chronométrés, chapter tests, mocks) : une **reproduction fonctionnelle de l'interface officielle**, sobre, sur fond clair, sans logo ETS.

Disposition de l'exam mode :

- **Barre supérieure** : nom de la section, « Question 3 of 12 », timer (avec un bouton pour le masquer, comme au vrai test), et les boutons **Mark**, **Review**, **Help**, **Back** et **Next**. Le bouton **Calculator** n'apparaît qu'en Quant.
- **RC et DI**, sur ordinateur : un écran partagé, passage ou figure à gauche avec son propre défilement, question à droite.
- **RC et DI**, sur mobile : des onglets collants « Passage | Question » plus un aperçu glissant. Il ne doit jamais falloir zoomer.
- **Écran Review** : une grille des questions, avec les colonnes Answered / Not answered / Marked, et la possibilité de sauter à une question.
- **Calculatrice** : une fenêtre flottante déplaçable sur ordinateur, une feuille du bas (bottom sheet) sur mobile. Elle reprend les fonctions de la calculatrice ETS : `+ − × ÷ √ ( )`, `MR MC M+`, `±`, et **Transfer Display**, qui recopie le résultat dans une case NE.
- **Select one** : boutons radio ronds. **Select one or more** : cases carrées, avec l'indication « Select all that apply » / « Indicate all such… ».
- **TC à 2 ou 3 blancs** : des colonnes Blank (i) / (ii) / (iii). Sur mobile, elles s'empilent avec des en-têtes collants.
- **Select-in-passage** : un tap sur une phrase la surligne.
- **Une interface d'entraînement en plus**, désactivable : la réponse et l'explication s'affichent après chaque question (« Tutor mode »). En « Timed mode », elles ne s'affichent qu'à la fin, exactement comme au test.

### 6.2 Après chaque question (en mode tutor ou en revue)

- La bonne réponse, puis l'explication de la bonne réponse.
- Pourquoi chaque mauvaise réponse est fausse.
- Le temps passé comparé au temps cible.
- Un lien « Revisit lesson » vers la section concernée.
- Une demande en 1 tap : « Why did you miss it? », pour alimenter l'error log.
- Un bouton « Report an issue » (stocké en base, pour corriger le contenu).

### 6.3 Écrans

1. **Home / Dashboard** :
   - l'action du jour (« Continue: Q2 · Quadratic equations, 6 questions left »), la file de révisions dues, le streak ;
   - la couverture globale (questions faites / total), Verbal et Quant ;
   - une **estimation de score**, avec l'avertissement « estimate, not an official score ». Elle ne s'affiche qu'après le diagnostic ou un mock.
2. **Learn** : la liste des chapitres, avec la progression de chacun ; la page chapitre avec ses leçons ; la page leçon.
3. **Practice** : Qbank filtrable (section, type, chapitre, difficulté, non faites / ratées / marquées), avec un nombre de questions et un timer configurables.
4. **Review** : la répétition espacée (questions ratées et vocabulaire), et l'error log filtrable.
5. **Mock tests** : 6 mocks complets, plus un **diagnostic** court (environ 40 minutes) au premier lancement.
6. **Writing** : liste des sujets, éditeur, essais passés.
7. **Vocabulary** : les séries existantes (QCM, saisie, flashcards).
8. **Stats** :
   - précision par chapitre, leçon et type de question ;
   - temps moyen comparé au temps cible ;
   - évolution dans le temps ;
   - répartition des raisons d'erreur ;
   - un « weakest 5 lessons » avec un lien direct.
9. **Study plan** : la date d'examen et le nombre d'heures par semaine donnent un planning hebdomadaire (leçons, sets, mocks), recalculé chaque semaine selon les résultats.
10. **Settings** : la date d'examen, le thème clair/sombre, la traduction des mots de vocabulaire, l'export et la réinitialisation des données, la déconnexion.

Navigation : sur mobile, une **barre d'onglets en bas** (Home · Learn · Practice · Review · More). Sur ordinateur, une sidebar.

### 6.4 Refonte du design (learn mode)

- Garder l'ADN sombre et violet, mais ajouter un **thème clair** : plusieurs heures de lecture par jour fatiguent moins en clair. Thème par défaut : celui du système.
- Les tokens de couleur, d'espacement, de rayon et de typographie vont dans `globals.css` (`@theme` Tailwind 4). Plus aucune couleur codée en dur dans les composants (ex. `QuestionView.tsx` utilise directement `violet-400/70`).
- Typographie : Inter pour l'UI. Pour les passages RC, une police de lecture avec un interlignage de 1,6 à 1,7 et une largeur de 65 à 75 caractères.
- Les maths en **KaTeX**, rendues côté serveur au build.
- Les figures : étendre `FigureView` (SVG) à la géométrie (triangles, cercles, droites, solides), avec la mention « Note: Figure not drawn to scale » quand c'est le cas, conformément à `ets-math-conventions`.
- Animations Framer Motion sobres. `prefers-reduced-motion` respecté.
- Accessibilité :
  - contraste AA ;
  - navigation clavier complète en exam mode : A–E pour les choix, ←/→ pour Back/Next, M pour Mark ;
  - focus visible, rôles ARIA corrects (radiogroup, checkbox) ;
  - cibles tactiles d'au moins 44 px.

### 6.5 Responsive : exigence absolue

Largeurs de référence à tester **sur chaque écran** : **360, 390, 430** (téléphones), **768, 1024** (tablettes), **1280, 1440, 1920** (ordinateurs), en portrait et en paysage pour 390 et 768.

Règles :

- aucun défilement horizontal de la page ;
- aucun texte coupé ;
- le clavier mobile ne cache jamais la case NE ni l'éditeur d'essai (`visualViewport`) ;
- les safe areas iPhone sont respectées (déjà en place via `--sat` / `--sab`).

### 6.6 IA dans le produit (optionnelle, sans paiement)

Uniquement si une clé `ANTHROPIC_API_KEY` est configurée côté serveur. Sinon les fonctions sont masquées et rien ne casse.

- **Essay scoring** : une estimation de 0 à 6, avec une justification critère par critère selon la grille officielle et 3 actions concrètes. Avertissement clair : « AI estimate ».
- **« Explain differently »** : une reformulation de l'explication d'une question, *ancrée sur l'explication validée* (le modèle reçoit l'explication officielle de la question et ne doit pas la contredire).
- Limite d'usage par utilisateur et par jour (pas de facturation), et un modèle Claude récent par défaut.

---

## 7. Algorithmes

- **Diagnostic et estimation de score** : la difficulté (1 à 5) de chaque question réussie ou ratée alimente une estimation de type IRT simple (Rasch 1PL), puis une conversion vers 130–170 par table. Toujours présenté comme une estimation.
- **Mocks adaptatifs** : la section 1 est de difficulté moyenne. Le score obtenu oriente vers une section 2 *easy*, *medium* ou *hard* (le seuil se configure dans le JSON du mock). Le score final dépend du nombre de bonnes réponses et du routage, via une table de conversion par mock.
- **Répétition espacée** : un SM-2 simplifié ou FSRS-lite. Une question ratée revient à J+1, J+3, J+7, J+21. Elle sort de la file après 2 réussites espacées. Le vocabulaire utilise le même moteur, avec une seule file « Due today ».
- **Study plan** : (questions restantes × temps cible) + leçons + mocks, réparti jusqu'à la date d'examen, avec une priorité aux leçons faibles.

---

## 8. Qualité et ingénierie

- **TypeScript strict**. Lint propre (`npm run lint`).
- **Vitest** :
  - `grading.ts` : tous les formats, NE (tolérance, fractions équivalentes, `1/2` = `2/4` si ETS l'accepte) ;
  - générateurs (déterministes par seed) ;
  - schémas de contenu ;
  - répétition espacée, estimation de score, routage des mocks.
- **Playwright** : les parcours principaux (connexion simulée, leçon → set → revue, mock complet accéléré, essai) et un **test visuel** :
  - script `npm run screens` qui capture chaque écran aux 8 largeurs du §6.5, dans `screenshots/<date>/<route>@<width>.png` ;
  - un test qui échoue si `document.documentElement.scrollWidth > innerWidth` ;
  - une vérification d'accessibilité avec `@axe-core/playwright`.
  - Chromium est déjà installé dans l'environnement. Ne pas lancer `playwright install`.
- **Performance** : Lighthouse mobile d'au moins 90 (performance et accessibilité) sur Home, Lesson et Exam. Contenu statique (SSG) autant que possible.
- **CI GitHub Actions** : lint, typecheck, `content:check`, vitest, playwright (y compris le contrôle de débordement), build.
- **Commits** : petits, conventional commits, une PR par phase.

---

## 9. Organisation : équipe d'agents IA

Le CTO (toi) orchestre et lance des sous-agents spécialisés avec l'outil Agent. Chacun reçoit un brief précis, un périmètre de fichiers et un livrable vérifiable. Les agents travaillent en parallèle quand leurs périmètres ne se recoupent pas (des worktrees isolés si besoin).

| Agent | Rôle | Entrées | Sortie / critère |
|---|---|---|---|
| **Syllabus Architect** | Lit les sources ETS officielles (§3.1). Produit `content/sources.json` et le squelette `chapter.json` et lesson frontmatter avec les `officialRef` exacts | Pages et PDF ETS | Chaque leçon cite une section existante. Rien hors programme |
| **Lesson Author** (un par chapitre) | Écrit les leçons selon le gabarit §3.2 | Squelette, `officialRef` | MDX conforme, dans le budget de longueur |
| **Question Author** (Quant / Verbal / RC) | Écrit ou génère les questions de chaque leçon, avec explications et explications des mauvaises réponses | Leçon | JSON valide, difficultés réparties de 1 à 5 |
| **Independent Solver** (×2) | Résout chaque question **sans voir la clé** | Question sans réponse | Si un solveur diverge de la clé, la question est rejetée. Pour TC/SE, il vérifie aussi qu'aucune autre réponse n'est défendable |
| **Source Checker** | Vérifie que chaque leçon et chaque question reste dans le périmètre de son `officialRef`, et qu'aucun texte ETS n'est copié | Contenu et sources | `review.sourceChecked = true` |
| **Pedagogy Editor** | Applique le test de §3.2 : enlève le superflu, ajoute ce qui manque pour réussir le set | Leçon et son set | Diff et `approvedBy` |
| **Frontend Builder** | Composants, exam mode, écrans | Spécifications §6 | Écrans conformes |
| **Visual QA** | Lance `npm run screens`, **regarde les captures** (lecture des PNG) et ouvre une liste de défauts par écran et par largeur | Build local | Zéro débordement, zéro texte coupé, cibles tactiles ≥ 44 px |
| **Test Engineer** | Vitest, Playwright, CI | Code | CI verte |

Règle de pipeline : une question n'est publiée (`status: published`) qu'après **Author → Solver ×2 → Source Checker → Pedagogy Editor**. Le statut est stocké dans le JSON et `content:check` refuse de publier ce qui n'a pas fini le pipeline.

---

## 10. Phases et critères d'acceptation

Chaque phase = une PR, avec des captures d'écran mobile et ordinateur dans la description.

**Phase 0 : nettoyage et fondations (petite)**
- Supprimer Supabase, les `.DS_Store` et les chaînes en français. Réécrire le README.
- Ajouter Vitest, Playwright, CI, le script `screens` et le contrôle de débordement.
- ✅ La CI est verte. Les captures de l'existant sont générées (elles servent de référence « avant »).

**Phase 1 : modèle de contenu et syllabus**
- `content/`, schémas Zod, `content:check`, `sources.json`.
- Le squelette complet chapitres/leçons avec les `officialRef` (Syllabus Architect et Source Checker).
- ✅ 100 % des leçons ont un `officialRef` vérifié. Le build échoue si l'un manque.

**Phase 2 : design system et navigation**
- Tokens, thèmes clair et sombre, barre d'onglets mobile et sidebar, Dashboard, Learn (chapitre et leçon), composant `<Lesson>`, KaTeX.
- ✅ Captures aux 8 largeurs sans défaut. Lighthouse mobile ≥ 90.

**Phase 3 : exam mode fidèle**
- Le shell d'examen (barre supérieure, Mark/Review/Back/Next, timer masquable, écran Review, calculatrice avec Transfer Display).
- Tous les formats de questions (TC 1/2/3, SE, RC × 3, QC, PS × 2, NE entier/décimal/fraction, DI), en tutor mode et en timed mode, avec la navigation clavier.
- ✅ Une question de démonstration par format fonctionne en mobile et en ordinateur. Les tests de notation couvrent tous les formats. Captures validées par Visual QA.

**Phase 4 : contenu Quant**
- Leçons et practice sets de Q0 à Q4, puis les chapter tests. Les générateurs existants sont étendus et matérialisés.
- ✅ Environ 1 500 questions publiées après le pipeline complet.

**Phase 5 : contenu Verbal et Writing**
- V0 à V3, environ 120 passages RC originaux, le lien entre vocabulaire et TC/SE, W1 et W2 (éditeur et timer).
- ✅ Environ 1 200 questions publiées. L'éditeur d'essai fonctionne sur mobile, clavier ouvert.

**Phase 6 : apprentissage et données**
- Attempts, error log, répétition espacée, Stats, Qbank filtrable, « Redo missed », synchronisation hors ligne.
- ✅ Un parcours de bout en bout testé dans Playwright.

**Phase 7 : mocks, diagnostic et study plan**
- Le diagnostic, 6 mocks adaptatifs par section, l'estimation de score et le study plan.
- ✅ Un mock complet jouable (avec horloge accélérée en test). Le routage et le scoring sont couverts par des tests.

**Phase 8 : IA optionnelle et finitions**
- Le scoring d'essai, « Explain differently », le signalement d'erreurs, l'audit d'accessibilité, le cache PWA du contenu.
- ✅ L'application fonctionne entièrement sans clé IA. Axe ne remonte aucune violation sérieuse.

---

## 11. Décisions prises par le CEO (modifiables)

1. **Langue** : 100 % anglais. La traduction FR du vocabulaire est cachée par défaut, derrière un réglage.
2. **Gratuit** : aucun paiement, aucun paywall, aucune publicité.
3. **Contenu** : 100 % original, écrit selon les specs ETS. Aucune copie de contenu ETS ou concurrent. Les sources servent de *périmètre*, pas de matière à copier.
4. **Le vocabulaire reste**, présenté comme un outil au service de TC et SE (ETS ne publie pas de liste).
5. **Pas de vidéo en v1.** Texte, exemples résolus et interactivité. Plus rapide à consommer, ce qui va dans le sens de la règle « zéro remplissage ».
6. **Thème** : celui du système par défaut, clair et sombre disponibles. L'exam mode reste toujours clair, comme le vrai test.
7. **IA** : optionnelle, désactivée sans clé, jamais source de vérité pour une réponse.
8. **Contenu dans le dépôt** (relu en PR), et non dans un CMS. Une seule personne édite, l'historique Git suffit.

## 12. Ce que tu (CTO) ne dois jamais faire

- Ajouter une leçon ou un sujet sans `officialRef`.
- Publier une question qui n'a pas passé les deux solveurs.
- Copier un texte ETS, Kaplan, Manhattan, TTP ou Magoosh.
- Livrer un écran sans captures aux 8 largeurs.
- Introduire un paiement, un tracking publicitaire ou une chaîne en français dans l'UI.
- Modifier le schéma de base sans migration Drizzle versionnée.
