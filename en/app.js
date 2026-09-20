/* Interface: client form, perfumer's sheet, sharing. English edition. */

const $ = (sel) => document.querySelector(sel);

const ETAT_INITIAL = {
  recit: '',
  emotions: [],
  curseurs: { lumiere: 0, temperature: 0, presence: 0, caractere: 0, texture: 0 },
  saison: 'toutes',
  moment: 'indifferent',
  exclusions: [],
  concentration: 'edp',
  facettesIA: null,   // facets inferred from the story by the assistant, once accepted
  imposees: [],       // materials kept after trial (salon view)
  ecartees: []        // materials rejected after trial (salon view)
};

let etat = structuredClone(ETAT_INITIAL);
let vueParfumeur = true;

/* ------------------------------------------------------------------ */
/* Building the form                                                   */
/* ------------------------------------------------------------------ */

function construireEmotions() {
  $('#emotions').innerHTML = EMOTIONS.map((e) => `
    <button type="button" class="emotion" data-emotion="${e.id}" aria-pressed="false">
      <span class="titre">${e.icone} ${e.nom}</span>
      <span class="phrase">${e.phrase}</span>
    </button>`).join('');

  $('#emotions').addEventListener('click', (ev) => {
    const bouton = ev.target.closest('[data-emotion]');
    if (!bouton) return;
    const id = bouton.dataset.emotion;
    etat.emotions = etat.emotions.includes(id)
      ? etat.emotions.filter((x) => x !== id)
      : [...etat.emotions, id];
    rafraichir();
  });
}

function construireCurseurs() {
  $('#curseurs').innerHTML = CURSEURS.map((c) => `
    <div class="curseur">
      <div class="legende">
        <span data-cote="${c.id}-gauche">${c.gauche}</span>
        <span data-cote="${c.id}-droite">${c.droite}</span>
      </div>
      <input type="range" min="-100" max="100" step="5" value="0"
             data-curseur="${c.id}" aria-label="${c.gauche} to ${c.droite}">
    </div>`).join('');

  $('#curseurs').addEventListener('input', (ev) => {
    const champ = ev.target.closest('[data-curseur]');
    if (!champ) return;
    etat.curseurs[champ.dataset.curseur] = Number(champ.value) / 100;
    rafraichir();
  });
}

function construireExclusions() {
  const zone = $('#exclusions');
  zone.insertAdjacentHTML('beforeend', EXCLUSIONS.map((x) => `
    <label><input type="checkbox" data-exclusion="${x.id}"> ${x.nom}</label>`).join(''));

  zone.addEventListener('change', (ev) => {
    const champ = ev.target.closest('[data-exclusion]');
    if (!champ) return;
    const id = champ.dataset.exclusion;
    etat.exclusions = champ.checked
      ? [...etat.exclusions, id]
      : etat.exclusions.filter((x) => x !== id);
    rafraichir();
  });
}

function brancherChamps() {
  let minuterie;
  $('#recit').addEventListener('input', (ev) => {
    etat.recit = ev.target.value;
    clearTimeout(minuterie);
    minuterie = setTimeout(rafraichir, 280);
  });
  ['saison', 'moment', 'concentration'].forEach((id) => {
    $('#' + id).addEventListener('change', (ev) => { etat[id] = ev.target.value; rafraichir(); });
  });
}

/* ------------------------------------------------------------------ */
/* Reflecting the state in the form                                    */
/* ------------------------------------------------------------------ */

function refleterFormulaire() {
  $('#recit').value = etat.recit;
  document.querySelectorAll('[data-emotion]').forEach((b) => {
    b.setAttribute('aria-pressed', etat.emotions.includes(b.dataset.emotion) ? 'true' : 'false');
  });
  document.querySelectorAll('[data-curseur]').forEach((c) => {
    c.value = (etat.curseurs[c.dataset.curseur] || 0) * 100;
  });
  document.querySelectorAll('[data-exclusion]').forEach((c) => {
    c.checked = etat.exclusions.includes(c.dataset.exclusion);
  });
  ['saison', 'moment', 'concentration'].forEach((id) => { $('#' + id).value = etat[id]; });

  // the side of the slider one leans towards lights up
  CURSEURS.forEach((c) => {
    const v = etat.curseurs[c.id] || 0;
    const g = document.querySelector(`[data-cote="${c.id}-gauche"]`);
    const d = document.querySelector(`[data-cote="${c.id}-droite"]`);
    g.classList.toggle('actif', v < -.15);
    d.classList.toggle('actif', v > .15);
  });
}

