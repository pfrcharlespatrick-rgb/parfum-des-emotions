/* Construit stock.js à partir de la liste du parfumeur.
 *
 *   node outils/importer-stock.mjs mon-stock.csv > stock.js
 *   node outils/importer-stock.mjs mon-stock.txt > stock.js
 *
 * Accepte :
 *   - une simple liste, une matière par ligne (« Bergamote », « Rose de mai »…) ;
 *   - un CSV ou TSV avec un en-tête. Colonnes reconnues, toutes facultatives
 *     sauf « nom » : nom, latin, famille, role, nature, force, dose_min,
 *     dose_max, facettes, tags, note, prudence.
 *     « facettes » et « tags » se écrivent séparés par des espaces ou des
 *     points-virgules : « agrumes:1 vert:0.3 » et « couteux;allergene ».
 *
 * Ce qui est déjà décrit dans donnees.js est repris tel quel — inutile de
 * ressaisir les facettes de la bergamote. Le reste sort en ébauche, signalée
 * par « À COMPLÉTER », avec un rapport sur la sortie d'erreur.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.join(ici, '..');

const lire = (f) => fs.readFileSync(path.join(racine, f), 'utf8');
const { MATIERES, FACETTES, NORMALISER, IDENTIFIANT, rapprocherMatiere, ebaucheMatiere, extraireDilution } =
  new Function(lire('donnees.js') + '\n' + lire('palette-outils.js') +
    '\nreturn { MATIERES, FACETTES, NORMALISER, IDENTIFIANT, rapprocherMatiere, ebaucheMatiere, extraireDilution };')();

const fichier = process.argv[2];
if (!fichier) {
  console.error('Usage : node outils/importer-stock.mjs <liste.csv|liste.txt> > stock.js');
  process.exit(1);
}

const normaliser = NORMALISER;

/* --- lecture du fichier --------------------------------------------- */

const brut = fs.readFileSync(fichier, 'utf8').replace(/^﻿/, '');
const lignes = brut.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

const separateur = lignes[0].includes('\t') ? '\t' : lignes[0].includes(';') ? ';' : ',';
const colonnesConnues = ['nom', 'latin', 'famille', 'role', 'nature', 'force',
  'dose_min', 'dose_max', 'dilution', 'facettes', 'tags', 'note', 'prudence'];

/* Découpage CSV : le séparateur ne compte pas entre guillemets, et «  "" »
   à l'intérieur d'un champ vaut un guillemet. Sans cela, une note contenant
   une virgule déborderait sur la colonne suivante. */
function decouper(ligne) {
  const cases = [];
  let courant = '', entreGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (entreGuillemets) {
      if (c !== '"') courant += c;
      else if (ligne[i + 1] === '"') { courant += '"'; i++; }
      else entreGuillemets = false;
    } else if (c === '"') entreGuillemets = true;
    else if (c === separateur) { cases.push(courant.trim()); courant = ''; }
    else courant += c;
  }
  cases.push(courant.trim());
  return cases;
}

let entetes = null;
if (lignes[0].includes(separateur)) {
  const premiers = decouper(lignes[0]).map((c) => normaliser(c).replace(/\s+/g, '_'));
  if (premiers.some((c) => colonnesConnues.includes(c))) entetes = premiers;
}

const entrees = (entetes ? lignes.slice(1) : lignes).map((ligne) => {
  if (!entetes) return { nom: ligne.replace(/^[-*•\d.\s]+/, '').trim() };
  const cases = decouper(ligne);
  const o = {};
  entetes.forEach((cle, i) => { if (colonnesConnues.includes(cle) && cases[i]) o[cle] = cases[i]; });
  return o;
}).filter((e) => e.nom);

/* --- construction ---------------------------------------------------- */

const listeDe = (v) => (v || '').split(/[;\s]+/).map((s) => s.trim()).filter(Boolean);

function facettesDe(v) {
  const o = {};
  listeDe(v).forEach((paire) => {
    const [id, poids] = paire.split(':');
    if (FACETTES[id]) o[id] = Math.min(Math.max(Number(poids ?? 1) || 0, 0), 1);
  });
  return o;
}

const repris = [], nouvelles = [], inconnues = [];
const identifiantsPris = new Set();

/* Deux étiquettes peuvent tomber sur la même matière de référence
   (« Nérol » et « Néroli ») : les identifiants doivent rester distincts. */
function identifiantUnique(base) {
  let id = base || 'matiere', n = 2;
  while (identifiantsPris.has(id)) id = `${base}_${n++}`;
  identifiantsPris.add(id);
  return id;
}

