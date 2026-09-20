/* Salon view: the session with the client, on a tablet.
   Same engine and same sheet as the public page; the interface, though, is made
   to be held in the hand during the appointment, with the blotters to smell.
   English edition. */

const $ = (sel) => document.querySelector(sel);

const ETAT_INITIAL = {
  recit: '',
  emotions: [],
  curseurs: { lumiere: 0, temperature: 0, presence: 0, caractere: 0, texture: 0 },
  saison: 'toutes',
  moment: 'indifferent',
  exclusions: [],
  concentration: 'edp',
  facettesIA: null,
  imposees: [],
  ecartees: []
};

const ETAPES = [
  { id: 'recit',    titre: 'Story' },
  { id: 'emotions', titre: 'Emotions' },
  { id: 'reglages', titre: 'Material' },
  { id: 'contexte', titre: 'Use' },
  { id: 'essai',    titre: 'Blotters' },
  { id: 'fiche',    titre: 'Sheet' }
];

/* Same storage key as the French edition: sessions are shared between both. */
const CLE_SEANCES = 'parfum.salon.seances';
const LOCALE = 'en-CA';

let etat = structuredClone(ETAT_INITIAL);
let seance = { id: null, nom: '', date: null };
let etape = 0;
let essai = null;          // composition frozen while the blotters are being tried
let lectureEnCours = null;

/* ------------------------------------------------------------------ */
/* Sessions (local memory of the tablet)                               */
/* ------------------------------------------------------------------ */

function lireSeances() {
  try { return JSON.parse(localStorage.getItem(CLE_SEANCES) || '[]'); }
  catch (e) { return []; }
}

function ecrireSeances(liste) {
  try { localStorage.setItem(CLE_SEANCES, JSON.stringify(liste.slice(0, 60))); }
  catch (e) { /* storage full or private browsing: the session stays in memory */ }
}

const seanceVide = () =>
  !seance.nom.trim() && !etat.recit.trim() && !etat.emotions.length;

function ecrireSeance() {
  if (seanceVide()) return;
  if (!seance.id) seance.id = 's' + new Date().getTime().toString(36);
  seance.date = new Date().toISOString();
  const liste = lireSeances().filter((s) => s.id !== seance.id);
  liste.unshift({ ...seance, etat });
  ecrireSeances(liste);
  afficherHorodatage();
}

let minuterieSauvegarde;
function sauvegarder() {
  clearTimeout(minuterieSauvegarde);
  minuterieSauvegarde = setTimeout(ecrireSeance, 500);
}

/* A tablet gets interrupted at any moment: before changing session, opening
   another one or going to the background, we write without waiting. */
function sauvegarderMaintenant() {
  clearTimeout(minuterieSauvegarde);
  ecrireSeance();
}

