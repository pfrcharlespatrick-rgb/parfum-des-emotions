/* Composition engine: emotion -> facets -> materials -> formula.
   No dependency, no network call.
   English edition: identical arithmetic to the French moteur.js; only the
   reading of the story (word matching) and the wording for the client differ. */

/* --- utilities ---------------------------------------------------- */

const DIACRITIQUES = /[̀-ͯ]/g;
const sansAccents = (s) => s.normalize('NFD').replace(DIACRITIQUES, '').toLowerCase();

function ajouter(vecteur, facettes, coefficient = 1) {
  for (const [f, p] of Object.entries(facettes)) {
    vecteur[f] = (vecteur[f] || 0) + p * coefficient;
  }
  return vecteur;
}

/* --- 1. Reading the free-text story ------------------------------- */
/* Returns the detected emotions and the facets named explicitly.

   English words are short and nest inside one another ("tea" in "team",
   "sea" in "season", "rain" in "train"), so a plain substring test would
   misfire constantly. Each keyword is matched as a whole word, with the
   usual endings tolerated: rain, rains, rained, raining, rainy, rainless. */

const MOTIFS = new Map();

function motif(mot) {
  let r = MOTIFS.get(mot);
  if (!r) {
    const base = sansAccents(mot).trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '\\s+');
    r = new RegExp(`(?:^|[^a-z0-9])${base}(?:s|es|ed|d|ing|y|ies|ly|ness|ful)?(?=$|[^a-z0-9])`);
    MOTIFS.set(mot, r);
  }
  return r;
}

function analyserRecit(texte) {
  const t = sansAccents(texte || '');
  const emotions = new Set();
  const facettes = {};
  if (!t.trim()) return { emotions: [], facettes };

  for (const entree of LEXIQUE) {
    const trouve = entree.mots.some((m) => motif(m).test(t));
    if (!trouve) continue;
    (entree.emotions || []).forEach((e) => emotions.add(e));
    if (entree.facettes) ajouter(facettes, entree.facettes, 1);
  }
  return { emotions: [...emotions], facettes };
}

/* --- 2. Target vector --------------------------------------------- */

const SAISONS = {
  printemps: { vert: .3, floral_blanc: .25, agrumes: .2, floral_poudre: .15 },
  ete:       { agrumes: .4, aquatique: .3, vert: .2, ambre: -.25, gourmand: -.2 },
  automne:   { mousse_terre: .3, bois_sec: .3, epice_chaud: .25, fruite: .15 },
  hiver:     { ambre: .4, vanille: .3, resine: .3, epice_chaud: .2, agrumes: -.2 },
  toutes:    {}
};

const MOMENTS = {
  jour:        { agrumes: .2, vert: .2, musc: .15, the: .15, animal: -.2 },
  soir:        { ambre: .25, resine: .2, floral_blanc: .2, animal: .15, cuir: .15 },
  indifferent: {}
};

function vecteurCible(etat) {
  const v = {};

  // Emotions ticked by the client
  const choisies = EMOTIONS.filter((e) => etat.emotions.includes(e.id));
  choisies.forEach((e) => ajouter(v, e.poids, 1));

  // Free-text story: inferred emotions weigh less than ticked ones
  const lu = analyserRecit(etat.recit);
  lu.emotions
    .filter((id) => !etat.emotions.includes(id))
    .forEach((id) => {
      const e = EMOTIONS.find((x) => x.id === id);
      if (e) ajouter(v, e.poids, .55);
    });
  ajouter(v, lu.facettes, .7);

  // Facets inferred by the assistant (fine reading of the story) — see ia.js
  if (etat.facettesIA) ajouter(v, etat.facettesIA, .8);

  // Sliders
  for (const c of CURSEURS) {
    const val = etat.curseurs[c.id] || 0;
    if (val) ajouter(v, c.effet, val);
  }

  // Context
  ajouter(v, SAISONS[etat.saison] || {}, 1);
  ajouter(v, MOMENTS[etat.moment] || {}, 1);

  // Normalisation on the largest absolute value
  const max = Math.max(...Object.values(v).map(Math.abs), .0001);
  for (const f of Object.keys(v)) v[f] = v[f] / max;
  return v;
}

/* --- 3. Filters and score ----------------------------------------- */

/* Three possible palettes, in this order:
   1. the one entered in the application and kept on the device (definirPalette);
   2. the one committed to the repository (stock.js);
   3. the demonstration palette of donnees.js.                          */
let paletteMaison = null;

function definirPalette(liste) {
  paletteMaison = (Array.isArray(liste) && liste.length) ? liste : null;
}

