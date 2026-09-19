/* Moteur de composition : émotion -> facettes -> matières -> formule.
   Aucune dépendance, aucun appel réseau. */

/* --- utilitaires ------------------------------------------------- */

const DIACRITIQUES = /[̀-ͯ]/g;
const sansAccents = (s) => s.normalize('NFD').replace(DIACRITIQUES, '').toLowerCase();

function ajouter(vecteur, facettes, coefficient = 1) {
  for (const [f, p] of Object.entries(facettes)) {
    vecteur[f] = (vecteur[f] || 0) + p * coefficient;
  }
  return vecteur;
}

/* --- 1. Lecture du récit libre ----------------------------------- */
/* Retourne les émotions détectées et les facettes nommées explicitement. */

function analyserRecit(texte) {
  const t = sansAccents(texte || '');
  const emotions = new Set();
  const facettes = {};
  if (!t.trim()) return { emotions: [], facettes };

  for (const entree of LEXIQUE) {
    const trouve = entree.mots.some((m) => t.includes(sansAccents(m)));
    if (!trouve) continue;
    (entree.emotions || []).forEach((e) => emotions.add(e));
    if (entree.facettes) ajouter(facettes, entree.facettes, 1);
  }
  return { emotions: [...emotions], facettes };
}

/* --- 2. Vecteur cible -------------------------------------------- */

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

  // Émotions cochées
  const choisies = EMOTIONS.filter((e) => etat.emotions.includes(e.id));
  choisies.forEach((e) => ajouter(v, e.poids, 1));

  // Récit libre : les émotions déduites pèsent moins que celles cochées
  const lu = analyserRecit(etat.recit);
  lu.emotions
    .filter((id) => !etat.emotions.includes(id))
    .forEach((id) => {
      const e = EMOTIONS.find((x) => x.id === id);
      if (e) ajouter(v, e.poids, .55);
    });
  ajouter(v, lu.facettes, .7);

  // Facettes déduites par l'assistant (lecture fine du récit) — voir ia.js
  if (etat.facettesIA) ajouter(v, etat.facettesIA, .8);

  // Curseurs
  for (const c of CURSEURS) {
    const val = etat.curseurs[c.id] || 0;
    if (val) ajouter(v, c.effet, val);
  }

  // Contexte
  ajouter(v, SAISONS[etat.saison] || {}, 1);
  ajouter(v, MOMENTS[etat.moment] || {}, 1);

  // Normalisation sur le maximum positif
  const max = Math.max(...Object.values(v).map(Math.abs), .0001);
  for (const f of Object.keys(v)) v[f] = v[f] / max;
  return v;
}

/* --- 3. Filtres et score ----------------------------------------- */

/* Trois palettes possibles, dans cet ordre :
   1. celle saisie dans l'application et gardée sur l'appareil (definirPalette) ;
   2. celle versée au dépôt (stock.js) ;
   3. la palette de démonstration de donnees.js.                          */
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
  if (ecartees.includes(matiere.id)) return true;   // refusée sur mouillette
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
  // racine quatrième : les matières très spécialisées ne sont pas écrasées
  return produit / Math.pow(Math.max(norme, .01), .35);
}

/* --- 4. Sélection ------------------------------------------------ */

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

    // Les matières aimées à la mouillette entrent d'office
    const prises = candidats.filter((n) => imposees.includes(n.m.id));
    prises.forEach((n) => {
      parFamille[n.m.famille] = (parFamille[n.m.famille] || 0) + 1;
      // une matière retenue à l'essai mérite une vraie place, pas la dose minimale
      n.score = Math.max(n.score, .6);
    });

    for (const n of candidats) {
      if (prises.includes(n)) continue;
      if (prises.length >= voulu) break;
      const fam = n.m.famille;
      if ((parFamille[fam] || 0) >= 2) continue;      // pas plus de 2 par famille
      if (n.score <= 0 && prises.length >= 2) continue; // pas de matière contraire
      parFamille[fam] = (parFamille[fam] || 0) + 1;
      prises.push(n);
    }
    // filet de sécurité si les filtres ont tout mangé
    if (!prises.length && candidats.length) prises.push(candidats[0]);

    // Un étage doit pouvoir atteindre sa part : si les matières retenues sont
    // toutes des molécules à doser au dixième, on ajoute un porteur.
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

  // Un liant est indispensable à la tenue et au fondu de la formule
  const aUnLiant = retenues.some((n) => LIANTS.includes(n.m.id));
  if (!aUnLiant) {
    const liant = notes.find((n) => LIANTS.includes(n.m.id));
    if (liant) retenues.push(liant);
  }
  return retenues;
}