function afficherHorodatage() {
  if (!seance.date) { $('#horodatage').textContent = ''; return; }
  const d = new Date(seance.date);
  $('#horodatage').textContent = 'saved at ' +
    d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

function nouvelleSeance() {
  sauvegarderMaintenant();
  etat = structuredClone(ETAT_INITIAL);
  seance = { id: null, nom: '', date: null };
  etape = 0;
  essai = null;
  $('#nom-client').value = '';
  $('#horodatage').textContent = '';
  rendre();
}

function ouvrirSeances() {
  sauvegarderMaintenant();
  const liste = lireSeances();
  panneau(`
    <h3>Saved sessions</h3>
    <p style="color:var(--encre-doux);margin:0">On this tablet only — nothing is sent anywhere.</p>
    ${liste.length ? `<ul class="liste">${liste.map((s) => `
      <li>
        <span><strong>${s.nom || 'Unnamed'}</strong>
          <span class="quand">— ${new Date(s.date).toLocaleString(LOCALE,
            { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></span>
        <span style="display:flex;gap:8px">
          <button type="button" class="tactile discret" data-ouvrir="${s.id}">Resume</button>
          <button type="button" class="tactile discret" data-supprimer="${s.id}">Delete</button>
        </span>
      </li>`).join('')}</ul>`
      : '<p style="margin:18px 0">No sessions yet.</p>'}
    <div class="bandeau-outils" style="margin:6px 0 0">
      <button type="button" class="tactile" id="fermer-panneau">Close</button>
    </div>`);

  $('#panneau').querySelectorAll('[data-ouvrir]').forEach((b) => {
    b.addEventListener('click', () => {
      const s = lireSeances().find((x) => x.id === b.dataset.ouvrir);
      if (!s) return;
      sauvegarderMaintenant();
      etat = Object.assign(structuredClone(ETAT_INITIAL), s.etat);
      etat.curseurs = Object.assign({}, ETAT_INITIAL.curseurs, s.etat.curseurs || {});
      seance = { id: s.id, nom: s.nom, date: s.date };
      etape = 0; essai = null;
      $('#nom-client').value = s.nom || '';
      fermerPanneau();
      afficherHorodatage();
      rendre();
    });
  });
  $('#panneau').querySelectorAll('[data-supprimer]').forEach((b) => {
    b.addEventListener('click', () => {
      ecrireSeances(lireSeances().filter((x) => x.id !== b.dataset.supprimer));
      ouvrirSeances();
    });
  });
}

/* ------------------------------------------------------------------ */
/* Modal panel                                                         */
/* ------------------------------------------------------------------ */

function panneau(html) {
  $('#panneau').innerHTML = html;
  $('#voile').classList.remove('masque');
  const fermer = $('#fermer-panneau');
  if (fermer) fermer.addEventListener('click', fermerPanneau);
}
function fermerPanneau() { $('#voile').classList.add('masque'); }

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

function rendreJalons() {
  $('#jalons').innerHTML = ETAPES.map((e, i) => `
    <button type="button" data-etape="${i}" aria-current="${i === etape}"
            class="${i < etape ? 'fait' : ''}">${i + 1}. ${e.titre}</button>`).join('');
  $('#jalons').querySelectorAll('[data-etape]').forEach((b) => {
    b.addEventListener('click', () => aller(Number(b.dataset.etape)));
  });
}

function aller(i) {
  etape = Math.min(Math.max(i, 0), ETAPES.length - 1);
  if (ETAPES[etape].id === 'essai') essai = composer(etat);
  rendre();
  window.scrollTo({ top: 0 });
}

function rendre() {
  rendreJalons();
  $('#precedent').disabled = etape === 0;
  $('#suivant').disabled = etape === ETAPES.length - 1;
  $('#indication').textContent = indication();
  ({
    recit: sceneRecit, emotions: sceneEmotions, reglages: sceneReglages,
    contexte: sceneContexte, essai: sceneEssai, fiche: sceneFiche
  })[ETAPES[etape].id]();
}

function indication() {
  const n = etat.emotions.length;
  switch (ETAPES[etape].id) {
    case 'emotions': return n ? `${n} emotion${n > 1 ? 's' : ''} selected` : 'No emotion selected';
    case 'essai': {
      const aimees = etat.imposees.length, hors = etat.ecartees.length;
      return `${aimees} liked · ${hors} set aside`;
    }
    default: return '';
  }
}

/* --- 1. Story --- */

function sceneRecit() {
  $('#scene').onclick = null;
  $('#scene').oninput = null;
  $('#scene').innerHTML = `
    <h2>What the client says</h2>
    <p class="consigne">Write down their own words: a memory, a place, a person, a season.
       Exact phrasings are worth more than a summary.</p>
    <textarea id="recit" class="grand" placeholder="“My grandfather’s cabin in October…”"></textarea>
    <div class="assistant" style="margin-top:18px">
      <button type="button" class="tactile" id="lire-ia">Have the assistant read it</button>
      <button type="button" class="lien-discret" id="reglages-ia">Assistant settings</button>
      <span id="etat-ia" class="etat-ia"></span>
    </div>
    <div id="proposition-ia"></div>`;

  const zone = $('#recit');
  zone.value = etat.recit;
  let t;
  zone.addEventListener('input', () => {
    etat.recit = zone.value;
    clearTimeout(t);
    t = setTimeout(() => { sauvegarder(); }, 400);
  });

  $('#lire-ia').addEventListener('click', lancerLecture);
  $('#reglages-ia').addEventListener('click', reglagesIA);
  refleterIA();
}

function refleterIA() {
  const bouton = $('#lire-ia');
  if (!bouton) return;
  const pret = IA.disponible();
  bouton.disabled = !pret;
  $('#etat-ia').textContent = pret ? '' : 'Assistant not configured — keyword reading.';
  $('#etat-ia').className = 'etat-ia discret';
}

async function lancerLecture() {
  const texte = etat.recit.trim();
  const etatIA = $('#etat-ia');
  if (texte.length < 15) { etatIA.textContent = 'Write down a few words first.'; return; }

  if (lectureEnCours) lectureEnCours.abort();
  lectureEnCours = new AbortController();
  etatIA.className = 'etat-ia discret';
  etatIA.textContent = 'Reading…';
  $('#lire-ia').disabled = true;

  try {
    const lu = await IA.lireRecit(texte, lectureEnCours.signal);
    etatIA.textContent = '';
    proposition(lu);
  } catch (e) {
    if (e.name !== 'AbortError') {
      etatIA.className = 'etat-ia alerte';
      etatIA.textContent = `Reading failed: ${e.message}`;
    }
  } finally {
    lectureEnCours = null;
    $('#lire-ia').disabled = !IA.disponible();
  }
}

function proposition(lu) {
  const emos = lu.emotions.map((id) => EMOTIONS.find((e) => e.id === id)).filter(Boolean);
  const facettes = Object.entries(lu.facettes).sort((a, b) => b[1] - a[1]).map(([f]) => FACETTES[f]);

  $('#proposition-ia').innerHTML = `
    <div class="proposition">
      <h4>The assistant’s reading</h4>
      <p class="resume">${lu.resume}</p>
      ${emos.length ? `<p class="detail"><strong>Emotions:</strong> ${emos.map((e) => `${e.icone} ${e.nom}`).join(' · ')}</p>` : ''}
      ${facettes.length ? `<p class="detail"><strong>Materials evoked:</strong> ${facettes.join(' · ')}</p>` : ''}
      ${lu.indices.length ? `<p class="detail indices">Based on: ${lu.indices.map((i) => `“${i}”`).join(', ')}</p>` : ''}
      <div class="bandeau-outils" style="margin:14px 0 0">
        <button type="button" class="tactile pleine" id="accepter-ia">Apply</button>
        <button type="button" class="tactile" id="refuser-ia">Dismiss</button>
      </div>
    </div>`;

  $('#accepter-ia').addEventListener('click', () => {
    etat.emotions = [...new Set([...etat.emotions, ...lu.emotions])];
    etat.facettesIA = lu.facettes;
    CURSEURS.forEach((c) => {
      if (Math.abs(lu.curseurs[c.id]) > .15) etat.curseurs[c.id] = lu.curseurs[c.id];
    });
    sauvegarder();
    aller(1);
  });
  $('#refuser-ia').addEventListener('click', () => { $('#proposition-ia').innerHTML = ''; });
}

function reglagesIA() {
  const c = IA.config;
  panneau(`
    <h3>Assistant settings</h3>
    <p style="color:var(--encre-doux)">Without the assistant, the story is still read by a keyword lexicon.</p>
    <div style="display:grid;gap:14px;margin:18px 0">
      <label>Mode<br>
        <select id="ia-mode" style="width:100%;padding:12px;font:inherit;border:1px solid var(--ligne);border-radius:8px">
          <option value="off">None (keywords only)</option>
          <option value="proxy">House service (recommended)</option>
          <option value="direct">Key on this tablet</option>
        </select></label>
      <label id="ia-champ-proxy">Service address<br>
        <input id="ia-proxy" type="url" placeholder="https://…/lecture"
               style="width:100%;padding:12px;font:inherit;border:1px solid var(--ligne);border-radius:8px"></label>
      <label id="ia-champ-cle">Anthropic API key<br>
        <input id="ia-cle" type="password" placeholder="sk-ant-…"
               style="width:100%;padding:12px;font:inherit;border:1px solid var(--ligne);border-radius:8px"></label>
    </div>
    <p style="font-size:14.5px;color:var(--encre-doux)">A tablet passes from hand to hand during the
       appointment: prefer the house service, which keeps the key on the server.</p>
    <div class="bandeau-outils" style="margin:6px 0 0">
      <button type="button" class="tactile pleine" id="ia-enregistrer">Save</button>
      <button type="button" class="tactile" id="fermer-panneau">Close</button>
    </div>`);

  $('#ia-mode').value = c.mode;
  $('#ia-proxy').value = c.proxy || '';
  $('#ia-cle').value = c.cle || '';
  const ajuster = () => {
    const m = $('#ia-mode').value;
    $('#ia-champ-proxy').classList.toggle('masque', m !== 'proxy');
    $('#ia-champ-cle').classList.toggle('masque', m !== 'direct');
  };
  ajuster();
  $('#ia-mode').addEventListener('change', ajuster);
  $('#ia-enregistrer').addEventListener('click', () => {
    IA.enregistrer({
      mode: $('#ia-mode').value,
      proxy: $('#ia-proxy').value.trim(),
      cle: $('#ia-cle').value.trim()
    });
    fermerPanneau();
    refleterIA();
  });
}

/* --- 2. Emotions --- */

function sceneEmotions() {
  $('#scene').innerHTML = `
    <h2>What do they feel?</h2>
    <p class="consigne">Let them touch the cards. Two to four are enough.</p>
    <div class="cartes">${EMOTIONS.map((e) => `
      <button type="button" class="carte" data-emotion="${e.id}"
              aria-pressed="${etat.emotions.includes(e.id)}">
        <span class="titre">${e.icone} ${e.nom}</span>
        <span class="phrase">${e.phrase}</span>
      </button>`).join('')}</div>`;

  // onclick (not addEventListener): #scene survives step changes, and a
  // listener added at each render would pile up.
  $('#scene').oninput = null;
  $('#scene').onclick = (ev) => {
    const b = ev.target.closest('[data-emotion]');
    if (!b) return;
    const id = b.dataset.emotion;
    etat.emotions = etat.emotions.includes(id)
      ? etat.emotions.filter((x) => x !== id)
      : [...etat.emotions, id];
    b.setAttribute('aria-pressed', etat.emotions.includes(id));
    $('#indication').textContent = indication();
    sauvegarder();
  };
}

/* --- 3. Sliders --- */

function sceneReglages() {
  $('#scene').innerHTML = `
    <h2>Set the material with them</h2>
    <p class="consigne">No knowledge of perfumery is needed: it is their instinct speaking.</p>
    ${CURSEURS.map((c) => `
      <div class="curseur">
        <div class="legende">
          <span data-cote="${c.id}-gauche">${c.gauche}</span>
          <span data-cote="${c.id}-droite">${c.droite}</span>
        </div>
        <input type="range" min="-100" max="100" step="5" value="${(etat.curseurs[c.id] || 0) * 100}"
               data-curseur="${c.id}" aria-label="${c.gauche} to ${c.droite}">
      </div>`).join('')}`;

  const refleter = () => CURSEURS.forEach((c) => {
    const v = etat.curseurs[c.id] || 0;
    document.querySelector(`[data-cote="${c.id}-gauche"]`).classList.toggle('actif', v < -.15);
    document.querySelector(`[data-cote="${c.id}-droite"]`).classList.toggle('actif', v > .15);
  });
  refleter();

  $('#scene').onclick = null;
  $('#scene').oninput = (ev) => {
    const champ = ev.target.closest('[data-curseur]');
    if (!champ) return;
    etat.curseurs[champ.dataset.curseur] = Number(champ.value) / 100;
    refleter();
    sauvegarder();
  };
}

/* --- 4. Context --- */

function sceneContexte() {
  const chip = (actif, attr, valeur, texte) =>
    `<button type="button" class="chip" aria-pressed="${actif}" data-${attr}="${valeur}">${texte}</button>`;

  $('#scene').innerHTML = `
    <h2>When will they wear it?</h2>
    <p class="consigne">And what is out of the question.</p>

    <div class="groupe"><h3>Season</h3><div class="chips">
      ${[['toutes', 'All year round'], ['printemps', 'Spring'], ['ete', 'Summer'],
         ['automne', 'Autumn'], ['hiver', 'Winter']]
        .map(([v, t]) => chip(etat.saison === v, 'saison', v, t)).join('')}
    </div></div>

    <div class="groupe"><h3>Time of day</h3><div class="chips">
      ${[['indifferent', 'No preference'], ['jour', 'Daytime'], ['soir', 'Evening']]
        .map(([v, t]) => chip(etat.moment === v, 'moment', v, t)).join('')}
    </div></div>

    <div class="groupe"><h3>Concentration</h3><div class="chips">
      ${CONCENTRATIONS.map((c) => chip(etat.concentration === c.id, 'concentration', c.id,
        `${c.nom} <small style="opacity:.7">${c.plage}</small>`)).join('')}
    </div></div>

    <div class="groupe"><h3>To set aside</h3><div class="chips">
      ${EXCLUSIONS.map((x) => chip(etat.exclusions.includes(x.id), 'exclusion', x.id, x.nom)).join('')}
    </div></div>`;

  $('#scene').oninput = null;
  $('#scene').onclick = (ev) => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    const d = b.dataset;
    if (d.exclusion) {
      etat.exclusions = etat.exclusions.includes(d.exclusion)
        ? etat.exclusions.filter((x) => x !== d.exclusion)
        : [...etat.exclusions, d.exclusion];
    } else {
      ['saison', 'moment', 'concentration'].forEach((champ) => {
        if (d[champ]) etat[champ] = d[champ];
      });
    }
    sauvegarder();
    sceneContexte();
  };
}

