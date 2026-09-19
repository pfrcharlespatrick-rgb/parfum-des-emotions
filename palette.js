/* Éditeur de la palette de la maison, dans l'application.
   Le parfumeur saisit son stock ici ; tout est gardé sur son appareil et
   remplace aussitôt la palette de démonstration dans les deux autres pages. */

const $ = (sel) => document.querySelector(sel);

const POIDS = [['L', .3, 'léger'], ['N', .6, 'net'], ['F', 1, 'dominant']];
const NOMS_ROLE = { tete: 'Notes de tête', coeur: 'Notes de cœur', fond: 'Notes de fond' };

let liste = PaletteLocale.lire();
let ouverte = null;
let filtre = { texte: '', role: 'tous' };

/* ------------------------------------------------------------------ */
/* Enregistrement                                                      */
/* ------------------------------------------------------------------ */

function enregistrer({ redessiner = true } = {}) {
  const garde = PaletteLocale.ecrire(liste);
  if (!garde) {
    $('#resume-palette').textContent = 'stockage indisponible — la palette ne survivra pas à la fermeture';
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
/* En-tête et bilan                                                    */
/* ------------------------------------------------------------------ */

function rendreEntete() {
  const { origine } = PaletteLocale.etat();
  const libelle = {
    appareil: `${liste.length} matières · enregistrées sur cet appareil`,
    depot: `palette versée au dépôt (${palette().length} matières)`,
    demonstration: `palette de démonstration (${palette().length} matières)`
  }[origine];
  $('#resume-palette').textContent = libelle;

  $('#explication').textContent = liste.length
    ? 'Ces matières remplacent la palette de démonstration : la page client et la séance en salon ne proposeront plus qu\'elles.'
    : 'Tant que cette liste est vide, l\'application compose avec une palette de démonstration — des matières classiques qui ne sont pas forcément les vôtres. Ajoutez votre stock : collez votre liste, ou partez de la démonstration et retirez ce que vous n\'avez pas.';
}

function rendreBilan() {
  if (!liste.length) { $('#bilan').innerHTML = ''; return; }

  const { erreurs, avertissements, stats } = verifierPalette(liste, FACETTES);
  const essais = erreurs.length ? [] : essayerPalette(composer);

  const classe = erreurs.length ? 'mauvais' : avertissements.length ? 'moyen' : 'bon';
  const verdict = erreurs.length
    ? `${erreurs.length} point${erreurs.length > 1 ? 's' : ''} à corriger avant que cette palette soit utilisable.`
    : avertissements.length
      ? 'La palette est utilisable, sous réserve de ce qui précède.'
      : 'La palette est utilisable.';

  const ligneRole = (r) => {
    const s = stats.roles[r];
    return `<span>${NOMS_ROLE[r].replace('Notes de ', '')} : <b>${s.nombre}</b>` +
           ` <small style="color:var(--encre-doux)">(plafond ${s.plafond.toFixed(0)} %, ${s.porteurs} porteuse${s.porteurs > 1 ? 's' : ''})</small></span>`;
  };

  $('#bilan').innerHTML = `
    <div class="bilan ${classe}">
      <h3>État de la palette</h3>
      <div class="compteurs">
        <span>Total : <b>${liste.length}</b> matières</span>
        ${['tete', 'coeur', 'fond'].map(ligneRole).join('')}
        <span>Familles : <b>${stats.familles}</b></span>
      </div>
      ${erreurs.length ? `<ul>${erreurs.map((e) =>
        `<li class="erreur"><strong>${e.matiere}</strong> — ${e.texte}</li>`).join('')}</ul>` : ''}
      ${avertissements.length ? `<ul>${avertissements.map((a) =>
        `<li class="avertissement"><strong>${a.matiere}</strong> — ${a.texte}</li>`).join('')}</ul>` : ''}
      ${essais.length ? `
        <p class="verdict">Essais à blanc — six demandes très différentes soumises au moteur :</p>
        <div class="essais">${essais.map((e) => `
          <div>
            <b>${e.nom}</b>
            <small>${e.echec ? '✕ ' + e.echec
              : `${e.matieres} matières` +
                (e.solvant > .5 ? ` · ${e.solvant.toFixed(0)} % de solvant` : '') +
                (e.vides.length ? ` · étage vide : ${e.vides.join(', ')}` : '') +
                (e.horsBornes.length ? ` · dosage hors bornes` : '')}</small>
          </div>`).join('')}</div>` : ''}
      <p class="verdict">${verdict}</p>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Liste des matières                                                  */
/* ------------------------------------------------------------------ */

function rendreFiltres() {
  const roles = [['tous', 'Toutes'], ['tete', 'Tête'], ['coeur', 'Cœur'], ['fond', 'Fond']];
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
  const dose = Array.isArray(m.dose) ? `${m.dose[0]}–${m.dose[1]} %` : '—';
  const dilution = m.dilution ? ` · dilué à ${m.dilution} %` : '';

  return `
  <div class="matiere ${ouvert ? '' : 'repliee'} ${bloquante ? 'invalide' : ''}" data-id="${m.id}">
    <div class="tete" data-basculer="${m.id}">
      <span class="nom">
        <b>${m.nom || '<em>sans nom</em>'}</b>
        <small>${m.famille || '—'} · ${m.nature === 'synthese' ? 'synthèse' : 'naturelle'}${
          apercuFacettes(m) ? ' · ' + apercuFacettes(m) : ''}</small>
      </span>
      <span class="apercu">${dose}${dilution}</span>
      ${bloquante ? '<span class="signal" title="à corriger">•</span>' : ''}
    </div>

    <div class="detail">
      <div class="champs">
        <div class="champ-large">
          <label>Nom, tel qu'il apparaîtra sur la fiche</label>
          <input data-champ="nom" value="${(m.nom || '').replace(/"/g, '&quot;')}">
        </div>
        <div>
          <label>Nom botanique (facultatif)</label>
          <input data-champ="latin" value="${(m.latin || '').replace(/"/g, '&quot;')}">
        </div>
        <div>
          <label>Famille</label>
          <input data-champ="famille" list="familles-connues" value="${(m.famille || '').replace(/"/g, '&quot;')}">
        </div>
        <div>
          <label>Étage</label>
          <select data-champ="role">
            ${['tete', 'coeur', 'fond'].map((r) =>
              `<option value="${r}" ${m.role === r ? 'selected' : ''}>${NOMS_ROLE[r].replace('Notes de ', '')}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Nature</label>
          <select data-champ="nature">
            <option value="naturelle" ${m.nature === 'naturelle' ? 'selected' : ''}>Naturelle</option>
            <option value="synthese" ${m.nature === 'synthese' ? 'selected' : ''}>Synthèse</option>
          </select>
        </div>
        <div>
          <label>Puissance (1 discrète → 5 redoutable)</label>
          <select data-champ="force">
            ${[1, 2, 3, 4, 5].map((f) => `<option value="${f}" ${m.force === f ? 'selected' : ''}>${f}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Dosage usuel, en % du concentré</label>
          <span class="deux-doses">
            <input data-champ="dose_min" type="number" step="0.01" min="0" value="${m.dose?.[0] ?? ''}">
            <span>à</span>
            <input data-champ="dose_max" type="number" step="0.01" min="0" value="${m.dose?.[1] ?? ''}">
          </span>
        </div>
        <div>
          <label>Dilution de travail, en % (vide = matière pure)</label>
          <input data-champ="dilution" type="number" step="1" min="1" max="100"
                 value="${m.dilution ?? ''}" placeholder="ex. 10">
        </div>
        <div class="champ-large">
          <label>Caractère — la phrase que lira le client</label>
          <textarea data-champ="note">${m.note || ''}</textarea>
        </div>
        <div class="champ-large">
          <label>Restriction à rappeler sur la fiche (facultatif)</label>
          <input data-champ="prudence" value="${(m.prudence || '').replace(/"/g, '&quot;')}">
        </div>
      </div>

      <label style="font-size:13px;color:var(--encre-doux);font-family:system-ui,sans-serif">
        Facettes — ce que sent cette matière, et à quel point</label>
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
          Étiquettes — servent aux exclusions demandées par le client</label>
        <div class="chips" style="margin-top:8px">
          ${['animal', 'gourmand', 'allergene', 'couteux', 'rare'].map((t) =>
            `<button type="button" class="chip" data-tag="${t}"
                     aria-pressed="${(m.tags || []).includes(t)}">${t}</button>`).join('')}
        </div>
      </div>

      ${messages.length ? `<ul class="messages-matiere">${messages.map((x) =>
        `<li class="${x.gravite}">${x.texte}</li>`).join('')}</ul>` : ''}

      <div class="actions-matiere">
        <button type="button" class="tactile discret" data-dupliquer>Dupliquer</button>
        <button type="button" class="tactile discret" data-supprimer>Retirer de ma palette</button>
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
    $('#liste').innerHTML = `<p class="vide">Votre palette est vide.<br>
      Le plus rapide : « Coller ma liste », puis compléter ce que l'application ne connaît pas.</p>`;
    return;
  }
  if (!visibles.length) {
    $('#liste').innerHTML = '<p class="vide">Aucune matière ne correspond à cette recherche.</p>';
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
/* Modifications                                                       */
/* ------------------------------------------------------------------ */

const trouver = (id) => liste.find((m) => m.id === id);

function majChamp(m, champ, valeur) {
  switch (champ) {
    case 'nom': {
      const ancien = m.nom;
      m.nom = valeur;
      // l'identifiant suit le nom tant qu'il n'a pas été personnalisé
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
      copie.nom = m.nom + ' (copie)';
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

  // saisie : on enregistre sans redessiner, pour ne pas perdre le curseur
  zone.addEventListener('input', (ev) => {
    const champ = ev.target.closest('[data-champ]');
    if (!champ) return;
    const m = trouver(ev.target.closest('.matiere').dataset.id);
    if (!m) return;
    majChamp(m, champ.dataset.champ, ev.target.value);
    enregistrer({ redessiner: false });
    rendreEntete();
    // le bilan relance six compositions : on attend la fin de la frappe
    clearTimeout(minuterieBilan);
    minuterieBilan = setTimeout(rendreBilan, 300);
  });

  zone.addEventListener('change', (ev) => {
    if (ev.target.closest('select')) rendre();
  });
}

/* ------------------------------------------------------------------ */
/* Panneaux                                                            */
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
    <h3>Coller ma liste</h3>
    <p style="color:var(--encre-doux)">Une matière par ligne, telles que vous les nommez.
       Celles que l'application connaît arrivent déjà décrites — facettes, dosages, caractère ;
       les autres seront à compléter, et je vous dirai lesquelles.</p>
    <textarea id="liste-collee" placeholder="Bergamote FCF&#10;Rose de mai absolue&#10;Vétiver Haïti&#10;…"></textarea>
    <div class="bandeau-outils" style="margin:14px 0 0">
      <button type="button" class="tactile pleine" id="ajouter-liste">Ajouter à ma palette</button>
      <button type="button" class="tactile" id="fermer-panneau">Annuler</button>
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
      <p><strong>${reprises.length + ebauches.length} matières ajoutées.</strong></p>
      ${reprises.length ? `<p>${reprises.length} déjà décrites : rien à saisir.</p>` : ''}
      ${ebauches.length ? `<p>À compléter — facettes, famille, étage, dosage, caractère :<br>
        ${ebauches.join(', ')}</p>` : ''}
      ${deja.length ? `<p>Déjà dans votre palette, ignorées : ${deja.join(', ')}</p>` : ''}`;
    $('#liste-collee').value = '';
  });
}

/* On part de la palette versée au dépôt si elle existe — c'est celle de la
   maison — et sinon de la démonstration. */
function paletteDeDepart() {
  const duDepot = typeof STOCK_MAISON !== 'undefined' && STOCK_MAISON.length;
  return {
    source: duDepot ? STOCK_MAISON : MATIERES,
    libelle: duDepot ? 'la palette du dépôt' : 'la palette de démonstration'
  };
}

function partirDeLaDemo() {
  const { source, libelle } = paletteDeDepart();
  panneau(`
    <h3>Partir de ${libelle}</h3>
    <p>Ses ${source.length} matières seront copiées dans votre palette. À vous ensuite de retirer
       ce que vous n'avez pas et d'ajuster les dosages aux vôtres — c'est souvent plus rapide que
       de tout saisir.</p>
    ${liste.length ? `<p>Vos ${liste.length} matières actuelles sont conservées ; seules les
       manquantes seront ajoutées.</p>` : ''}
    <div class="bandeau-outils" style="margin:14px 0 0">
      <button type="button" class="tactile pleine" id="confirmer-demo">Copier ces matières</button>
      <button type="button" class="tactile" id="fermer-panneau">Annuler</button>
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

  return '/* Palette de la maison — exportée depuis l\'application.\n' +
         '   Déposer ce fichier dans parfum/stock.js pour qu\'elle serve à tous les appareils. */\n\n' +
         'const STOCK_MAISON = [\n' + l.map(ligne).join(',\n') + '\n];\n';
}

function exporter() {
  panneau(`
    <h3>Sauvegarder / exporter</h3>
    <p style="color:var(--encre-doux)">Votre palette n'existe que dans ce navigateur. Une sauvegarde
       vous protège d'un nettoyage d'historique et permet de la porter sur un autre appareil.</p>
    <div class="bandeau-outils" style="margin:16px 0 0;flex-direction:column;align-items:stretch">
      <button type="button" class="tactile pleine" id="export-json">Sauvegarde (fichier .json)</button>
      <button type="button" class="tactile" id="export-stock">Fichier stock.js pour le dépôt</button>
      <button type="button" class="tactile" id="export-copier">Copier dans le presse-papiers</button>
    </div>
    <p class="rapport">Le fichier <code>stock.js</code>, déposé dans le dépôt du site, rend cette
       palette valable pour tous les appareils sans qu'on ait à la ressaisir.</p>
    <div class="bandeau-outils" style="margin:14px 0 0">
      <button type="button" class="tactile" id="fermer-panneau">Fermer</button>
    </div>`);

  $('#export-json').addEventListener('click', () =>
    telecharger('ma-palette.json', JSON.stringify(liste, null, 2), 'application/json'));
  $('#export-stock').addEventListener('click', () =>
    telecharger('stock.js', versStockJs(liste), 'text/javascript'));
  $('#export-copier').addEventListener('click', (ev) => {
    navigator.clipboard?.writeText(JSON.stringify(liste, null, 2));
    ev.target.textContent = 'Copié ✓';
  });
}

function importer() {
  panneau(`
    <h3>Restaurer une sauvegarde</h3>
    <p style="color:var(--encre-doux)">Collez le contenu d'un fichier <code>.json</code> exporté
       depuis cette page. Votre palette actuelle sera remplacée.</p>
    <textarea id="json-colle" placeholder="[ { &quot;id&quot;: … } ]"></textarea>
    <div class="bandeau-outils" style="margin:14px 0 0">
      <button type="button" class="tactile pleine" id="confirmer-import">Remplacer ma palette</button>
      <button type="button" class="tactile" id="fermer-panneau">Annuler</button>
    </div>
    <div class="rapport" id="rapport-import"></div>`);

  $('#confirmer-import').addEventListener('click', () => {
    let lu;
    try { lu = JSON.parse($('#json-colle').value); }
    catch (e) { $('#rapport-import').innerHTML = '<p style="color:#9a3d2f">Ce texte n\'est pas un JSON valide.</p>'; return; }
    if (!Array.isArray(lu) || !lu.length) {
      $('#rapport-import').innerHTML = '<p style="color:#9a3d2f">Attendu : une liste de matières.</p>';
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
    <h3>Tout effacer</h3>
    <p>Vos ${liste.length} matières seront supprimées de cet appareil, et l'application reviendra à
       la palette de démonstration. Cette action ne peut pas être annulée — pensez à exporter avant.</p>
    <div class="bandeau-outils" style="margin:14px 0 0">
      <button type="button" class="tactile pleine" id="confirmer-vider">Effacer ma palette</button>
      <button type="button" class="tactile" id="fermer-panneau">Annuler</button>
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
  m.id = identifiantLibre('nouvelle_matiere');
  liste.unshift(m);
  ouverte = m.id;
  filtre = { texte: '', role: 'tous' };
  $('#recherche').value = '';
  enregistrer();
  document.querySelector(`[data-id="${m.id}"] [data-champ="nom"]`)?.focus();
});

$('#partir-demo').textContent = 'Partir de ' + paletteDeDepart().libelle;
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