function afficherDetections() {
  const lu = analyserRecit(etat.recit);
  const nouvelles = lu.emotions.filter((id) => !etat.emotions.includes(id));
  const facettes = Object.keys(lu.facettes);

  if (!nouvelles.length && !facettes.length) {
    $('#detections').innerHTML = etat.recit.trim()
      ? '<em>No word recognised yet — the emotions chosen below take over.</em>'
      : '';
    return;
  }

  const jetonsEmotions = nouvelles.map((id) => {
    const e = EMOTIONS.find((x) => x.id === id);
    return `<button type="button" class="jeton" data-emotion="${id}">${e.icone} ${e.nom} +</button>`;
  }).join('');
  const jetonsFacettes = facettes
    .map((f) => `<span class="jeton">${FACETTES[f]}</span>`).join('');

  $('#detections').innerHTML =
    `In your text: ${jetonsEmotions}${jetonsFacettes}` +
    (nouvelles.length ? ' <em>— click to confirm an emotion.</em>' : '');

  $('#detections').querySelectorAll('[data-emotion]').forEach((b) => {
    b.addEventListener('click', () => {
      etat.emotions = [...etat.emotions, b.dataset.emotion];
      rafraichir();
    });
  });
}

/* ------------------------------------------------------------------ */
/* Assistant (reading of the story by the Claude API — see ia.js)      */
/* ------------------------------------------------------------------ */

let lectureEnCours = null;

function majEtatIA(texte, classe = '') {
  $('#etat-ia').className = 'etat-ia ' + classe;
  $('#etat-ia').textContent = texte;
}

function brancherAssistant() {
  $('#lire-ia').addEventListener('click', lancerLecture);
  $('#reglages-ia').addEventListener('click', ouvrirReglagesIA);
  refleterDisponibiliteIA();
}

function refleterDisponibiliteIA() {
  const pret = IA.disponible();
  $('#lire-ia').disabled = !pret;
  $('#lire-ia').title = pret ? '' : 'Configure the assistant first.';
  if (!pret) majEtatIA('Assistant not configured — keyword reading remains active.', 'discret');
  else majEtatIA('');
}

async function lancerLecture() {
  const texte = etat.recit.trim();
  if (texte.length < 15) { majEtatIA('Write a few words first.', 'discret'); return; }

  if (lectureEnCours) lectureEnCours.abort();
  lectureEnCours = new AbortController();
  majEtatIA('Reading…', 'discret');
  $('#lire-ia').disabled = true;

  try {
    const lu = await IA.lireRecit(texte, lectureEnCours.signal);
    majEtatIA('');
    afficherProposition(lu);
  } catch (e) {
    if (e.name !== 'AbortError') {
      majEtatIA(`Reading failed: ${e.message} Keywords take over.`, 'alerte');
    }
  } finally {
    lectureEnCours = null;
    $('#lire-ia').disabled = !IA.disponible();
  }
}

