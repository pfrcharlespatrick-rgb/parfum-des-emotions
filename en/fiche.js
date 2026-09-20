/* Rendering and export of the composition sheet — shared by the public page
   (index.html) and the salon view (salon.html), so that the deliverable is
   identical on both sides. English edition. */

const nb = (x, d = 1) => x.toFixed(d);

/* Internal values are shared with the French edition; only the display changes. */
const NATURES = { naturelle: 'natural', synthese: 'synthetic' };
const nomNature = (n) => NATURES[n] || n;

/* Shares and masses are those of the PURE MATERIAL.
   Since the perfumer weighs from dilutions, we also give the mass to take
   from the bottle: pure mass ÷ (dilution / 100). */
const LOT = 10;                                   // grams of concentrate
const massePure = (l) => l.pct / 100 * LOT;
const masseAPeser = (l) => l.matiere.dilution
  ? massePure(l) * 100 / l.matiere.dilution
  : massePure(l);

function ligneMatiere(l, avecChiffres, avecDilution) {
  const m = l.matiere;
  return `
    <tr>
      <td class="nom">${m.nom}<span class="etiquette-nature">${nomNature(m.nature)}</span>${
        m.dilution ? `<span class="etiquette-nature">diluted to ${m.dilution}%</span>` : ''}
        ${m.latin ? `<small>${m.latin}</small>` : ''}</td>
      <td class="note">${m.note}</td>
      ${avecChiffres ? `<td class="chiffre">${nb(l.pct)}%</td>
                        <td class="chiffre">${nb(massePure(l), 3)} g</td>` : ''}
      ${avecChiffres && avecDilution ? `<td class="chiffre">${
        m.dilution ? `${nb(masseAPeser(l), 2)} g` : '<span style="color:var(--encre-doux)">pure</span>'}</td>` : ''}
    </tr>`;
}

function tableEtage(titre, classe, lignes, part, avecChiffres, avecDilution) {
  if (!lignes.length) return '';
  return `
  <div class="etage ${classe}">
    <h3>${titre} <span class="part">${nb(part)}% of the concentrate</span></h3>
    <table class="formule">
      <thead><tr>
        <th>Material</th><th>Character</th>
        ${avecChiffres ? `<th style="text-align:right">Share</th>
                          <th style="text-align:right">Pure, per ${LOT} g</th>` : ''}
        ${avecChiffres && avecDilution ? '<th style="text-align:right">To weigh from the bottle</th>' : ''}
      </tr></thead>
      <tbody>${lignes.map((l) => ligneMatiere(l, avecChiffres, avecDilution)).join('')}</tbody>
    </table>
  </div>`;
}

const lignesDe = (c) => ['tete', 'coeur', 'fond'].flatMap((r) => c.pyramide[r]);
const aDesDilutions = (c) => lignesDe(c).some((l) => l.matiere.dilution);

/* Weighing 8 g of a 10% dilution for 10 g of concentrate is impossible:
   we check that the formula fits in the batch before handing it over. */
function blocPesee(c) {
  if (!aDesDilutions(c)) return '';
  const total = lignesDe(c).reduce((a, l) => a + masseAPeser(l), 0);
  const tient = total <= LOT + .001;
  const lourdes = lignesDe(c)
    .filter((l) => l.matiere.dilution && masseAPeser(l) > LOT / 4)
    .sort((a, b) => masseAPeser(b) - masseAPeser(a));

  return `
    <div class="avertissement" style="margin-bottom:26px">
      <h4>Weighing from your dilutions — ${nb(total, 2)} g for ${LOT} g of concentrate</h4>
      <p style="margin:0 0 8px">The shares and the masses in the “pure” column are those of the
         pure material. The last column is what you actually take from the bottle, dilution
         included.</p>
      ${tient ? `<p style="margin:0">The numbers add up: these amounts fit within
         ${LOT} g, the remainder being topped up with solvent.</p>`
      : `<p style="margin:0 0 8px"><strong>This formula cannot be weighed as it stands:</strong>
         it would take ${nb(total, 2)} g of dilutions for ${LOT} g of concentrate, that is
         ${nb(total / LOT * 100, 0)}% of the batch. Making the batch bigger changes nothing — both
         quantities follow the same scale. What is needed is a more concentrated dilution, or the
         pure material, for these:</p>
         <ul style="margin:0">${lourdes.slice(0, 4).map((l) => `<li><strong>${l.matiere.nom}</strong> —
           ${nb(l.pct)}% of the formula, taken from a ${l.matiere.dilution}% dilution:
           it would need one at ${Math.ceil(l.pct * 2)}% at least.</li>`).join('')}</ul>`}
    </div>`;
}

function barres(items, libelle, valeur, unite = '%') {
  return `<div class="barres">${items.map((i) => `
    <div class="barre">
      <span>${libelle(i)}</span>
      <span class="piste"><span class="remplissage" style="width:${Math.round(valeur(i))}%"></span></span>
      <span class="valeur">${Math.round(valeur(i))}${unite}</span>
    </div>`).join('')}</div>`;
}

/* Share of concentrate in the alcohol, per concentration */
const PART_ALCOOL = { edt: .10, edp: .175, extrait: .25 };

