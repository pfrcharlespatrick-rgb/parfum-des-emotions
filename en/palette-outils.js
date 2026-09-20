/* Rules shared by the palette editor (browser) and the command-line tools:
   name matching, verification, dry runs. Written without import or export so
   it can be loaded on both sides. English edition. */

const NORMALISER = (s) => (s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/\([^)]*\)/g, ' ')            // "(absolute)", "(heart fraction)"
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const IDENTIFIANT = (nom) => NORMALISER(nom).replace(/\s+/g, '_').slice(0, 40) || 'matiere';

/* Finds, in a reference palette, the material a free-form name designates.
   "Bergamot FCF" → the bergamot described in donnees.js. */
function rapprocherMatiere(nom, reference) {
  const n = NORMALISER(nom);
  if (!n) return null;
  // "Raspberry (frambinone)" must be found under "raspberry" as well as under
  // "frambinone": the parenthesis often carries the workshop name.
  const entreParentheses = (s) => [...String(s || '').matchAll(/\(([^)]*)\)/g)]
    .map((x) => NORMALISER(x[1])).filter(Boolean);
  const cles = reference.map((m) => ({
    m, k: [NORMALISER(m.nom), m.id, NORMALISER(m.latin), ...entreParentheses(m.nom)]
  }));

  const exact = cles.find((c) => c.k.includes(n));
  if (exact) return exact.m;

  const debut = cles.find((c) => c.k.some((k) => k && (k.startsWith(n) || n.startsWith(k))));
  if (debut) return debut.m;

  const dedans = cles.find((c) => c.k.some((k) => k && k.length > 3 && n.includes(k)));
  return dedans ? dedans.m : null;
}

/* Workshop labels carry the working dilution: "Alpha-ionone 10%".
   We separate it from the name to keep it as information in its own right. */
function extraireDilution(nom) {
  const m = String(nom || '').match(/[\s(]*(\d{1,3}(?:[.,]\d+)?)\s*%\s*\)?\s*$/);
  if (!m) return { nom: String(nom || '').trim(), dilution: null };
  const valeur = Number(m[1].replace(',', '.'));
  if (!(valeur > 0 && valeur <= 100)) return { nom: String(nom).trim(), dilution: null };
  return { nom: String(nom).slice(0, m.index).trim(), dilution: valeur };
}

/* Family given to a material the reference does not know, in either edition. */
const FAMILLES_A_CLASSER = ['UNCLASSIFIED', 'À CLASSER'];

/* Draft for a material the reference does not know. */
function ebaucheMatiere(nom) {
  return {
    id: IDENTIFIANT(nom),
    nom,
    famille: 'UNCLASSIFIED',
    role: 'coeur',
    nature: /synth|molecul|accord|iso |ambrox|hedion|calone|galaxolide/i.test(nom)
      ? 'synthese' : 'naturelle',
    facettes: {},
    force: 3,
    dose: [0.5, 5],
    note: ''
  };
}

const ROLES_VALIDES = ['tete', 'coeur', 'fond'];
const NOM_ROLE = { tete: 'top', coeur: 'heart', fond: 'base' };

/* --- Verification ---------------------------------------------------- */
/* Returns { erreurs, avertissements, stats }. An error prevents the material
   from being usable; a warning only deserves a glance. */