const matieres = entrees.map((e) => {
  // « Ionone alpha 10% » : la dilution de travail est sur l'étiquette, pas dans le nom
  const { nom, dilution } = extraireDilution(e.nom);
  const connue = rapprocherMatiere(nom, MATIERES);
  const base = connue ? structuredClone(connue) : ebaucheMatiere(nom);
  base.nom = nom;
  if (dilution) base.dilution = dilution;
  if (connue) repris.push(nom); else nouvelles.push(nom);

  // les colonnes fournies l'emportent toujours sur la description d'origine
  if (e.latin) base.latin = e.latin;
  if (e.famille) base.famille = e.famille;
  if (e.role && ['tete', 'coeur', 'fond'].includes(normaliser(e.role).replace('ê', 'e')))
    base.role = normaliser(e.role);
  if (e.nature) base.nature = normaliser(e.nature).startsWith('synth') ? 'synthese' : 'naturelle';
  if (e.force) base.force = Math.min(Math.max(Math.round(Number(e.force)) || 3, 1), 5);
  if (e.dose_min || e.dose_max) {
    base.dose = [Number(e.dose_min ?? base.dose[0]) || 0, Number(e.dose_max ?? base.dose[1]) || 0];
    if (base.dose[0] > base.dose[1]) base.dose.reverse();
  }
  if (e.facettes) {
    const f = facettesDe(e.facettes);
    if (Object.keys(f).length) base.facettes = f;
    listeDe(e.facettes).forEach((p) => {
      const id = p.split(':')[0];
      if (!FACETTES[id]) inconnues.push(`${e.nom} → ${id}`);
    });
  }
  if (e.dilution) base.dilution = Number(String(e.dilution).replace('%', '').replace(',', '.'));
  if (e.tags) base.tags = listeDe(e.tags);
  if (e.note) base.note = e.note;
  if (e.prudence) base.prudence = e.prudence;

  base.id = identifiantUnique(base.id);
  base.__aCompleter = !connue && (!Object.keys(base.facettes).length || !base.note);
  return base;
});

/* --- écriture -------------------------------------------------------- */

const guillemets = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function ecrire(m) {
  const champs = [
    `id:${guillemets(m.id)}`,
    `nom:${guillemets(m.nom)}`,
    m.latin ? `latin:${guillemets(m.latin)}` : null,
    `famille:${guillemets(m.famille)}`,
    `role:${guillemets(m.role)}`,
    `nature:${guillemets(m.nature)}`,
    `facettes:{ ${Object.entries(m.facettes).map(([f, p]) => `${f}:${p}`).join(', ')} }`,
    `force:${m.force}`,
    `dose:[${m.dose[0]},${m.dose[1]}]`,
    m.dilution ? `dilution:${m.dilution}` : null,
    m.tags && m.tags.length ? `tags:[${m.tags.map(guillemets).join(',')}]` : null,
    `note:${guillemets(m.note)}`,
    m.prudence ? `prudence:${guillemets(m.prudence)}` : null
  ].filter(Boolean);
  return `  ${m.__aCompleter ? '/* À COMPLÉTER */ ' : ''}{ ${champs.join(', ')} }`;
}

const gabarit = fs.readFileSync(path.join(racine, 'stock.js'), 'utf8')
  .split('const STOCK_MAISON = [')[0];

process.stdout.write(gabarit + 'const STOCK_MAISON = [\n' +
  matieres.map(ecrire).join(',\n') + '\n];\n');

/* --- rapport, sur la sortie d'erreur --------------------------------- */

const dire = (...a) => console.error(...a);
const aCompleter = matieres.filter((m) => m.__aCompleter).map((m) => m.nom);
const decrites = nouvelles.filter((n) => !aCompleter.includes(n));

dire(`\n${matieres.length} matières écrites.`);
dire(`  ${repris.length} reprises de la palette de référence (facettes et dosages déjà décrits).`);
if (decrites.length) {
  dire(`  ${decrites.length} nouvelles, décrites par le fichier : ${decrites.join(', ')}`);
}
if (aCompleter.length) {
  dire(`  ${aCompleter.length} en ébauche, à compléter — facettes, famille, rôle, dosage, caractère :`);
  aCompleter.forEach((n) => dire(`      ${n}`));
}
if (inconnues.length) {
  dire(`  facettes inconnues ignorées : ${inconnues.join(', ')}`);
}
dire('\nEnsuite : node outils/verifier-stock.mjs');