function afficherProposition(lu) {
  const emos = lu.emotions.map((id) => EMOTIONS.find((e) => e.id === id)).filter(Boolean);
  const facettes = Object.entries(lu.facettes)
    .sort((a, b) => b[1] - a[1])
    .map(([f]) => FACETTES[f]);
  const curseurs = CURSEURS
    .filter((c) => Math.abs(lu.curseurs[c.id]) > .15)
    .map((c) => `${lu.curseurs[c.id] > 0 ? c.droite : c.gauche}`);

  $('#proposition-ia').innerHTML = `
    <div class="proposition">
      <h4>The assistant has read your story</h4>
      <p class="resume">${lu.resume}</p>
      ${emos.length ? `<p class="detail"><strong>Emotions:</strong> ${emos.map((e) => `${e.icone} ${e.nom}`).join(' · ')}</p>` : ''}
      ${facettes.length ? `<p class="detail"><strong>Materials evoked:</strong> ${facettes.join(' · ')}</p>` : ''}
      ${curseurs.length ? `<p class="detail"><strong>Character:</strong> ${curseurs.join(' · ')}</p>` : ''}
      ${lu.indices.length ? `<p class="detail indices">Based on: ${lu.indices.map((i) => `“${i}”`).join(', ')}</p>` : ''}
      <div class="bandeau-outils" style="margin:14px 0 0">
        <button type="button" class="action pleine" id="accepter-ia">Apply this reading</button>
        <button type="button" class="action" id="refuser-ia">Dismiss</button>
      </div>
    </div>`;

  $('#accepter-ia').addEventListener('click', () => {
    etat.emotions = [...new Set([...etat.emotions, ...lu.emotions])];
    etat.facettesIA = lu.facettes;
    CURSEURS.forEach((c) => {
      if (Math.abs(lu.curseurs[c.id]) > .15) etat.curseurs[c.id] = lu.curseurs[c.id];
    });
    $('#proposition-ia').innerHTML = '';
    majEtatIA('Reading applied — you can still adjust everything.', 'discret');
    rafraichir();
  });
  $('#refuser-ia').addEventListener('click', () => { $('#proposition-ia').innerHTML = ''; });
}

function ouvrirReglagesIA() {
  const c = IA.config;
  $('#proposition-ia').innerHTML = `
    <div class="proposition">
      <h4>Assistant settings</h4>
      <p class="detail">Without the assistant, the story is read by a keyword lexicon: the application
         works, with less nuance.</p>
      <div class="contexte" style="margin-bottom:14px">
        <div>
          <label for="ia-mode">Mode</label>
          <select id="ia-mode">
            <option value="off">None (keywords only)</option>
            <option value="proxy">House service (recommended)</option>
            <option value="direct">Key on this device</option>
          </select>
        </div>
        <div id="ia-champ-proxy">
          <label for="ia-proxy">Service address</label>
          <input id="ia-proxy" type="url" placeholder="https://…/lecture" style="min-width:280px">
        </div>
        <div id="ia-champ-cle">
          <label for="ia-cle">Anthropic API key</label>
          <input id="ia-cle" type="password" placeholder="sk-ant-…" style="min-width:280px">
        </div>
      </div>
      <p class="detail"><strong>Key on this device:</strong> the key is saved in this browser and is
         only ever sent to the Anthropic API. Reserve it for the perfumer's own workstation — never a
         tablet handed to clients, never a shared computer.</p>
      <div class="bandeau-outils" style="margin:14px 0 0">
        <button type="button" class="action pleine" id="ia-enregistrer">Save</button>
        <button type="button" class="action" id="ia-annuler">Close</button>
      </div>
    </div>`;

  $('#ia-mode').value = c.mode;
  $('#ia-proxy').value = c.proxy || '';
  $('#ia-cle').value = c.cle || '';

  const ajusterChamps = () => {
    const m = $('#ia-mode').value;
    $('#ia-champ-proxy').classList.toggle('masque', m !== 'proxy');
    $('#ia-champ-cle').classList.toggle('masque', m !== 'direct');
  };
  ajusterChamps();
  $('#ia-mode').addEventListener('change', ajusterChamps);

  $('#ia-enregistrer').addEventListener('click', () => {
    IA.enregistrer({
      mode: $('#ia-mode').value,
      proxy: $('#ia-proxy').value.trim(),
      cle: $('#ia-cle').value.trim()
    });
    $('#proposition-ia').innerHTML = '';
    refleterDisponibiliteIA();
  });
  $('#ia-annuler').addEventListener('click', () => { $('#proposition-ia').innerHTML = ''; });
}

/* ------------------------------------------------------------------ */
/* Sheet                                                               */
/* ------------------------------------------------------------------ */

