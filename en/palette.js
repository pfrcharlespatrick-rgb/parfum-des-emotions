/* Editor of the house palette, inside the application.
   The perfumer enters their stock here; everything is kept on their device and
   immediately replaces the demonstration palette in the two other pages.
   English edition — the palette itself is shared with the French edition. */

const $ = (sel) => document.querySelector(sel);

const POIDS = [['L', .3, 'light'], ['M', .6, 'marked'], ['D', 1, 'dominant']];
const NOMS_ROLE = { tete: 'Top notes', coeur: 'Heart notes', fond: 'Base notes' };
const ROLE_COURT = { tete: 'Top', coeur: 'Heart', fond: 'Base' };
const NOMS_TAG = { animal: 'animal', gourmand: 'gourmand', allergene: 'allergen', couteux: 'costly', rare: 'rare' };

let liste = PaletteLocale.lire();
let ouverte = null;
let filtre = { texte: '', role: 'tous' };

/* ------------------------------------------------------------------ */
/* Saving                                                              */
/* ------------------------------------------------------------------ */

function enregistrer({ redessiner = true } = {}) {
  const garde = PaletteLocale.ecrire(liste);
  if (!garde) {
    $('#resume-palette').textContent = 'storage unavailable — the palette will not survive closing the page';
  }
  if (redessiner) rendre();
}

function identifiantLibre(base, sauf) {
  let id = base || 'matiere';
  let n = 2;
  while (liste.some((m) => m.id === id && m !== sauf)) id = `${base}_${n++}`;
  return id;
}

/* ------------------------------------------------------------------ */
/* Header and status report                                            */
/* ------------------------------------------------------------------ */

function rendreEntete() {
  const { origine } = PaletteLocale.etat();
  const libelle = {
    appareil: `${liste.length} materials · saved on this device`,
    depot: `palette committed to the repository (${palette().length} materials)`,
    demonstration: `demonstration palette (${palette().length} materials)`
  }[origine];
  $('#resume-palette').textContent = libelle;

  $('#explication').textContent = liste.length
    ? 'These materials replace the demonstration palette: the client page and the salon session will offer nothing else.'
    : 'As long as this list is empty, the application composes with a demonstration palette — classic materials that are not necessarily yours. Add your stock: paste your list, or start from the demonstration and remove what you do not have.';
}