function palette() {
  if (paletteMaison) return paletteMaison;
  return (typeof STOCK_MAISON !== 'undefined' && STOCK_MAISON.length)
    ? STOCK_MAISON : MATIERES;
}

function originePalette() {
  if (paletteMaison) return 'appareil';
  return (typeof STOCK_MAISON !== 'undefined' && STOCK_MAISON.length) ? 'depot' : 'demonstration';
}

function estExclue(matiere, exclusions, ecartees = []) {
  if (ecartees.includes(matiere.id)) return true;   // rejected on the blotter
  return exclusions.some((idEx) => {
    const ex = EXCLUSIONS.find((e) => e.id === idEx);
    if (!ex) return false;
    if (ex.nature && matiere.nature === ex.nature) return true;
    return (ex.tags || []).some((tag) => (matiere.tags || []).includes(tag));
  });
}

function scorer(matiere, cible) {
  let produit = 0;
  let norme = 0;
  for (const [f, p] of Object.entries(matiere.facettes)) {
    produit += (cible[f] || 0) * p;
    norme += p * p;
  }
  // soft root: highly specialised materials are not crushed by all-rounders
  return produit / Math.pow(Math.max(norme, .01), .35);
}

/* --- 4. Selection ------------------------------------------------- */

const LIANTS = ['hedione', 'iso_e', 'muscone'];

function selectionner(cible, exclusions, nombres, equilibre, etat = {}) {
  const ecartees = etat.ecartees || [];
  const imposees = etat.imposees || [];

  const notes = palette()
    .filter((m) => !estExclue(m, exclusions, ecartees))
    .map((m) => ({ m, score: scorer(m, cible) }))
    .sort((a, b) => b.score - a.score);

  const retenues = [];
  const parFamille = {};

  for (const role of ['tete', 'coeur', 'fond']) {
    const voulu = nombres[role];
    const candidats = notes.filter((n) => n.m.role === role);

    // Materials liked on the blotter go in automatically
    const prises = candidats.filter((n) => imposees.includes(n.m.id));
    prises.forEach((n) => {
      parFamille[n.m.famille] = (parFamille[n.m.famille] || 0) + 1;
      // a material kept after trial deserves a real place, not the minimum dose
      n.score = Math.max(n.score, .6);
    });

    for (const n of candidats) {
      if (prises.includes(n)) continue;
      if (prises.length >= voulu) break;
      const fam = n.m.famille;
      if ((parFamille[fam] || 0) >= 2) continue;      // no more than 2 per family
      if (n.score <= 0 && prises.length >= 2) continue; // no contrary material
      parFamille[fam] = (parFamille[fam] || 0) + 1;
      prises.push(n);
    }
    // safety net if the filters ate everything
    if (!prises.length && candidats.length) prises.push(candidats[0]);

    // A tier must be able to reach its share: if the selected materials are
    // all molecules dosed in tenths of a percent, add a carrier.
    const plafond = () => prises.reduce((a, n) => a + n.m.dose[1], 0);
    for (const n of candidats) {
      if (plafond() >= equilibre[role]) break;
      if (prises.includes(n) || n.m.dose[1] < 4) continue;
      if ((parFamille[n.m.famille] || 0) >= 3) continue;
      parFamille[n.m.famille] = (parFamille[n.m.famille] || 0) + 1;
      prises.push(n);
    }
    retenues.push(...prises);
  }

  // A binder is essential to the hold and blending of the formula
  const aUnLiant = retenues.some((n) => LIANTS.includes(n.m.id));
  if (!aUnLiant) {
    const liant = notes.find((n) => LIANTS.includes(n.m.id));
    if (liant) retenues.push(liant);
  }
  return retenues;
}

/* --- 5. Distributing the percentages ------------------------------ */

function equilibrePyramide(etat) {
  let tete = 25, coeur = 40, fond = 35;
  const presence = etat.curseurs.presence || 0;
  const lumiere = etat.curseurs.lumiere || 0;
  tete += -8 * presence + 5 * lumiere;
  fond += 10 * presence - 5 * lumiere;
  coeur = 100 - tete - fond;
  return { tete, coeur, fond };
}

const ROLES = ['tete', 'coeur', 'fond'];

/* A tier can only carry what its materials allow: the target shares are
   brought back within the bounds that are actually reachable, and the
   difference is passed on to the tiers that still have room. */
