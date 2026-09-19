/* Interface : formulaire client, fiche parfumeur, partage. */

const $ = (sel) => document.querySelector(sel);

const ETAT_INITIAL = {
  recit: '',
  emotions: [],
  curseurs: { lumiere: 0, temperature: 0, presence: 0, caractere: 0, texture: 0 },
  saison: 'toutes',
  moment: 'indifferent',
  exclusions: [],
  concentration: 'edp',
  facettesIA: null,   // facettes déduites du récit par l'assistant, une fois acceptées
  imposees: [],       // matières retenues à l'essai (vue salon)
  ecartees: []        // matières refusées à l'essai (vue salon)
};

let etat = structuredClone(ETAT_INITIAL);
let vueParfumeur = true;

/* ------------------------------------------------------------------ */
/* Construction du formulaire                                          */
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
             data-curseur="${c.id}" aria-label="${c.gauche} vers ${c.droite}">
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
/* Reflet de l'état dans le formulaire                                 */
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

  // le côté du curseur vers lequel on penche s'allume
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
      ? '<em>Aucun mot reconnu pour l\'instant — les émotions choisies ci-dessous prennent le relais.</em>'
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
    `Dans votre texte : ${jetonsEmotions}${jetonsFacettes}` +
    (nouvelles.length ? ' <em>— cliquez pour confirmer une émotion.</em>' : '');

  $('#detections').querySelectorAll('[data-emotion]').forEach((b) => {
    b.addEventListener('click', () => {
      etat.emotions = [...etat.emotions, b.dataset.emotion];
      rafraichir();
    });
  });
}

/* ------------------------------------------------------------------ */
/* Assistant (lecture du récit par l'API Claude — voir ia.js)          */
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
  $('#lire-ia').title = pret ? '' : 'Configurez d\'abord l\'assistant.';
  if (!pret) majEtatIA('Assistant non configuré — la lecture par mots-clés reste active.', 'discret');
  else majEtatIA('');
}

