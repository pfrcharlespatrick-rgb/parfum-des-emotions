# The Perfume of Emotions — English edition

This folder holds the English edition of *Le Parfum des émotions*: a standalone application in
which the client expresses what they feel, and the perfumer receives a composition sheet
(raw materials, olfactory pyramid, indicative dosages).

No dependency, no server, no API key: static files that work just as well by double-clicking
the pages as published on GitHub Pages.

**One address, two languages.** The application opens at a single address,
`https://<account>.github.io/parfum-des-emotions/`, in French or in English. The **FR | EN**
button at the top of every page switches between the two without losing anything: the story and
settings in progress on the client page, the session in progress in the salon, at the same step.
The choice is remembered on the device; on a first visit, the page follows the browser's
language. A link can impose the language — `…/parfum-des-emotions/?lang=en` —, and that is what
“Copy the share link” does, so the client reopens the sheet in their own language.

Three entry points, all at the root of the site:

- **`index.html`** — the public page, which the client fills in themselves and shares by link.
- **`salon.html`** — the same session led on a tablet during the appointment, with the blotters
  to smell and the memory of past clients.
- **`palette.html`** — the perfumer's palette: their stock, entered in the application.

How it is built: the three pages are language-neutral shells. `../langue.js`, loaded first, reads
the choice and then loads either the root files (French) or the files of this folder (English):
`textes.js` — the fixed texts of the page —, `donnees.js`, `moteur.js`, `fiche.js`, `ia.js`, then
`app.js`, `salon.js` or `palette.js` and `palette-outils.js`. The old `en/…html` addresses
forward to the single address.

## How it works

1. **The free-text story is read** by a lexicon (`LEXIQUE` in `donnees.js`): recognised words
   suggest emotions and sometimes evoke a facet directly (“rain” → aquatic, “wool” → nothing,
   “tobacco” → smoky). Words are matched whole, with the usual English endings tolerated, so
   “tea” never fires on “team” nor “rain” on “train”. The client confirms with a click; nothing
   is imposed.
2. **Emotions, sliders, season and time of day** are added into a *facet vector*: 24 olfactory
   axes (citrus, powdery, resins, leather, musky…), positive or negative. It is the only shared
   language between feeling and matter.
3. **Each material is scored** by dot product with that vector, softened by its specialisation:
   a very typed material is not crushed by an all-rounder.
4. **Selection** takes the best-scored materials per tier, with two safeguards: no more than two
   materials from one family, and a *carrier* is added when the tier cannot reach its share
   (molecules dosed in tenths of a percent do not fill 25% of a concentrate). A binder (Hedione,
   Iso E Super, musks) is guaranteed: without one, nothing blends.
5. **Percentages** are distributed by constrained filling: each tier's share is first brought
   back within what its materials really allow, then spread without ever leaving a material's
   dosage range. If the client's exclusions narrow the palette too much, the remainder is shown
   as **adjustment solvent** rather than disguised as overdoses.

## The assistant (optional)

The keyword lexicon only sees what it knows. Connected to the Claude API, the assistant really
reads the story: metaphors, memories told over several sentences, smells suggested without being
named. It replaces nothing — it **proposes**, and the client confirms with a button, as with the
lexicon.

Its output is constrained by a JSON schema built from `donnees.js`: the model can only answer
with emotions and facets the engine already knows. `ia.js` re-validates everything that enters
the engine anyway, and the application falls back on the lexicon as soon as the reading fails
(service unavailable, text declined, device offline).

Two modes, under **Assistant settings**:

| Mode | Where the key lives | For whom |
| --- | --- | --- |
| House service | On the server (`../serveur/worker.js`) | Recommended — the only acceptable one for a public page or a lent tablet |
| Key on this device | In the browser of the workstation | The perfumer's private workstation, to try without deploying anything |

The settings are shared with the French edition: configure the assistant once, it serves both.
When the English page goes through the house service, it sends `langue: "en"` and the summary
comes back in English.

## The salon view

`salon.html` is the same session, held by hand during the appointment: six full-screen steps,
large touch targets, one decision at a time. Two things only it brings:

