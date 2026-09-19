/* Rendu et export de la fiche de composition — partagés entre la page publique
   (index.html) et la vue salon (salon.html), pour que le livrable soit identique
   des deux côtés. */

const nb = (x, d = 1) => x.toFixed(d).replace('.', ',');

/* Les parts et les masses sont celles de la MATIÈRE PURE.
   Comme le parfumeur pèse depuis des dilutions, on lui donne aussi la masse
   à prélever au flacon : masse pure ÷ (dilution / 100). */
const LOT = 10;                                   // grammes de concentré
const massePure = (l) => l.pct / 100 * LOT;
const masseAPeser = (l) => l.matiere.dilution
  ? massePure(l) * 100 / l.matiere.dilution
  : massePure(l);

function ligneMatiere(l, avecChiffres, avecDilution) {
  const m = l.matiere;
  return `
    <tr>
      <td class="nom">${m.nom}<span class="etiquette-nature">${m.nature}</span>${
        m.dilution ? `<span class="etiquette-nature">dilué à ${m.dilution} %</span>` : ''}
        ${m.latin ? `<small>${m.latin}</small>` : ''}</td>
      <td class="note">${m.note}</td>
      ${avecChiffres ? `<td class="chiffre">${nb(l.pct)} %</td>
                        <td class="chiffre">${nb(massePure(l), 3)} g</td>` : ''}
      ${avecChiffres && avecDilution ? `<td class="chiffre">${
        m.dilution ? `${nb(masseAPeser(l), 2)} g` : '<span style="color:var(--encre-doux)">pure</span>'}</td>` : ''}
    </tr>`;
}

function tableEtage(titre, classe, lignes, part, avecChiffres, avecDilution) {
  if (!lignes.length) return '';
  return `
  <div class="etage ${classe}">
    <h3>${titre} <span class="part">${nb(part)} % du concentré</span></h3>
    <table class="formule">
      <thead><tr>
        <th>Matière</th><th>Caractère</th>
        ${avecChiffres ? `<th style="text-align:right">Part</th>
                          <th style="text-align:right">Pure, pour ${LOT} g</th>` : ''}
        ${avecChiffres && avecDilution ? '<th style="text-align:right">À peser au flacon</th>' : ''}
      </tr></thead>
      <tbody>${lignes.map((l) => ligneMatiere(l, avecChiffres, avecDilution)).join('')}</tbody>
    </table>
  </div>`;
}

const lignesDe = (c) => ['tete', 'coeur', 'fond'].flatMap((r) => c.pyramide[r]);
const aDesDilutions = (c) => lignesDe(c).some((l) => l.matiere.dilution);

/* Peser 8 g d'une dilution à 10 % pour 10 g de concentré est impossible :
   on vérifie que la formule tient dans le lot avant de la donner. */