/* --- 5. Répartition des pourcentages ----------------------------- */

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

/* Un étage ne peut porter que ce que ses matières autorisent : on ramène
   les parts visées dans les bornes réellement atteignables, et on reverse
   l'écart aux étages qui ont encore du jeu. */
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

/* Remplissage sous contraintes : on vise la part de l'étage sans jamais
   sortir de la fourchette de dosage d'une matière. */
function remplir(groupe, cible) {
  // un score élevé pousse la dose, une matière puissante la retient
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

  // Le concentré ne peut pas dépasser 100 % ; s'il reste de la place (palette
  // trop restreinte par les exclusions), le solde ira au solvant.
  const total = ROLES.flatMap((r) => resultat[r]).reduce((a, l) => a + l.pct, 0);
  if (total > 100.0001) {
    ROLES.forEach((r) => resultat[r].forEach((l) => { l.pct = (l.pct / total) * 100; }));
  }
  return resultat;
}

/* --- 6. Lectures d'ensemble -------------------------------------- */

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

/* --- 7. Mise en mots pour le client ------------------------------ */

const OUVERTURES = {
  agrumes: 'une éclaircie zestée', vert: 'une tige fraîchement coupée',
  aromatique: 'un souffle d\'herbes sèches', aldehyde: 'un scintillement de linge repassé',
  aquatique: 'un air d\'après la pluie', floral_blanc: 'une fleur ouverte en plein soleil',
  floral_poudre: 'un voile de poudre ancienne', rose: 'un pétale encore froid',
  fruite: 'une chair de fruit mûr', the: 'une feuille de thé infusée',
  epice_frais: 'une épice claire et piquante', epice_chaud: 'une épice sombre et sucrée',
  miel: 'un miel tiède', gourmand: 'une douceur de cuisine',
  vanille: 'une vanille profonde', bois_sec: 'un bois taillé net',
  bois_cremeux: 'un bois de lait', resine: 'une fumée d\'église',
  ambre: 'une chaleur de peau au soleil', mousse_terre: 'une terre humide',
  cuir: 'un cuir patiné', fume: 'une braise qui s\'éteint',
  animal: 'quelque chose de très proche du corps', musc: 'une peau propre'
};

/* Facette dominante d'un étage, en évitant de répéter celles déjà employées. */
function facetteDominante(lignes, dejaVues) {
  const v = {};
  lignes.forEach((l) => ajouter(v, l.matiere.facettes, l.pct));
  const classees = Object.entries(v).sort((a, b) => b[1] - a[1]);
  const neuve = classees.find(([f]) => !dejaVues.has(f));
  return (neuve || classees[0] || [null])[0];
}

function noteIntention(etat, profil, pyramide) {
  const emos = EMOTIONS.filter((e) => etat.emotions.includes(e.id));
  const deduites = analyserRecit(etat.recit).emotions
    .filter((id) => !etat.emotions.includes(id))
    .map((id) => EMOTIONS.find((e) => e.id === id))
    .filter(Boolean);
  const toutes = [...emos, ...deduites];

  const debut = toutes.length
    ? `Ce parfum part de ${toutes.slice(0, 3).map((e) => e.nom.toLowerCase()).join(', ')}.`
    : 'Ce parfum part d\'un territoire encore ouvert.';

  // une image par étage, tirée de ce qui domine réellement cet étage
  const vues = new Set();
  const image = (role) => {
    const f = facetteDominante(pyramide[role], vues);
    if (f) vues.add(f);
    return f ? (OUVERTURES[f] || FACETTES[f].toLowerCase()) : null;
  };
  const [it, ic, ifd] = ['tete', 'coeur', 'fond'].map(image);
  const elision = (s) => (/^[aeiouyàâéèêîôùû]/i.test(s) ? `d'${s}` : `de ${s}`);
  const milieu = it || ic || ifd
    ? ` Il s'ouvre sur ${it || ic}, s'installe autour ${elision(ic || it)}` +
      (ifd ? `, et laisse derrière lui ${ifd}.` : '.')
    : '';

  const tete = pyramide.tete[0], fond = pyramide.fond[0];
  const fin = tete && fond
    ? ` La première impression appartient à ${tete.matiere.nom.toLowerCase()} ; ce qui reste sur la peau, à ${fond.matiere.nom.toLowerCase()}.`
    : '';

  return debut + milieu + fin;
}

/* --- 8. Composition complète ------------------------------------- */

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