function verifierPalette(liste, facettesConnues) {
  const erreurs = [];
  const avertissements = [];
  const vus = new Set();

  liste.forEach((m, i) => {
    const ou = m.nom || m.id || `material no. ${i + 1}`;
    const err = (t) => erreurs.push({ id: m.id, matiere: ou, texte: t });
    const avert = (t) => avertissements.push({ id: m.id, matiere: ou, texte: t });

    if (!m.nom) err('name missing');
    if (!m.id || !/^[a-z0-9_]+$/.test(m.id)) err('identifier missing or invalid');
    else if (vus.has(m.id)) err(`duplicate identifier: ${m.id}`);
    vus.add(m.id);

    if (!m.famille) err('family missing');
    else if (FAMILLES_A_CLASSER.includes(m.famille)) avert('family still to be classified');

    if (!ROLES_VALIDES.includes(m.role)) err(`unknown role “${m.role}”`);
    if (!['naturelle', 'synthese'].includes(m.nature)) err(`unknown nature “${m.nature}”`);
    if (!(Number.isFinite(m.force) && m.force >= 1 && m.force <= 5)) err('strength outside 1 to 5');

    if (!Array.isArray(m.dose) || m.dose.length !== 2) err('dosage range missing');
    else {
      const [a, b] = m.dose;
      if (!Number.isFinite(a) || !Number.isFinite(b)) err('non-numeric dosage');
      else if (a < 0 || b <= 0) err('zero or negative dosage');
      else if (a > b) err(`inverted dosage: from ${a} to ${b}%`);
      else if (b > 40) avert(`maximum dose of ${b}% — unusual, worth checking`);
    }

    const facettes = Object.entries(m.facettes || {});
    if (!facettes.length) err('no facets: the engine will never be able to pick it');
    facettes.forEach(([f, p]) => {
      if (!facettesConnues[f]) err(`unknown facet “${f}”`);
      else if (!(Number.isFinite(p) && p > 0 && p <= 1)) err(`weight of “${f}” outside 0 to 1`);
    });

    if (m.dilution != null && !(Number.isFinite(m.dilution) && m.dilution > 0 && m.dilution <= 100)) {
      err('dilution outside 0 to 100% (leave empty if the material is pure)');
    }
    if (!m.note) avert('no character line — the sheet will show an empty cell');
  });

  /* Can the palette carry a formula? */
  const stats = { roles: {}, plafond: 0, familles: 0 };
  ROLES_VALIDES.forEach((r) => {
    const groupe = liste.filter((m) => m.role === r);
    const plafond = groupe.reduce((a, m) => a + (Array.isArray(m.dose) ? m.dose[1] : 0), 0);
    const porteurs = groupe.filter((m) => Array.isArray(m.dose) && m.dose[1] >= 4).length;
    stats.roles[r] = { nombre: groupe.length, plafond, porteurs };
    stats.plafond += plafond;

    if (!liste.length) return;
    if (!groupe.length) {
      erreurs.push({ matiere: NOM_ROLE[r], texte: `no ${NOM_ROLE[r]} material: no pyramid possible` });
    } else if (!porteurs) {
      avertissements.push({ matiere: NOM_ROLE[r],
        texte: `no material dosable above 4%: this tier will stay starved` });
    }
  });

  stats.familles = new Set(liste.map((m) => m.famille)).size;
  if (liste.length && stats.plafond < 100) {
    avertissements.push({ matiere: 'palette',
      texte: `it tops out at ${stats.plafond.toFixed(0)}%: every formula will be topped up with solvent` });
  }
  if (liste.length && stats.familles < 4) {
    avertissements.push({ matiere: 'palette',
      texte: 'fewer than four families: all compositions will look alike' });
  }

  return { erreurs, avertissements, stats };
}

/* --- Dry runs --------------------------------------------------------- */
/* Six very different requests submitted to the engine: the only proof that
   a palette can really compose. */

const ESSAIS_TYPES = [
  ['bright and fresh', { emotions: ['joie', 'liberte'], saison: 'ete',
    curseurs: { lumiere: .8, temperature: -.7 } }],
  ['dark and warm', { emotions: ['mystere', 'desir'], moment: 'soir',
    curseurs: { lumiere: -.8, temperature: .7, presence: .6 } }],
  ['tender and powdery', { emotions: ['tendresse', 'nostalgie'], curseurs: { texture: .8 } }],
  ['no animalic, no sugar', { emotions: ['force'], exclusions: ['animal', 'gourmand'] }],
  ['all natural', { emotions: ['serenite'], exclusions: ['synthese'] }],
  ['a single emotion', { emotions: ['purete'] }]
];

function essayerPalette(composerFn) {
  const base = {
    recit: '', emotions: [],
    curseurs: { lumiere: 0, temperature: 0, presence: 0, caractere: 0, texture: 0 },
    saison: 'toutes', moment: 'indifferent', exclusions: [], concentration: 'edp',
    facettesIA: null, imposees: [], ecartees: []
  };

  return ESSAIS_TYPES.map(([nom, modif]) => {
    const etat = { ...base, ...modif, curseurs: { ...base.curseurs, ...(modif.curseurs || {}) } };
    try {
      const c = composerFn(etat);
      const lignes = ROLES_VALIDES.flatMap((r) => c.pyramide[r]);
      const total = lignes.reduce((a, l) => a + l.pct, 0);
      const horsBornes = lignes.filter((l) =>
        l.pct > l.matiere.dose[1] + .05 || l.pct < l.matiere.dose[0] - .05);
      const vides = ROLES_VALIDES.filter((r) => !c.pyramide[r].length).map((r) => NOM_ROLE[r]);
      return {
        nom, matieres: lignes.length, solvant: c.diluant, vides, horsBornes,
        totalJuste: Math.abs(total + c.diluant - 100) < .05,
        echec: null
      };
    } catch (e) {
      return { nom, echec: e.message, matieres: 0, solvant: 0, vides: [], horsBornes: [], totalJuste: false };
    }
  });
}