/* --- 5. Blotters --- */

function sceneEssai() {
  $('#scene').onclick = null;
  $('#scene').oninput = null;
  if (!essai) essai = composer(etat);
  const lignes = ['tete', 'coeur', 'fond'].flatMap((r) =>
    essai.pyramide[r].map((l) => ({ ...l, role: r })));

  const nomRole = { tete: 'top', coeur: 'heart', fond: 'base' };
  const verdict = (id) => etat.imposees.includes(id) ? 'aimee'
                        : etat.ecartees.includes(id) ? 'ecartee' : '';

  $('#scene').innerHTML = `
    <h2>The blotters to smell</h2>
    <p class="consigne">Prepare one blotter per material, in this order. Note their reaction:
       what they like will be kept in the formula, what they refuse will leave it.</p>

    <div class="rappel">Follow the numbering, from top to base: the heaviest materials saturate
       the nose and would then mask the finer ones. Let the nose rest between two powerful
       materials.</div>

    <div id="mouillettes">
      ${lignes.map((l, i) => `
        <div class="mouillette ${verdict(l.matiere.id)}" data-matiere="${l.matiere.id}">
          <span class="numero">${i + 1}</span>
          <span class="corps">
            <b>${l.matiere.nom}</b>
            <small>${nomRole[l.role]} · ${l.matiere.note}</small>
          </span>
          <span class="verdicts">
            <button type="button" data-verdict="aime" aria-pressed="${etat.imposees.includes(l.matiere.id)}"
                    title="They like it">♥</button>
            <button type="button" data-verdict="ecarte" aria-pressed="${etat.ecartees.includes(l.matiere.id)}"
                    title="Set aside">✕</button>
          </span>
        </div>`).join('')}
    </div>

    <div class="bandeau-outils" style="margin-top:24px">
      <button type="button" class="tactile pleine" id="recomposer">Recompose with this feedback</button>
      <button type="button" class="tactile" id="oublier-retours">Start over</button>
    </div>`;

  $('#mouillettes').addEventListener('click', (ev) => {
    const bouton = ev.target.closest('[data-verdict]');
    if (!bouton) return;
    const ligne = bouton.closest('[data-matiere]');
    const id = ligne.dataset.matiere;
    const aime = bouton.dataset.verdict === 'aime';

    // one verdict replaces the other; clicking again cancels
    if (aime) {
      etat.ecartees = etat.ecartees.filter((x) => x !== id);
      etat.imposees = etat.imposees.includes(id)
        ? etat.imposees.filter((x) => x !== id) : [...etat.imposees, id];
    } else {
      etat.imposees = etat.imposees.filter((x) => x !== id);
      etat.ecartees = etat.ecartees.includes(id)
        ? etat.ecartees.filter((x) => x !== id) : [...etat.ecartees, id];
    }
    ligne.className = 'mouillette ' + (etat.imposees.includes(id) ? 'aimee'
                                     : etat.ecartees.includes(id) ? 'ecartee' : '');
    ligne.querySelectorAll('[data-verdict]').forEach((b) => {
      const actif = b.dataset.verdict === 'aime'
        ? etat.imposees.includes(id) : etat.ecartees.includes(id);
      b.setAttribute('aria-pressed', actif);
    });
    $('#indication').textContent = indication();
    sauvegarder();
  });

  $('#recomposer').addEventListener('click', () => { essai = composer(etat); sceneEssai(); });
  $('#oublier-retours').addEventListener('click', () => {
    etat.imposees = []; etat.ecartees = [];
    essai = composer(etat);
    sauvegarder();
    sceneEssai();
    $('#indication').textContent = indication();
  });
}