function ajusterEquilibre(equilibre, groupes) {
  const bornes = {};
  ROLES.forEach((r) => {
    bornes[r] = {
      bas: groupes[r].reduce((a, n) => a + n.m.dose[0], 0),
      haut: groupes[r].reduce((a, n) => a + n.m.dose[1], 0)
    };
  });

  const cibles = {};
  ROLES.forEach((r) => { cibles[r] = equilibre[r]; });

  for (let passe = 0; passe < 12; passe++) {
    ROLES.forEach((r) => {
      cibles[r] = Math.min(Math.max(cibles[r], bornes[r].bas), bornes[r].haut);
    });
    const reste = 100 - ROLES.reduce((a, r) => a + cibles[r], 0);
    if (Math.abs(reste) < .0001) break;

    const jeu = {};
    let total = 0;
    ROLES.forEach((r) => {
      jeu[r] = reste > 0 ? bornes[r].haut - cibles[r] : cibles[r] - bornes[r].bas;
      total += jeu[r];
    });
    if (total < .0001) break;
    ROLES.forEach((r) => { cibles[r] += reste * (jeu[r] / total); });
  }
  return cibles;
}

/* Constrained filling: aim for the tier's share without ever leaving a
   material's dosage range. */
function remplir(groupe, cible) {
  // a high score pushes the dose up, a powerful material holds it back
  const poids = groupe.map((n) => Math.max(n.score, .05) / Math.pow(n.m.force, 1.4));
  const sommePoids = poids.reduce((a, b) => a + b, 0);

  const borne = (v, i) => Math.min(Math.max(v, groupe[i].m.dose[0]), groupe[i].m.dose[1]);
  let parts = poids.map((p, i) => borne(cible * (p / sommePoids), i));

  for (let passe = 0; passe < 24; passe++) {
    const ecart = cible - parts.reduce((a, b) => a + b, 0);
    if (Math.abs(ecart) < .001) break;
    const libres = parts
      .map((p, i) => ({ i, p }))
      .filter(({ i, p }) => (ecart > 0 ? p < groupe[i].m.dose[1] - 1e-9
                                       : p > groupe[i].m.dose[0] + 1e-9));
    if (!libres.length) break;
    const somme = libres.reduce((a, { i }) => a + poids[i], 0);
    libres.forEach(({ i }) => { parts[i] = borne(parts[i] + ecart * (poids[i] / somme), i); });
  }
  return parts;
}

function repartir(retenues, equilibre) {
  const groupes = {};
  ROLES.forEach((r) => { groupes[r] = retenues.filter((n) => n.m.role === r); });

  const cibles = ajusterEquilibre(equilibre, groupes);
  const resultat = { tete: [], coeur: [], fond: [] };

  ROLES.forEach((r) => {
    if (!groupes[r].length) return;
    const parts = remplir(groupes[r], cibles[r]);
    groupes[r].forEach((n, i) => resultat[r].push({ matiere: n.m, score: n.score, pct: parts[i] }));
    resultat[r].sort((a, b) => b.pct - a.pct);
  });

  // The concentrate cannot exceed 100%; if room is left (palette too
  // restricted by the exclusions), the remainder goes to the solvent.
  const total = ROLES.flatMap((r) => resultat[r]).reduce((a, l) => a + l.pct, 0);
  if (total > 100.0001) {
    ROLES.forEach((r) => resultat[r].forEach((l) => { l.pct = (l.pct / total) * 100; }));
  }
  return resultat;
}

/* --- 6. Overall readings ------------------------------------------ */

function famillesDominantes(pyramide) {
  const parFamille = {};
  ['tete', 'coeur', 'fond'].forEach((r) =>
    pyramide[r].forEach((l) => {
      parFamille[l.matiere.famille] = (parFamille[l.matiere.famille] || 0) + l.pct;
    }));
  return Object.entries(parFamille)
    .map(([nom, pct]) => ({ nom, pct }))
    .sort((a, b) => b.pct - a.pct);
}

function profilFacettes(pyramide) {
  const v = {};
  ['tete', 'coeur', 'fond'].forEach((r) =>
    pyramide[r].forEach((l) => ajouter(v, l.matiere.facettes, l.pct)));
  const max = Math.max(...Object.values(v), .0001);
  return Object.entries(v)
    .map(([f, p]) => ({ id: f, nom: FACETTES[f], part: p / max }))
    .sort((a, b) => b.part - a.part);
}

function alertes(pyramide) {
  const liste = [];
  ['tete', 'coeur', 'fond'].forEach((r) =>
    pyramide[r].forEach((l) => {
      if (l.matiere.prudence) liste.push({ nom: l.matiere.nom, texte: l.matiere.prudence });
    }));
  return liste;
}

/* --- 7. Putting it into words for the client ---------------------- */