function rendreBilan() {
  if (!liste.length) { $('#bilan').innerHTML = ''; return; }

  const { erreurs, avertissements, stats } = verifierPalette(liste, FACETTES);
  const essais = erreurs.length ? [] : essayerPalette(composer);

  const classe = erreurs.length ? 'mauvais' : avertissements.length ? 'moyen' : 'bon';
  const verdict = erreurs.length
    ? `${erreurs.length} point${erreurs.length > 1 ? 's' : ''} to fix before this palette is usable.`
    : avertissements.length
      ? 'The palette is usable, subject to the notes above.'
      : 'The palette is usable.';

  const ligneRole = (r) => {
    const s = stats.roles[r];
    return `<span>${ROLE_COURT[r]}: <b>${s.nombre}</b>` +
           ` <small style="color:var(--encre-doux)">(ceiling ${s.plafond.toFixed(0)}%, ${s.porteurs} carrier${s.porteurs > 1 ? 's' : ''})</small></span>`;
  };

  $('#bilan').innerHTML = `
    <div class="bilan ${classe}">
      <h3>Palette status</h3>
      <div class="compteurs">
        <span>Total: <b>${liste.length}</b> materials</span>
        ${['tete', 'coeur', 'fond'].map(ligneRole).join('')}
        <span>Families: <b>${stats.familles}</b></span>
      </div>
      ${erreurs.length ? `<ul>${erreurs.map((e) =>
        `<li class="erreur"><strong>${e.matiere}</strong> — ${e.texte}</li>`).join('')}</ul>` : ''}
      ${avertissements.length ? `<ul>${avertissements.map((a) =>
        `<li class="avertissement"><strong>${a.matiere}</strong> — ${a.texte}</li>`).join('')}</ul>` : ''}
      ${essais.length ? `
        <p class="verdict">Dry runs — six very different requests submitted to the engine:</p>
        <div class="essais">${essais.map((e) => `
          <div>
            <b>${e.nom}</b>
            <small>${e.echec ? '✕ ' + e.echec
              : `${e.matieres} materials` +
                (e.solvant > .5 ? ` · ${e.solvant.toFixed(0)}% solvent` : '') +
                (e.vides.length ? ` · empty tier: ${e.vides.join(', ')}` : '') +
                (e.horsBornes.length ? ` · dosage out of bounds` : '')}</small>
          </div>`).join('')}</div>` : ''}
      <p class="verdict">${verdict}</p>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* List of materials                                                   */
/* ------------------------------------------------------------------ */

function rendreFiltres() {
  const roles = [['tous', 'All'], ['tete', 'Top'], ['coeur', 'Heart'], ['fond', 'Base']];
  $('#filtre-role').innerHTML = roles.map(([v, t]) =>
    `<button type="button" class="chip" data-role="${v}" aria-pressed="${filtre.role === v}">${t}</button>`).join('');
}

function apercuFacettes(m) {
  return Object.entries(m.facettes || {})
    .sort((a, b) => b[1] - a[1])
    .map(([f]) => FACETTES[f])
    .slice(0, 4).join(' · ');
}

function carteMatiere(m, messages) {
  const bloquante = messages.some((x) => x.gravite === 'erreur');
  const ouvert = ouverte === m.id;
  const dose = Array.isArray(m.dose) ? `${m.dose[0]}–${m.dose[1]}%` : '—';
  const dilution = m.dilution ? ` · diluted to ${m.dilution}%` : '';

  return `
  <div class="matiere ${ouvert ? '' : 'repliee'} ${bloquante ? 'invalide' : ''}" data-id="${m.id}">
    <div class="tete" data-basculer="${m.id}">
      <span class="nom">
        <b>${m.nom || '<em>unnamed</em>'}</b>
        <small>${m.famille || '—'} · ${m.nature === 'synthese' ? 'synthetic' : 'natural'}${
          apercuFacettes(m) ? ' · ' + apercuFacettes(m) : ''}</small>
      </span>
      <span class="apercu">${dose}${dilution}</span>
      ${bloquante ? '<span class="signal" title="to fix">•</span>' : ''}
    </div>

    <div class="detail">
      <div class="champs">
        <div class="champ-large">
          <label>Name, as it will appear on the sheet</label>
          <input data-champ="nom" value="${(m.nom || '').replace(/"/g, '&quot;')}">
        </div>
        <div>
          <label>Botanical name (optional)</label>
          <input data-champ="latin" value="${(m.latin || '').replace(/"/g, '&quot;')}">
        </div>
        <div>
          <label>Family</label>
          <input data-champ="famille" list="familles-connues" value="${(m.famille || '').replace(/"/g, '&quot;')}">
        </div>
        <div>
          <label>Tier</label>
          <select data-champ="role">
            ${['tete', 'coeur', 'fond'].map((r) =>
              `<option value="${r}" ${m.role === r ? 'selected' : ''}>${ROLE_COURT[r]}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Nature</label>
          <select data-champ="nature">
            <option value="naturelle" ${m.nature === 'naturelle' ? 'selected' : ''}>Natural</option>
            <option value="synthese" ${m.nature === 'synthese' ? 'selected' : ''}>Synthetic</option>
          </select>
        </div>
        <div>
          <label>Strength (1 discreet → 5 formidable)</label>
          <select data-champ="force">
            ${[1, 2, 3, 4, 5].map((f) => `<option value="${f}" ${m.force === f ? 'selected' : ''}>${f}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Usual dosage, in % of the concentrate</label>
          <span class="deux-doses">
            <input data-champ="dose_min" type="number" step="0.01" min="0" value="${m.dose?.[0] ?? ''}">
            <span>to</span>
            <input data-champ="dose_max" type="number" step="0.01" min="0" value="${m.dose?.[1] ?? ''}">
          </span>
        </div>
        <div>
          <label>Working dilution, in % (empty = pure material)</label>
          <input data-champ="dilution" type="number" step="1" min="1" max="100"
                 value="${m.dilution ?? ''}" placeholder="e.g. 10">
        </div>
        <div class="champ-large">
          <label>Character — the line the client will read</label>
          <textarea data-champ="note">${m.note || ''}</textarea>
        </div>
        <div class="champ-large">
          <label>Restriction to recall on the sheet (optional)</label>
          <input data-champ="prudence" value="${(m.prudence || '').replace(/"/g, '&quot;')}">
        </div>
      </div>

      <label style="font-size:13px;color:var(--encre-doux);font-family:system-ui,sans-serif">
        Facets — what this material smells of, and how strongly</label>
      <div class="facettes-choix">
        ${Object.entries(FACETTES).map(([f, nom]) => {
          const p = (m.facettes || {})[f];
          return `<span class="facette ${p ? 'active' : ''}" data-facette="${f}">
            <button type="button" data-bascule>${nom}</button>
            <span class="poids">${POIDS.map(([lettre, valeur, titre]) =>
              `<button type="button" data-poids="${valeur}" title="${titre}"
                       aria-pressed="${p === valeur}">${lettre}</button>`).join('')}</span>
          </span>`;
        }).join('')}
      </div>

      <div style="margin-top:16px">
        <label style="font-size:13px;color:var(--encre-doux);font-family:system-ui,sans-serif">
          Tags — used for the exclusions the client asks for</label>
        <div class="chips" style="margin-top:8px">
          ${['animal', 'gourmand', 'allergene', 'couteux', 'rare'].map((t) =>
            `<button type="button" class="chip" data-tag="${t}"
                     aria-pressed="${(m.tags || []).includes(t)}">${NOMS_TAG[t]}</button>`).join('')}
        </div>
      </div>

      ${messages.length ? `<ul class="messages-matiere">${messages.map((x) =>
        `<li class="${x.gravite}">${x.texte}</li>`).join('')}</ul>` : ''}

      <div class="actions-matiere">
        <button type="button" class="tactile discret" data-dupliquer>Duplicate</button>
        <button type="button" class="tactile discret" data-supprimer>Remove from my palette</button>
      </div>
    </div>
  </div>`;
}

function rendreListe() {
  const { erreurs, avertissements } = liste.length
    ? verifierPalette(liste, FACETTES) : { erreurs: [], avertissements: [] };
  const messagesDe = (m) => [
    ...erreurs.filter((e) => e.id === m.id).map((e) => ({ gravite: 'erreur', texte: e.texte })),
    ...avertissements.filter((a) => a.id === m.id).map((a) => ({ gravite: 'avertissement', texte: a.texte }))
  ];

  const t = NORMALISER(filtre.texte);
  const visibles = liste.filter((m) =>
    (filtre.role === 'tous' || m.role === filtre.role) &&
    (!t || NORMALISER(`${m.nom} ${m.latin || ''} ${m.famille}`).includes(t)));

  if (!liste.length) {
    $('#liste').innerHTML = `<p class="vide">Your palette is empty.<br>
      The quickest way: “Paste my list”, then complete what the application does not know.</p>`;
    return;
  }
  if (!visibles.length) {
    $('#liste').innerHTML = '<p class="vide">No material matches this search.</p>';
    return;
  }

  const familles = [...new Set(liste.map((m) => m.famille).filter(Boolean))].sort();

  $('#liste').innerHTML =
    `<datalist id="familles-connues">${familles.map((f) => `<option value="${f}">`).join('')}</datalist>` +
    ['tete', 'coeur', 'fond'].map((r) => {
      const groupe = visibles.filter((m) => m.role === r);
      if (!groupe.length) return '';
      return `<div class="groupe-role"><h3>${NOMS_ROLE[r]} — ${groupe.length}</h3>
        ${groupe.map((m) => carteMatiere(m, messagesDe(m))).join('')}</div>`;
    }).join('');
}

function rendre() {
  rendreEntete();
  rendreBilan();
  rendreFiltres();
  rendreListe();
}

/* ------------------------------------------------------------------ */
/* Changes                                                             */
/* ------------------------------------------------------------------ */

const trouver = (id) => liste.find((m) => m.id === id);

function majChamp(m, champ, valeur) {
  switch (champ) {
    case 'nom': {
      const ancien = m.nom;
      m.nom = valeur;
      // the identifier follows the name as long as it has not been customised
      if (m.id === IDENTIFIANT(ancien) || !m.id) {
        const neuf = identifiantLibre(IDENTIFIANT(valeur), m);
        if (ouverte === m.id) ouverte = neuf;
        m.id = neuf;
      }
      break;
    }
    case 'force': m.force = Number(valeur); break;
    case 'dilution': {
      const v = Number(valeur);
      if (!valeur.trim() || !Number.isFinite(v)) delete m.dilution; else m.dilution = v;
      break;
    }
    case 'dose_min': m.dose = [Number(valeur), m.dose?.[1] ?? 0]; break;
    case 'dose_max': m.dose = [m.dose?.[0] ?? 0, Number(valeur)]; break;
    default: m[champ] = valeur;
  }
}

let minuterieBilan;

function brancherListe() {
  const zone = $('#liste');

  zone.addEventListener('click', (ev) => {
    const carte = ev.target.closest('.matiere');
    if (!carte) return;
    const m = trouver(carte.dataset.id);
    if (!m) return;

    if (ev.target.closest('[data-basculer]')) {
      ouverte = ouverte === m.id ? null : m.id;
      rendreListe();
      return;
    }
    if (ev.target.closest('[data-bascule]')) {
      const f = ev.target.closest('[data-facette]').dataset.facette;
      m.facettes = { ...m.facettes };
      if (m.facettes[f]) delete m.facettes[f]; else m.facettes[f] = .6;
      enregistrer();
      return;
    }
    const poids = ev.target.closest('[data-poids]');
    if (poids) {
      const f = ev.target.closest('[data-facette]').dataset.facette;
      m.facettes = { ...m.facettes, [f]: Number(poids.dataset.poids) };
      enregistrer();
      return;
    }
    const tag = ev.target.closest('[data-tag]');
    if (tag) {
      const t = tag.dataset.tag;
      const actuels = m.tags || [];
      m.tags = actuels.includes(t) ? actuels.filter((x) => x !== t) : [...actuels, t];
      enregistrer();
      return;
    }
    if (ev.target.closest('[data-dupliquer]')) {
      const copie = structuredClone(m);
      copie.nom = m.nom + ' (copy)';
      copie.id = identifiantLibre(IDENTIFIANT(copie.nom));
      liste.splice(liste.indexOf(m) + 1, 0, copie);
      ouverte = copie.id;
      enregistrer();
      return;
    }
    if (ev.target.closest('[data-supprimer]')) {
      liste = liste.filter((x) => x !== m);
      if (ouverte === m.id) ouverte = null;
      enregistrer();
    }
  });

  // typing: save without redrawing, so as not to lose the caret
  zone.addEventListener('input', (ev) => {
    const champ = ev.target.closest('[data-champ]');
    if (!champ) return;
    const m = trouver(ev.target.closest('.matiere').dataset.id);
    if (!m) return;
    majChamp(m, champ.dataset.champ, ev.target.value);
    enregistrer({ redessiner: false });
    rendreEntete();
    // the status report reruns six compositions: wait for the typing to end
    clearTimeout(minuterieBilan);
    minuterieBilan = setTimeout(rendreBilan, 300);
  });

  zone.addEventListener('change', (ev) => {
    if (ev.target.closest('select')) rendre();
  });
}

/* ------------------------------------------------------------------ */
/* Panels                                                              */
/* ------------------------------------------------------------------ */

function panneau(html) {
  $('#panneau').innerHTML = html;
  $('#voile').classList.remove('masque');
  const fermer = $('#fermer-panneau');
  if (fermer) fermer.addEventListener('click', fermerPanneau);
}
function fermerPanneau() { $('#voile').classList.add('masque'); }

function collerListe() {
  panneau(`
    <h3>Paste my list</h3>
    <p style="color:var(--encre-doux)">One material per line, named the way you name them.
       Those the application knows arrive already described — facets, dosages, character;
       the others will need completing, and you will be told which.</p>
    <textarea id="liste-collee" placeholder="Bergamot FCF&#10;Rose de Mai absolute&#10;Haiti vetiver&#10;…"></textarea>
    <div class="bandeau-outils" style="margin:14px 0 0">
      <button type="button" class="tactile pleine" id="ajouter-liste">Add to my palette</button>
      <button type="button" class="tactile" id="fermer-panneau">Cancel</button>
    </div>
    <div class="rapport" id="rapport-liste"></div>`);

  $('#ajouter-liste').addEventListener('click', () => {
    const noms = $('#liste-collee').value.split(/\r?\n/)
      .map((l) => l.replace(/^[-*•\d.\s]+/, '').trim()).filter(Boolean);
    if (!noms.length) return;

    const reprises = [], ebauches = [], deja = [];
    noms.forEach((brut) => {
      const { nom, dilution } = extraireDilution(brut);
      const connue = rapprocherMatiere(nom, MATIERES);
      const matiere = connue ? structuredClone(connue) : ebaucheMatiere(nom);
      matiere.nom = nom;
      if (dilution) matiere.dilution = dilution;
      if (liste.some((m) => m.id === matiere.id)) { deja.push(nom); return; }
      matiere.id = identifiantLibre(matiere.id);
      liste.push(matiere);
      (connue ? reprises : ebauches).push(nom);
    });

    enregistrer();
    $('#rapport-liste').innerHTML = `
      <p><strong>${reprises.length + ebauches.length} materials added.</strong></p>
      ${reprises.length ? `<p>${reprises.length} already described: nothing to enter.</p>` : ''}
      ${ebauches.length ? `<p>To complete — facets, family, tier, dosage, character:<br>
        ${ebauches.join(', ')}</p>` : ''}
      ${deja.length ? `<p>Already in your palette, skipped: ${deja.join(', ')}</p>` : ''}`;
    $('#liste-collee').value = '';
  });
}

/* We start from the palette committed to the repository if there is one — it
   is the house's own — and otherwise from the demonstration. */
function paletteDeDepart() {
  const duDepot = typeof STOCK_MAISON !== 'undefined' && STOCK_MAISON.length;
  return {
    source: duDepot ? STOCK_MAISON : MATIERES,
    libelle: duDepot ? 'the repository palette' : 'the demonstration palette'
  };
}

function partirDeLaDemo() {
  const { source, libelle } = paletteDeDepart();
  panneau(`
    <h3>Start from ${libelle}</h3>
    <p>Its ${source.length} materials will be copied into your palette. It is then up to you to
       remove what you do not have and to adjust the dosages to yours — often faster than
       entering everything.</p>
    ${liste.length ? `<p>Your current ${liste.length} materials are kept; only the missing
       ones will be added.</p>` : ''}
    <div class="bandeau-outils" style="margin:14px 0 0">
      <button type="button" class="tactile pleine" id="confirmer-demo">Copy these materials</button>
      <button type="button" class="tactile" id="fermer-panneau">Cancel</button>
    </div>`);

  $('#confirmer-demo').addEventListener('click', () => {
    source.forEach((m) => {
      if (liste.some((x) => x.id === m.id)) return;
      liste.push(structuredClone(m));
    });
    enregistrer();
    fermerPanneau();
  });
}

function telecharger(nom, contenu, type) {
  const url = URL.createObjectURL(new Blob([contenu], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = nom; a.click();
  URL.revokeObjectURL(url);
}

function versStockJs(l) {
  const g = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const ligne = (m) => '  { ' + [
    `id:${g(m.id)}`, `nom:${g(m.nom)}`,
    m.latin ? `latin:${g(m.latin)}` : null,
    `famille:${g(m.famille)}`, `role:${g(m.role)}`, `nature:${g(m.nature)}`,
    `facettes:{ ${Object.entries(m.facettes).map(([f, p]) => `${f}:${p}`).join(', ')} }`,
    `force:${m.force}`, `dose:[${m.dose[0]},${m.dose[1]}]`,
    m.dilution ? `dilution:${m.dilution}` : null,
    m.tags && m.tags.length ? `tags:[${m.tags.map(g).join(',')}]` : null,
    `note:${g(m.note)}`,
    m.prudence ? `prudence:${g(m.prudence)}` : null
  ].filter(Boolean).join(', ') + ' }';

  return '/* House palette — exported from the application.\n' +
         '   Save this file as stock.js at the root of the repository: it then applies to\n' +
         '   every device, in the French edition as well as the English one. */\n\n' +
         'const STOCK_MAISON = [\n' + l.map(ligne).join(',\n') + '\n];\n';
}

function exporter() {
  panneau(`
    <h3>Save / export</h3>
    <p style="color:var(--encre-doux)">Your palette exists only in this browser. A backup protects
       you from a history clean-up and lets you carry it to another device.</p>
    <div class="bandeau-outils" style="margin:16px 0 0;flex-direction:column;align-items:stretch">
      <button type="button" class="tactile pleine" id="export-json">Backup (.json file)</button>
      <button type="button" class="tactile" id="export-stock">stock.js file for the repository</button>
      <button type="button" class="tactile" id="export-copier">Copy to the clipboard</button>
    </div>
    <p class="rapport">The <code>stock.js</code> file, placed in the site's repository, makes this
       palette apply to every device without having to enter it again.</p>
    <div class="bandeau-outils" style="margin:14px 0 0">
      <button type="button" class="tactile" id="fermer-panneau">Close</button>
    </div>`);

  $('#export-json').addEventListener('click', () =>
    telecharger('my-palette.json', JSON.stringify(liste, null, 2), 'application/json'));
  $('#export-stock').addEventListener('click', () =>
    telecharger('stock.js', versStockJs(liste), 'text/javascript'));
  $('#export-copier').addEventListener('click', (ev) => {
    navigator.clipboard?.writeText(JSON.stringify(liste, null, 2));
    ev.target.textContent = 'Copied ✓';
  });
}

function importer() {
  panneau(`
    <h3>Restore a backup</h3>
    <p style="color:var(--encre-doux)">Paste the contents of a <code>.json</code> file exported
       from this page. Your current palette will be replaced.</p>
    <textarea id="json-colle" placeholder="[ { &quot;id&quot;: … } ]"></textarea>
    <div class="bandeau-outils" style="margin:14px 0 0">
      <button type="button" class="tactile pleine" id="confirmer-import">Replace my palette</button>
      <button type="button" class="tactile" id="fermer-panneau">Cancel</button>
    </div>
    <div class="rapport" id="rapport-import"></div>`);

  $('#confirmer-import').addEventListener('click', () => {
    let lu;
    try { lu = JSON.parse($('#json-colle').value); }
    catch (e) { $('#rapport-import').innerHTML = '<p style="color:#9a3d2f">This text is not valid JSON.</p>'; return; }
    if (!Array.isArray(lu) || !lu.length) {
      $('#rapport-import').innerHTML = '<p style="color:#9a3d2f">Expected: a list of materials.</p>';
      return;
    }
    liste = lu;
    ouverte = null;
    enregistrer();
    fermerPanneau();
  });
}

function vider() {
  panneau(`
    <h3>Erase everything</h3>
    <p>Your ${liste.length} materials will be deleted from this device, and the application will go
       back to the demonstration palette. This cannot be undone — export first.</p>
    <div class="bandeau-outils" style="margin:14px 0 0">
      <button type="button" class="tactile pleine" id="confirmer-vider">Erase my palette</button>
      <button type="button" class="tactile" id="fermer-panneau">Cancel</button>
    </div>`);

  $('#confirmer-vider').addEventListener('click', () => {
    liste = [];
    ouverte = null;
    PaletteLocale.vider();
    fermerPanneau();
    rendre();
  });
}

/* ------------------------------------------------------------------ */

$('#ajouter').addEventListener('click', () => {
  const m = ebaucheMatiere('');
  m.nom = '';
  m.id = identifiantLibre('new_material');
  liste.unshift(m);
  ouverte = m.id;
  filtre = { texte: '', role: 'tous' };
  $('#recherche').value = '';
  enregistrer();
  document.querySelector(`[data-id="${m.id}"] [data-champ="nom"]`)?.focus();
});

$('#partir-demo').textContent = 'Start from ' + paletteDeDepart().libelle;
$('#depuis-liste').addEventListener('click', collerListe);
$('#partir-demo').addEventListener('click', partirDeLaDemo);
$('#exporter').addEventListener('click', exporter);
$('#importer').addEventListener('click', importer);
$('#vider').addEventListener('click', vider);

$('#recherche').addEventListener('input', (ev) => { filtre.texte = ev.target.value; rendreListe(); });
$('#filtre-role').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-role]');
  if (!b) return;
  filtre.role = b.dataset.role;
  rendreFiltres();
  rendreListe();
});
$('#voile').addEventListener('click', (ev) => { if (ev.target.id === 'voile') fermerPanneau(); });

brancherListe();
rendre();