/* --- 6. Sheet --- */

function sceneFiche() {
  $('#scene').onclick = null;
  $('#scene').oninput = null;
  const c = composer(etat);
  const p = c.pyramide;
  const emos = c.emotionsRetenues.map((e) => `${e.icone} ${e.nom}`).join(' · ') || 'to be specified';

  $('#scene').innerHTML = `
    <h2 class="titre-fiche">Composition sheet</h2>
    <p style="margin:0;color:var(--encre-doux)">${seance.nom ? `<strong>${seance.nom}</strong> — ` : ''}${emos}
       — ${c.concentration.nom} (${c.concentration.plage}), estimated longevity ${c.concentration.tenue}.</p>

    <p class="intention">${c.intention}</p>

    <div class="bandeau-outils">
      <button type="button" class="tactile" id="imprimer">Print</button>
      <button type="button" class="tactile" id="copier">Copy the text</button>
      <button type="button" class="tactile" id="json">Export as JSON</button>
    </div>

    ${tableEtage('Top notes', 'tete', p.tete, c.equilibre.tete, true, aDesDilutions(c))}
    ${tableEtage('Heart notes', 'coeur', p.coeur, c.equilibre.coeur, true, aDesDilutions(c))}
    ${tableEtage('Base notes', 'fond', p.fond, c.equilibre.fond, true, aDesDilutions(c))}
    ${blocPesee(c)}
    ${blocSolvant(c)}

    ${etat.imposees.length || etat.ecartees.length ? `
      <div class="rappel">
        <strong>Session feedback —</strong>
        ${etat.imposees.length ? `kept: ${etat.imposees.map(nomMatiere).join(', ')}. ` : ''}
        ${etat.ecartees.length ? `set aside: ${etat.ecartees.map(nomMatiere).join(', ')}.` : ''}
      </div>` : ''}

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

    ${blocMiseEnAlcool(c)}`;

  $('#imprimer').addEventListener('click', () => window.print());
  $('#copier').addEventListener('click', (ev) => copier(texteFiche(c), ev.target));
  $('#json').addEventListener('click', () =>
    exporterJson(c, `sheet-${(seance.nom || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`));
}

const nomMatiere = (id) => (palette().find((m) => m.id === id) || { nom: id }).nom;

/* ------------------------------------------------------------------ */

$('#precedent').addEventListener('click', () => aller(etape - 1));
$('#suivant').addEventListener('click', () => aller(etape + 1));
$('#nouvelle').addEventListener('click', nouvelleSeance);
$('#seances').addEventListener('click', ouvrirSeances);
$('#voile').addEventListener('click', (ev) => { if (ev.target.id === 'voile') fermerPanneau(); });
$('#nom-client').addEventListener('input', (ev) => { seance.nom = ev.target.value; sauvegarder(); });
addEventListener('pagehide', sauvegarderMaintenant);
addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') sauvegarderMaintenant();
});

rendre();