const OUVERTURES = {
  agrumes: 'a zesty break in the clouds', vert: 'a freshly cut stem',
  aromatique: 'a breath of dry herbs', aldehyde: 'the sparkle of freshly ironed linen',
  aquatique: 'the air after rain', floral_blanc: 'a flower open in full sun',
  floral_poudre: 'a veil of old face powder', rose: 'a petal still cold',
  fruite: 'the flesh of a ripe fruit', the: 'a steeped tea leaf',
  epice_frais: 'a bright, biting spice', epice_chaud: 'a dark, sweet spice',
  miel: 'a lukewarm honey', gourmand: 'a sweetness from the kitchen',
  vanille: 'a deep vanilla', bois_sec: 'a cleanly cut wood',
  bois_cremeux: 'a milky wood', resine: 'church smoke',
  ambre: 'the warmth of skin in the sun', mousse_terre: 'damp earth',
  cuir: 'a patinated leather', fume: 'a dying ember',
  animal: 'something very close to the body', musc: 'clean skin'
};

/* Dominant facet of a tier, avoiding those already used. */
function facetteDominante(lignes, dejaVues) {
  const v = {};
  lignes.forEach((l) => ajouter(v, l.matiere.facettes, l.pct));
  const classees = Object.entries(v).sort((a, b) => b[1] - a[1]);
  const neuve = classees.find(([f]) => !dejaVues.has(f));
  return (neuve || classees[0] || [null])[0];
}

const enumerer = (l) => l.length <= 1 ? l.join('')
  : l.length === 2 ? l.join(' and ')
  : l.slice(0, -1).join(', ') + ', and ' + l[l.length - 1];

function noteIntention(etat, profil, pyramide) {
  const emos = EMOTIONS.filter((e) => etat.emotions.includes(e.id));
  const deduites = analyserRecit(etat.recit).emotions
    .filter((id) => !etat.emotions.includes(id))
    .map((id) => EMOTIONS.find((e) => e.id === id))
    .filter(Boolean);
  const toutes = [...emos, ...deduites];

  const debut = toutes.length
    ? `This perfume begins with ${enumerer(toutes.slice(0, 3).map((e) => e.nom.toLowerCase()))}.`
    : 'This perfume begins in territory that is still open.';

  // one image per tier, drawn from what really dominates that tier
  const vues = new Set();
  const image = (role) => {
    const f = facetteDominante(pyramide[role], vues);
    if (f) vues.add(f);
    return f ? (OUVERTURES[f] || FACETTES[f].toLowerCase()) : null;
  };
  const [it, ic, ifd] = ['tete', 'coeur', 'fond'].map(image);

  const morceaux = [];
  if (it || ic) morceaux.push(`opens on ${it || ic}`);
  if (it && ic) morceaux.push(`settles around ${ic}`);
  if (ifd) morceaux.push(`leaves ${ifd} behind`);
  const milieu = morceaux.length ? ` It ${enumerer(morceaux)}.` : '';

  const tete = pyramide.tete[0], fond = pyramide.fond[0];
  const fin = tete && fond
    ? ` The first impression belongs to ${tete.matiere.nom}; what stays on the skin, to ${fond.matiere.nom}.`
    : '';

  return debut + milieu + fin;
}

/* --- 8. Full composition ------------------------------------------ */

function composer(etat) {
  const cible = vecteurCible(etat);

  const presence = etat.curseurs.presence || 0;
  const nombres = {
    tete: presence > .4 ? 3 : 4,
    coeur: 5,
    fond: presence > .4 ? 5 : 4
  };

  const equilibre = equilibrePyramide(etat);
  const retenues = selectionner(cible, etat.exclusions, nombres, equilibre, etat);
  const pyramide = repartir(retenues, equilibre);
  const profil = profilFacettes(pyramide);
  const concentration = CONCENTRATIONS.find((c) => c.id === etat.concentration) || CONCENTRATIONS[1];

  const reel = {
    tete: pyramide.tete.reduce((a, l) => a + l.pct, 0),
    coeur: pyramide.coeur.reduce((a, l) => a + l.pct, 0),
    fond: pyramide.fond.reduce((a, l) => a + l.pct, 0)
  };
  const diluant = Math.max(0, 100 - (reel.tete + reel.coeur + reel.fond));

  return {
    diluant,
    etat,
    cible,
    pyramide,
    equilibre: reel,
    familles: famillesDominantes(pyramide),
    profil,
    alertes: alertes(pyramide),
    concentration,
    intention: noteIntention(etat, profil, pyramide),
    emotionsRetenues: [
      ...EMOTIONS.filter((e) => etat.emotions.includes(e.id)),
      ...analyserRecit(etat.recit).emotions
        .filter((id) => !etat.emotions.includes(id))
        .map((id) => EMOTIONS.find((e) => e.id === id)).filter(Boolean)
    ]
  };
}
