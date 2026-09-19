/* Vérifie la palette versée au dépôt (stock.js), avec exactement les mêmes
   règles que l'éditeur de l'application : palette-outils.js est le seul
   endroit où elles sont écrites.

   Usage : node outils/verifier-stock.mjs        (depuis parfum/) */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.join(ici, '..');
const lire = (f) => fs.readFileSync(path.join(racine, f), 'utf8');

const { STOCK_MAISON, FACETTES, composer, definirPalette, verifierPalette, essayerPalette } =
  new Function(
    lire('donnees.js') + '\n' + lire('stock.js') + '\n' + lire('moteur.js') + '\n' +
    lire('palette-outils.js') +
    '\nreturn { STOCK_MAISON, FACETTES, composer, definirPalette, verifierPalette, essayerPalette };'
  )();

if (!STOCK_MAISON.length) {
  console.log('stock.js est vide : l\'application utilise la palette de démonstration,');
  console.log('ou celle que le parfumeur a saisie dans la page « Ma palette ».');
  process.exit(0);
}

definirPalette(STOCK_MAISON);

const { erreurs, avertissements, stats } = verifierPalette(STOCK_MAISON, FACETTES);

console.log(`Palette du dépôt : ${STOCK_MAISON.length} matières, ${stats.familles} familles.`);
['tete', 'coeur', 'fond'].forEach((r) => {
  const s = stats.roles[r];
  const nom = { tete: 'tête', coeur: 'cœur', fond: 'fond' }[r];
  console.log(`  ${nom} : ${s.nombre} matières, plafond ${s.plafond.toFixed(1)} %, ${s.porteurs} porteuse(s)`);
});

if (!erreurs.length) {
  console.log('\nEssais à blanc :');
  essayerPalette(composer).forEach((e) => {
    if (e.echec) { erreurs.push({ matiere: e.nom, texte: `le moteur a échoué (${e.echec})` }); return; }
    if (!e.totalJuste) erreurs.push({ matiere: e.nom, texte: 'le concentré ne totalise pas 100 %' });
    e.horsBornes.forEach((l) => erreurs.push({
      matiere: e.nom, texte: `${l.matiere.nom} dosée à ${l.pct.toFixed(1)} %, hors de sa fourchette` }));
    if (e.vides.length) avertissements.push({ matiere: e.nom, texte: `étage vide (${e.vides.join(', ')})` });
    console.log(`  « ${e.nom} » → ${e.matieres} matières` +
      (e.solvant > .5 ? `, ${e.solvant.toFixed(0)} % de solvant` : ''));
  });
}

if (avertissements.length) {
  console.log('\nÀ regarder :');
  avertissements.forEach((a) => console.log(`  · ${a.matiere} — ${a.texte}`));
}
if (erreurs.length) {
  console.error('\nÀ corriger :');
  erreurs.forEach((e) => console.error(`  ✕ ${e.matiere} — ${e.texte}`));
  process.exit(1);
}
console.log('\nLa palette est utilisable' + (avertissements.length ? ', sous réserve de ce qui précède.' : '.'));