- **The blotters to smell.** The composition becomes a numbered list of blotters to prepare, in
  the order to smell them. For each material, the perfumer notes the client's reaction: ♥ keeps it
  in the formula whatever the arithmetic says, ✕ takes it out. “Recompose with this feedback”
  rebuilds the formula around what pleased — this is where the tool stops guessing and starts
  listening.
- **The memory of sessions.** Client's name, story, settings and trial feedback are saved on the
  tablet (and nowhere else), and picked up again with one button at the next appointment. Saving
  is forced before any change of session and as soon as the application goes to the background:
  a tablet is interrupted at any moment.

## What the sheet gives the perfumer

Top / heart / base pyramid with share of the concentrate and mass for 10 g **of pure material**,
dominant families, olfactory profile, dilution in alcohol for 30 mL according to the chosen
concentration, and the regulatory points of caution carried by the selected materials
(cinnamon, oakmoss, birch tar…).

When materials are diluted, an extra column gives the mass **to weigh from the bottle** — pure
mass ÷ dilution — and a block checks that weighing is even possible: if the amounts exceed the
batch, the sheet says so, names the materials at fault and gives the minimum dilution that would
be needed.

The dosages are a **laboratory starting point**, not a finished formula: IFRA compliance, the
calculation of declarable allergens and the actual balance remain the perfumer's work.

## The house palette

The palette shipped in `donnees.js` is a **demonstration**: about 90 classic materials, chosen so
that the application works from the first opening. A perfumer does not work with that — they
work with what is on their shelves.

`../stock.js` is **deliberately empty**. The repository is public: committing a workshop's
inventory to it would amount to publishing it. The real palette is therefore entered in
“My palette”, where it stays on the perfumer's device. The engine takes its palette from the
first of these three places that is filled:

1. **the one entered in the application** (`palette.html`), kept on the perfumer's device;
2. **the one committed to the repository** (`../stock.js`), valid for every device;
3. the demonstration palette.

The palette is stored under the same browser key as the French edition: a palette entered in
one language serves the other as it is, under the house's own names.

### In the application: “My palette”

- **Paste my list**: one material per line. Those the application knows arrive already
  described — facets, dosages, character; the others are named as still to be completed.
- **Start from the demonstration palette** (or the repository palette if there is one): copy
  everything, then remove what you do not have.
- Each material opens with a touch: name, family, tier, nature, strength, dosage range,
  **working dilution**, character, and the facets in three intensities — light, marked, dominant.
- **Dilutions are read from pasted names**: “Alpha-ionone 10%” gives the material *Alpha-ionone*
  diluted to 10%, as on the bottle label.
- **The status report is permanent**: at every change, the six dry runs are rerun and the
  palette status updates — tier without carrier, ceiling under 100%, too few families, material
  the engine could never pick.
- **Save / export**: a `.json` backup, or a `stock.js` file ready to place at the root of the
  repository so the palette applies to every device.

The command-line tools in `../outils/` match names against the French reference palette; for an
English list, use “Paste my list” in this page instead.

## What is shared with the French edition

- The style sheets, `palette-locale.js` and `stock.js`, loaded from the parent folder.
- **The identifiers** — facets, emotions, materials, tiers (`tete`, `coeur`, `fond`), natures
  (`naturelle`, `synthese`) and tags are the same in `en/donnees.js` and `../donnees.js`. Only
  the displayed names change. `node outils/verifier-schema.mjs`, run from the repository root,
  checks that both editions stay in step.
- **Browser storage** — palette, salon sessions and assistant settings live under the same keys.
- **The JSON export** of the sheet keeps the same keys in both languages, with an extra
  `langue` field on the English side.

What is translated, and therefore duplicated: `donnees.js`, `moteur.js` (same arithmetic,
English wording), `fiche.js`, `ia.js`, `app.js`, `salon.js`, `palette.js`, `palette-outils.js`
and `textes.js`. A fix in the engine or in the verification rules is mirrored in its twin.

## Sharing

The “Copy the share link” button encodes the whole request in the URL fragment. The client sends
that link to the perfumer, who reopens exactly the same sheet — no database, no account. The JSON
export, for its part, is meant to feed the request into an order-tracking system.