function blocMiseEnAlcool(c) {
  const part = PART_ALCOOL[c.etat.concentration];
  return `
    <div class="avertissement">
      <h4>Dilution in alcohol and points of caution</h4>
      <p style="margin:0 0 8px">For <strong>30 mL</strong> of finished juice as ${c.concentration.nom.toLowerCase()}:
         about <strong>${nb(30 * part, 1)} g</strong> of concentrate in
         <strong>${nb(30 * (1 - part), 1)} mL</strong> of 96° ethanol,
         plus 1 to 3% distilled water if you wish to round it off. Recommended maceration: 3 to 6 weeks,
         kept cool and away from light.</p>
      ${c.alertes.length ? `<ul>${c.alertes.map((a) => `<li><strong>${a.nom}</strong> — ${a.texte}</li>`).join('')}</ul>`
                          : '<p style="margin:0">No material in this selection carries a specific restriction; still check the calculation of declarable allergens.</p>'}
    </div>`;
}

function blocSolvant(c) {
  if (c.diluant <= .5) return '';
  return `
    <div class="avertissement" style="margin-bottom:26px">
      <h4>Adjustment solvent — ${nb(c.diluant)}% of the concentrate</h4>
      <p style="margin:0">The requested exclusions narrow the palette considerably: at their usual
         dosages, the selected materials cannot fill the concentrate. The remainder is topped up
         with DPG (or ethanol), which is common practice. For a denser concentrate, an exclusion
         would have to be lifted, or the house palette widened.</p>
    </div>`;
}

/* --- exports --- */

function texteFiche(c) {
  const bloc = (titre, lignes, part) =>
    `${titre.toUpperCase()} (${nb(part)}%)\n` +
    lignes.map((l) => `  ${l.matiere.nom} — ${nb(l.pct)}% · ${nb(massePure(l), 3)} g pure` +
      (l.matiere.dilution
        ? ` · ${nb(masseAPeser(l), 2)} g to weigh (${l.matiere.dilution}% dilution)` : '')).join('\n');

  return [
    'COMPOSITION SHEET',
    'Emotions: ' + (c.emotionsRetenues.map((e) => e.nom).join(', ') || '—'),
    'Concentration: ' + c.concentration.nom + ' (' + c.concentration.plage + ')',
    '',
    c.intention,
    '',
    bloc('Top notes', c.pyramide.tete, c.equilibre.tete),
    '',
    bloc('Heart notes', c.pyramide.coeur, c.equilibre.coeur),
    '',
    bloc('Base notes', c.pyramide.fond, c.equilibre.fond),
    c.diluant > .5 ? `\nADJUSTMENT SOLVENT (DPG or ethanol) — ${nb(c.diluant)}%` : '',
    '',
    'Dominant families: ' + c.familles.slice(0, 5).map((f) => `${f.nom} ${Math.round(f.pct)}%`).join(', '),
    c.alertes.length ? '\nCaution:\n' + c.alertes.map((a) => `  - ${a.nom}: ${a.texte}`).join('\n') : '',
    '',
    `Masses given for ${LOT} g of concentrate, as pure material.`,
    'Indicative dosages, to be validated by the perfumer (IFRA, allergens, actual balance).'
  ].join('\n');
}

/* The JSON keys are the same as in the French edition, so that an order-tracking
   system reads both without caring which language produced the sheet. */
function donneesFiche(c) {
  return {
    version: 1,
    langue: 'en',
    demande: c.etat,
    emotions: c.emotionsRetenues.map((e) => e.nom),
    intention: c.intention,
    concentration: c.concentration,
    equilibre: c.equilibre,
    formule: ['tete', 'coeur', 'fond'].flatMap((role) =>
      c.pyramide[role].map((l) => ({
        role,
        id: l.matiere.id,
        nom: l.matiere.nom,
        famille: l.matiere.famille,
        nature: l.matiere.nature,
        dilution: l.matiere.dilution ?? null,
        pourcentage: Number(l.pct.toFixed(2)),
        grammes_purs: Number(massePure(l).toFixed(3)),
        grammes_a_peser: Number(masseAPeser(l).toFixed(3))
      }))),
    solvant: Number(c.diluant.toFixed(2)),
    familles: c.familles.map((f) => ({ nom: f.nom, pourcentage: Number(f.pct.toFixed(1)) })),
    vigilance: c.alertes
  };
}

function exporterJson(c, nomFichier = 'composition-sheet.json') {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(donneesFiche(c), null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier;
  a.click();
  URL.revokeObjectURL(url);
}

function copier(texte, bouton) {
  const fini = () => {
    const avant = bouton.textContent;
    bouton.textContent = 'Copied ✓';
    setTimeout(() => { bouton.textContent = avant; }, 1600);
  };
  if (navigator.clipboard) navigator.clipboard.writeText(texte).then(fini, () => {});
  else {
    const z = document.createElement('textarea');
    z.value = texte; document.body.appendChild(z); z.select();
    document.execCommand('copy'); z.remove(); fini();
  }
}

/* --- sharing by link: the state fits in the URL fragment --- */

function encoderEtat(objet) {
  const octets = new TextEncoder().encode(JSON.stringify(objet));
  return btoa(String.fromCharCode(...octets)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decoderEtat(chaine) {
  const b64 = chaine.replace(/-/g, '+').replace(/_/g, '/');
  const brut = atob(b64 + '==='.slice((b64.length + 3) % 4));
  const octets = Uint8Array.from(brut, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(octets));
}
