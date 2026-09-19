/* Règles communes à l'éditeur de palette (navigateur) et aux outils en ligne
   de commande : rapprochement des noms, vérification, essais à blanc.
   Écrit sans import ni export pour être chargé des deux côtés. */

const NORMALISER = (s) => (s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/\([^)]*\)/g, ' ')            // « (absolue) », « (cœur) »
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const IDENTIFIANT = (nom) => NORMALISER(nom).replace(/\s+/g, '_').slice(0, 40) || 'matiere';

/* Retrouve dans une palette de référence la matière que désigne un nom libre.
   « Bergamote FCF » → la bergamote décrite dans donnees.js. */
function rapprocherMatiere(nom, reference) {
  const n = NORMALISER(nom);
  if (!n) return null;
  // « Framboise (frambinone) » doit se retrouver aussi bien sous « framboise »
  // que sous « frambinone » : la parenthèse porte souvent le nom d'atelier.
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

/* Les étiquettes d'atelier portent la dilution de travail : « Ionone alpha 10% ».
   On la sépare du nom pour la garder comme information à part entière. */
function extraireDilution(nom) {
  const m = String(nom || '').match(/[\s(]*(\d{1,3}(?:[.,]\d+)?)\s*%\s*\)?\s*$/);
  if (!m) return { nom: String(nom || '').trim(), dilution: null };
  const valeur = Number(m[1].replace(',', '.'));
  if (!(valeur > 0 && valeur <= 100)) return { nom: String(nom).trim(), dilution: null };
  return { nom: String(nom).slice(0, m.index).trim(), dilution: valeur };
}

/* Ébauche pour une matière que la référence ne connaît pas. */
function ebaucheMatiere(nom) {
  return {
    id: IDENTIFIANT(nom),
    nom,
    famille: 'À CLASSER',
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
const NOM_ROLE = { tete: 'tête', coeur: 'cœur', fond: 'fond' };

/* --- Vérification ---------------------------------------------------- */
/* Retourne { erreurs, avertissements, stats }. Une erreur empêche la matière
   d'être utilisable ; un avertissement mérite seulement un coup d'œil. */

function verifierPalette(liste, facettesConnues) {
  const erreurs = [];
  const avertissements = [];
  const vus = new Set();

  liste.forEach((m, i) => {
    const ou = m.nom || m.id || `matière n° ${i + 1}`;
    const err = (t) => erreurs.push({ id: m.id, matiere: ou, texte: t });
    const avert = (t) => avertissements.push({ id: m.id, matiere: ou, texte: t });

    if (!m.nom) err('nom manquant');
    if (!m.id || !/^[a-z0-9_]+$/.test(m.id)) err('identifiant manquant ou non conforme');
    else if (vus.has(m.id)) err(`identifiant en double : ${m.id}`);
    vus.add(m.id);

    if (!m.famille) err('famille manquante');
    else if (m.famille === 'À CLASSER') avert('famille encore à classer');

    if (!ROLES_VALIDES.includes(m.role)) err(`rôle « ${m.role} » inconnu`);
    if (!['naturelle', 'synthese'].includes(m.nature)) err(`nature « ${m.nature} » inconnue`);
    if (!(Number.isFinite(m.force) && m.force >= 1 && m.force <= 5)) err('force hors de 1 à 5');

    if (!Array.isArray(m.dose) || m.dose.length !== 2) err('fourchette de dosage absente');
    else {
      const [a, b] = m.dose;
      if (!Number.isFinite(a) || !Number.isFinite(b)) err('dosage non numérique');
      else if (a < 0 || b <= 0) err('dosage nul ou négatif');
      else if (a > b) err(`dosage inversé : de ${a} à ${b} %`);
      else if (b > 40) avert(`dose maximale de ${b} % — inhabituel, à vérifier`);
    }

    const facettes = Object.entries(m.facettes || {});
    if (!facettes.length) err('aucune facette : le moteur ne pourra jamais la choisir');
    facettes.forEach(([f, p]) => {
      if (!facettesConnues[f]) err(`facette inconnue « ${f} »`);
      else if (!(Number.isFinite(p) && p > 0 && p <= 1)) err(`poids de « ${f} » hors de 0 à 1`);
    });

    if (m.dilution != null && !(Number.isFinite(m.dilution) && m.dilution > 0 && m.dilution <= 100)) {
      err('dilution hors de 0 à 100 % (laisser vide si la matière est pure)');
    }
    if (!m.note) avert('pas de caractère — la fiche affichera une case vide');
  });

  /* La palette peut-elle porter une formule ? */
  const stats = { roles: {}, plafond: 0, familles: 0 };
  ROLES_VALIDES.forEach((r) => {
    const groupe = liste.filter((m) => m.role === r);
    const plafond = groupe.reduce((a, m) => a + (Array.isArray(m.dose) ? m.dose[1] : 0), 0);
    const porteurs = groupe.filter((m) => Array.isArray(m.dose) && m.dose[1] >= 4).length;
    stats.roles[r] = { nombre: groupe.length, plafond, porteurs };
    stats.plafond += plafond;

    if (!liste.length) return;
    if (!groupe.length) {
      erreurs.push({ matiere: NOM_ROLE[r], texte: `aucune matière de ${NOM_ROLE[r]} : pas de pyramide possible` });
    } else if (!porteurs) {
      avertissements.push({ matiere: NOM_ROLE[r],
        texte: `aucune matière dosable au-dessus de 4 % : cet étage restera famélique` });
    }
  });

  stats.familles = new Set(liste.map((m) => m.famille)).size;
  if (liste.length && stats.plafond < 100) {
    avertissements.push({ matiere: 'palette',
      texte: `elle plafonne à ${stats.plafond.toFixed(0)} % : toute formule sera complétée au solvant` });
  }
  if (liste.length && stats.familles < 4) {
    avertissements.push({ matiere: 'palette',
      texte: 'moins de quatre familles : les compositions se ressembleront toutes' });
  }

  return { erreurs, avertissements, stats };
}

/* --- Essais à blanc --------------------------------------------------- */
/* Six demandes très différentes soumises au moteur : c'est la seule preuve
   qu'une palette sait réellement composer. */

const ESSAIS_TYPES = [
  ['clair et frais', { emotions: ['joie', 'liberte'], saison: 'ete',
    curseurs: { lumiere: .8, temperature: -.7 } }],
  ['sombre et chaud', { emotions: ['mystere', 'desir'], moment: 'soir',
    curseurs: { lumiere: -.8, temperature: .7, presence: .6 } }],
  ['tendre et poudré', { emotions: ['tendresse', 'nostalgie'], curseurs: { texture: .8 } }],
  ['sans animal ni sucre', { emotions: ['force'], exclusions: ['animal', 'gourmand'] }],
  ['tout naturel', { emotions: ['serenite'], exclusions: ['synthese'] }],
  ['une seule émotion', { emotions: ['purete'] }]
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