async function lancerLecture() {
  const texte = etat.recit.trim();
  if (texte.length < 15) { majEtatIA('Écrivez d\'abord quelques mots.', 'discret'); return; }

  if (lectureEnCours) lectureEnCours.abort();
  lectureEnCours = new AbortController();
  majEtatIA('Lecture en cours…', 'discret');
  $('#lire-ia').disabled = true;

  try {
    const lu = await IA.lireRecit(texte, lectureEnCours.signal);
    majEtatIA('');
    afficherProposition(lu);
  } catch (e) {
    if (e.name !== 'AbortError') {
      majEtatIA(`Lecture impossible : ${e.message} Les mots-clés prennent le relais.`, 'alerte');
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
      <h4>L'assistant a lu votre récit</h4>
      <p class="resume">${lu.resume}</p>
      ${emos.length ? `<p class="detail"><strong>Émotions :</strong> ${emos.map((e) => `${e.icone} ${e.nom}`).join(' · ')}</p>` : ''}
      ${facettes.length ? `<p class="detail"><strong>Matières évoquées :</strong> ${facettes.join(' · ')}</p>` : ''}
      ${curseurs.length ? `<p class="detail"><strong>Caractère :</strong> ${curseurs.join(' · ')}</p>` : ''}
      ${lu.indices.length ? `<p class="detail indices">D'après : ${lu.indices.map((i) => `« ${i} »`).join(', ')}</p>` : ''}
      <div class="bandeau-outils" style="margin:14px 0 0">
        <button type="button" class="action pleine" id="accepter-ia">Appliquer cette lecture</button>
        <button type="button" class="action" id="refuser-ia">Ignorer</button>
      </div>
    </div>`;

  $('#accepter-ia').addEventListener('click', () => {
    etat.emotions = [...new Set([...etat.emotions, ...lu.emotions])];
    etat.facettesIA = lu.facettes;
    CURSEURS.forEach((c) => {
      if (Math.abs(lu.curseurs[c.id]) > .15) etat.curseurs[c.id] = lu.curseurs[c.id];
    });
    $('#proposition-ia').innerHTML = '';
    majEtatIA('Lecture appliquée — vous pouvez encore tout ajuster.', 'discret');
    rafraichir();
  });
  $('#refuser-ia').addEventListener('click', () => { $('#proposition-ia').innerHTML = ''; });
}

function ouvrirReglagesIA() {
  const c = IA.config;
  $('#proposition-ia').innerHTML = `
    <div class="proposition">
      <h4>Réglages de l'assistant</h4>
      <p class="detail">Sans assistant, le récit reste lu par un lexique de mots-clés : l'application
         fonctionne, avec moins de nuance.</p>
      <div class="contexte" style="margin-bottom:14px">
        <div>
          <label for="ia-mode">Mode</label>
          <select id="ia-mode">
            <option value="off">Aucun (mots-clés seulement)</option>
            <option value="proxy">Service de la maison (recommandé)</option>
            <option value="direct">Clé sur cet appareil</option>
          </select>
        </div>
        <div id="ia-champ-proxy">
          <label for="ia-proxy">Adresse du service</label>
          <input id="ia-proxy" type="url" placeholder="https://…/lecture" style="min-width:280px">
        </div>
        <div id="ia-champ-cle">
          <label for="ia-cle">Clé d'API Anthropic</label>
          <input id="ia-cle" type="password" placeholder="sk-ant-…" style="min-width:280px">
        </div>
      </div>
      <p class="detail"><strong>Clé sur cet appareil :</strong> la clé est enregistrée dans ce navigateur
         et n'est envoyée qu'à l'API d'Anthropic. À réserver au poste du parfumeur — jamais une tablette
         confiée aux clients, jamais un poste partagé.</p>
      <div class="bandeau-outils" style="margin:14px 0 0">
        <button type="button" class="action pleine" id="ia-enregistrer">Enregistrer</button>
        <button type="button" class="action" id="ia-annuler">Fermer</button>
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
/* Fiche                                                               */
/* ------------------------------------------------------------------ */

function renderFiche(c) {
  const emos = c.emotionsRetenues.map((e) => `${e.icone} ${e.nom}`).join(' · ') || 'à préciser';
  const p = c.pyramide;

  $('#fiche').innerHTML = `
    <h2 class="titre-fiche">Fiche de composition</h2>
    <p style="margin:0;color:var(--encre-doux)">${emos}
       — ${c.concentration.nom} (${c.concentration.plage}), tenue estimée ${c.concentration.tenue}.</p>

    <p class="intention">${c.intention}</p>

    <div class="bandeau-outils">
      <button class="action pleine" id="basculer-vue">${vueParfumeur ? 'Vue client (sans dosages)' : 'Vue parfumeur (avec dosages)'}</button>
      <button class="action" id="imprimer">Imprimer la fiche</button>
      <button class="action" id="copier">Copier le texte</button>
      <button class="action" id="json">Exporter en JSON</button>
      <button class="action" id="lien">Copier le lien de partage</button>
    </div>

    ${tableEtage('Notes de tête', 'tete', p.tete, c.equilibre.tete, vueParfumeur, aDesDilutions(c))}
    ${tableEtage('Notes de cœur', 'coeur', p.coeur, c.equilibre.coeur, vueParfumeur, aDesDilutions(c))}
    ${tableEtage('Notes de fond', 'fond', p.fond, c.equilibre.fond, vueParfumeur, aDesDilutions(c))}

    ${vueParfumeur ? blocPesee(c) + blocSolvant(c) : ''}

    <div class="deux-colonnes">
      <div>
        <h3 style="font-size:15px">Familles dominantes</h3>
        ${barres(c.familles.slice(0, 7), (f) => f.nom, (f) => f.pct)}
      </div>
      <div>
        <h3 style="font-size:15px">Profil olfactif</h3>
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
  return url.toString();
}

function lireLien() {
  const h = location.hash.replace(/^#/, '');
  if (!h.startsWith('d=')) return;
  try {
    const lu = decoderEtat(h.slice(2));
    etat = Object.assign(structuredClone(ETAT_INITIAL), lu);
    etat.curseurs = Object.assign({}, ETAT_INITIAL.curseurs, lu.curseurs || {});
  } catch (e) {
    console.warn('Lien de partage illisible', e);
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
      <em>Racontez quelque chose ou choisissez au moins une émotion : la fiche de composition
      s'écrit toute seule, ici même.</em></p>`;
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