function blocPesee(c) {
  if (!aDesDilutions(c)) return '';
  const total = lignesDe(c).reduce((a, l) => a + masseAPeser(l), 0);
  const tient = total <= LOT + .001;
  const lourdes = lignesDe(c)
    .filter((l) => l.matiere.dilution && masseAPeser(l) > LOT / 4)
    .sort((a, b) => masseAPeser(b) - masseAPeser(a));

  return `
    <div class="avertissement" style="margin-bottom:26px">
      <h4>Pesée depuis vos dilutions — ${nb(total, 2)} g pour ${LOT} g de concentré</h4>
      <p style="margin:0 0 8px">Les parts et les masses de la colonne « pure » sont celles de la
         matière pure. La dernière colonne est ce que vous prélevez réellement au flacon, dilution
         comprise.</p>
      ${tient ? `<p style="margin:0">Le compte est bon : ces prélèvements tiennent dans
         ${LOT} g, le solde étant complété au solvant.</p>`
      : `<p style="margin:0 0 8px"><strong>Cette formule ne peut pas être pesée telle quelle :</strong>
         il faudrait ${nb(total, 2)} g de dilutions pour ${LOT} g de concentré, soit
         ${nb(total / LOT * 100, 0)} % du lot. Agrandir le lot n'y change rien — les deux quantités
         suivent la même échelle. Ce qu'il faut, c'est une dilution plus concentrée, ou la matière
         pure, pour celles-ci :</p>
         <ul style="margin:0">${lourdes.slice(0, 4).map((l) => `<li><strong>${l.matiere.nom}</strong> —
           ${nb(l.pct)} % de la formule, prélevés dans une dilution à ${l.matiere.dilution} % :
           il en faudrait une à ${Math.ceil(l.pct * 2)} % au moins.</li>`).join('')}</ul>`}
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

/* Part de concentré dans l'alcool, par concentration */
const PART_ALCOOL = { edt: .10, edp: .175, extrait: .25 };

function blocMiseEnAlcool(c) {
  const part = PART_ALCOOL[c.etat.concentration];
  return `
    <div class="avertissement">
      <h4>Mise en alcool et points de vigilance</h4>
      <p style="margin:0 0 8px">Pour <strong>30 mL</strong> de jus fini en ${c.concentration.nom.toLowerCase()} :
         environ <strong>${nb(30 * part, 1)} g</strong> de concentré dans
         <strong>${nb(30 * (1 - part), 1)} mL</strong> d'éthanol à 96°,
         plus 1 à 3 % d'eau distillée si l'on veut arrondir. Macération conseillée : 3 à 6 semaines
         au frais et à l'abri de la lumière.</p>
      ${c.alertes.length ? `<ul>${c.alertes.map((a) => `<li><strong>${a.nom}</strong> — ${a.texte}</li>`).join('')}</ul>`
                          : '<p style="margin:0">Aucune matière de la sélection ne porte de restriction particulière ; vérifier malgré tout le calcul des allergènes déclarables.</p>'}
    </div>`;
}

function blocSolvant(c) {
  if (c.diluant <= .5) return '';
  return `
    <div class="avertissement" style="margin-bottom:26px">
      <h4>Solvant de mise au point — ${nb(c.diluant)} % du concentré</h4>
      <p style="margin:0">Les exclusions demandées réduisent fortement la palette : les matières
         retenues ne peuvent pas, à leurs dosages usuels, remplir le concentré. Le solde est
         complété au DPG (ou à l'éthanol), ce qui est une pratique courante. Pour un concentré plus
         dense, il faudrait lever une exclusion ou élargir la palette de la maison.</p>
    </div>`;
}

/* --- exports --- */

function texteFiche(c) {
  const bloc = (titre, lignes, part) =>
    `${titre.toUpperCase()} (${nb(part)} %)\n` +
    lignes.map((l) => `  ${l.matiere.nom} — ${nb(l.pct)} % · ${nb(massePure(l), 3)} g pure` +
      (l.matiere.dilution
        ? ` · ${nb(masseAPeser(l), 2)} g à peser (dilution à ${l.matiere.dilution} %)` : '')).join('\n');

  return [
    'FICHE DE COMPOSITION',
    'Émotions : ' + (c.emotionsRetenues.map((e) => e.nom).join(', ') || '—'),
    'Concentration : ' + c.concentration.nom + ' (' + c.concentration.plage + ')',
    '',
    c.intention,
    '',
    bloc('Notes de tête', c.pyramide.tete, c.equilibre.tete),
    '',
    bloc('Notes de cœur', c.pyramide.coeur, c.equilibre.coeur),
    '',
    bloc('Notes de fond', c.pyramide.fond, c.equilibre.fond),
    c.diluant > .5 ? `\nSOLVANT DE MISE AU POINT (DPG ou éthanol) — ${nb(c.diluant)} %` : '',
    '',
    'Familles dominantes : ' + c.familles.slice(0, 5).map((f) => `${f.nom} ${Math.round(f.pct)} %`).join(', '),
    c.alertes.length ? '\nVigilance :\n' + c.alertes.map((a) => `  - ${a.nom} : ${a.texte}`).join('\n') : '',
    '',
    `Masses données pour ${LOT} g de concentré, en matière pure.`,
    'Dosages indicatifs, à valider par le parfumeur (IFRA, allergènes, équilibre réel).'
  ].join('\n');
}

function donneesFiche(c) {
  return {
    version: 1,
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

function exporterJson(c, nomFichier = 'fiche-composition.json') {
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
    bouton.textContent = 'Copié ✓';
    setTimeout(() => { bouton.textContent = avant; }, 1600);
  };
  if (navigator.clipboard) navigator.clipboard.writeText(texte).then(fini, () => {});
  else {
    const z = document.createElement('textarea');
    z.value = texte; document.body.appendChild(z); z.select();
    document.execCommand('copy'); z.remove(); fini();
  }
}

/* --- partage par lien : l'état tient dans le fragment d'URL --- */

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