function renderFiche(c) {
  const emos = c.emotionsRetenues.map((e) => `${e.icone} ${e.nom}`).join(' · ') || 'to be specified';
  const p = c.pyramide;

  $('#fiche').innerHTML = `
    <h2 class="titre-fiche">Composition sheet</h2>
    <p style="margin:0;color:var(--encre-doux)">${emos}
       — ${c.concentration.nom} (${c.concentration.plage}), estimated longevity ${c.concentration.tenue}.</p>

    <p class="intention">${c.intention}</p>

    <div class="bandeau-outils">
      <button class="action pleine" id="basculer-vue">${vueParfumeur ? 'Client view (no dosages)' : 'Perfumer view (with dosages)'}</button>
      <button class="action" id="imprimer">Print the sheet</button>
      <button class="action" id="copier">Copy the text</button>
      <button class="action" id="json">Export as JSON</button>
      <button class="action" id="lien">Copy the share link</button>
    </div>

    ${tableEtage('Top notes', 'tete', p.tete, c.equilibre.tete, vueParfumeur, aDesDilutions(c))}
    ${tableEtage('Heart notes', 'coeur', p.coeur, c.equilibre.coeur, vueParfumeur, aDesDilutions(c))}
    ${tableEtage('Base notes', 'fond', p.fond, c.equilibre.fond, vueParfumeur, aDesDilutions(c))}

    ${vueParfumeur ? blocPesee(c) + blocSolvant(c) : ''}

    <div class="deux-colonnes">
      <div>
        <h3 style="font-size:15px">Dominant families</h3>
        ${barres(c.familles.slice(0, 7), (f) => f.nom, (f) => f.pct)}
      </div>
      <div>
        <h3 style="font-size:15px">Olfactory profile</h3>
        ${barres(c.profil.slice(0, 7), (f) => f.nom, (f) => f.part * 100)}
      </div>
    </div>

    ${vueParfumeur ? blocMiseEnAlcool(c) : ''}
  `;

  $('#basculer-vue').addEventListener('click', () => { vueParfumeur = !vueParfumeur; rafraichir(); });
  $('#imprimer').addEventListener('click', () => window.print());
  $('#copier').addEventListener('click', (ev) => copier(texteFiche(c), ev.target));
  $('#json').addEventListener('click', () => exporterJson(c));
  $('#lien').addEventListener('click', (ev) => copier(lienPartage(), ev.target));
}

/* ------------------------------------------------------------------ */
/* Exports                                                             */
/* ------------------------------------------------------------------ */

function lienPartage() {
  const url = new URL(location.href);
  url.hash = 'd=' + encoderEtat(etat);
  history.replaceState(null, '', url);
  // the copied link imposes the page's language: the client reopens the sheet in theirs
  const partage = new URL(url);
  if (typeof Langue !== 'undefined') partage.searchParams.set('lang', Langue.courante);
  return partage.toString();
}

/* Before switching language (FR | EN button), the form state is put into the
   address, as for a share link: the reloaded page picks it up again. */
window.avantChangementDeLangue = () => {
  const url = new URL(location.href);
  url.hash = 'd=' + encoderEtat(etat);
  history.replaceState(null, '', url);
};

function lireLien() {
  const h = location.hash.replace(/^#/, '');
  if (!h.startsWith('d=')) return;
  try {
    const lu = decoderEtat(h.slice(2));
    etat = Object.assign(structuredClone(ETAT_INITIAL), lu);
    etat.curseurs = Object.assign({}, ETAT_INITIAL.curseurs, lu.curseurs || {});
  } catch (e) {
    console.warn('Unreadable share link', e);
  }
}

/* ------------------------------------------------------------------ */

function rafraichir() {
  refleterFormulaire();
  afficherDetections();

  const lu = analyserRecit(etat.recit);
  const rienDeChoisi = !etat.emotions.length && !lu.emotions.length
    && !Object.keys(lu.facettes).length
    && !Object.keys(etat.facettesIA || {}).length;

  if (rienDeChoisi) {
    $('#fiche').innerHTML = `<p style="color:var(--encre-doux)">
      <em>Tell us something, or choose at least one emotion: the composition sheet writes
      itself, right here.</em></p>`;
    return;
  }
  renderFiche(composer(etat));
}

construireEmotions();
construireCurseurs();
construireExclusions();
brancherChamps();
brancherAssistant();
lireLien();
rafraichir();
