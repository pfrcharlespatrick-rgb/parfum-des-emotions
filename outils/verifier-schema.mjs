/* Vérifie que le service de lecture (serveur/worker.js) connaît exactement les mêmes
   émotions, facettes et curseurs que le moteur (donnees.js).
   Le schéma est volontairement dupliqué — le navigateur ne doit pas pouvoir imposer
   le sien au service — donc quelque chose doit surveiller la dérive.

   Usage : node outils/verifier-schema.mjs        (depuis parfum/) */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.join(ici, '..');

const donnees = new Function(
  fs.readFileSync(path.join(racine, 'donnees.js'), 'utf8') +
  '\nreturn { EMOTIONS, FACETTES, CURSEURS };'
)();

const worker = fs.readFileSync(path.join(racine, 'serveur', 'worker.js'), 'utf8');

const listeDuWorker = (nom) => {
  const bloc = worker.match(new RegExp(`const ${nom} = \\[([\\s\\S]*?)\\];`));
  if (!bloc) throw new Error(`Liste ${nom} introuvable dans worker.js`);
  return [...bloc[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
};

const comparer = (nom, attendu, obtenu) => {
  const manquants = attendu.filter((x) => !obtenu.includes(x));
  const en_trop = obtenu.filter((x) => !attendu.includes(x));
  if (!manquants.length && !en_trop.length) {
    console.log(`  ${nom} : ${attendu.length} identifiants, synchronisés.`);
    return true;
  }
  console.error(`  ${nom} : DÉSYNCHRONISÉ`);
  if (manquants.length) console.error(`    absents du worker : ${manquants.join(', ')}`);
  if (en_trop.length) console.error(`    inconnus du moteur : ${en_trop.join(', ')}`);
  return false;
};

console.log('Synchronisation moteur ↔ service de lecture :');
const ok = [
  comparer('Émotions', donnees.EMOTIONS.map((e) => e.id), listeDuWorker('EMOTIONS')),
  comparer('Facettes', Object.keys(donnees.FACETTES), listeDuWorker('FACETTES')),
  comparer('Curseurs', donnees.CURSEURS.map((c) => c.id), listeDuWorker('CURSEURS'))
].every(Boolean);

if (!ok) {
  console.error('\nMettre à jour serveur/worker.js pour refléter donnees.js.');
  process.exit(1);
}
console.log('Tout concorde.');
