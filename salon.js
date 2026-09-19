/* Vue salon : la séance avec le client, sur tablette.
   Même moteur et même fiche que la page publique ; l'interface, elle, est faite
   pour être tenue à la main pendant le rendez-vous, avec les touches à sentir. */

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
  { id: 'recit',    titre: 'Récit' },
  { id: 'emotions', titre: 'Émotions' },
  { id: 'reglages', titre: 'Matière' },
  { id: 'contexte', titre: 'Usage' },
  { id: 'essai',    titre: 'Mouillettes' },
  { id: 'fiche',    titre: 'Fiche' }
];

const CLE_SEANCES = 'parfum.salon.seances';

let etat = structuredClone(ETAT_INITIAL);
let seance = { id: null, nom: '', date: null };
let etape = 0;
let essai = null;          // composition figée pendant l'essai des mouillettes
let lectureEnCours = null;

/* ------------------------------------------------------------------ */
/* Séances (mémoire locale de la tablette)                             */
/* ------------------------------------------------------------------ */

function lireSeances() {
  try { return JSON.parse(localStorage.getItem(CLE_SEANCES) || '[]'); }
  catch (e) { return []; }
}

function ecrireSeances(liste) {
  try { localStorage.setItem(CLE_SEANCES, JSON.stringify(liste.slice(0, 60))); }
  catch (e) { /* stockage plein ou navigation privée : la séance reste en mémoire vive */ }
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

/* Une tablette est interrompue à tout moment : avant de changer de séance,
   d'en ouvrir une autre ou de passer en arrière-plan, on écrit sans attendre. */
function sauvegarderMaintenant() {
  clearTimeout(minuterieSauvegarde);
  ecrireSeance();
}

function afficherHorodatage() {
  if (!seance.date) { $('#horodatage').textContent = ''; return; }
  const d = new Date(seance.date);
  $('#horodatage').textContent = 'enregistré à ' +
    d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
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
    <h3>Séances enregistrées</h3>
    <p style="color:var(--encre-doux);margin:0">Sur cette tablette uniquement — rien n'est envoyé ailleurs.</p>
    ${liste.length ? `<ul class="liste">${liste.map((s) => `
      <li>
        <span><strong>${s.nom || 'Sans nom'}</strong>
          <span class="quand">— ${new Date(s.date).toLocaleString('fr-CA',
            { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></span>
        <span style="display:flex;gap:8px">
          <button type="button" class="tactile discret" data-ouvrir="${s.id}">Reprendre</button>
          <button type="button" class="tactile discret" data-supprimer="${s.id}">Supprimer</button>
        </span>
      </li>`).join('')}</ul>`
      : '<p style="margin:18px 0">Aucune séance pour l\'instant.</p>'}
    <div class="bandeau-outils" style="margin:6px 0 0">
      <button type="button" class="tactile" id="fermer-panneau">Fermer</button>
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
/* Panneau modal                                                       */
/* ------------------------------------------------------------------ */

function panneau(html) {
  $('#panneau').innerHTML = html;
  $('#voile').classList.remove('masque');
  const fermer = $('#fermer-panneau');
  if (fermer) fermer.addEventListener('click', fermerPanneau);
}
function fermerPanneau() { $('#voile').classList.add('masque'); }

/* ------------------------------------------------------------------ */
/* Étapes                                                              */
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
    case 'emotions': return n ? `${n} émotion${n > 1 ? 's' : ''} retenue${n > 1 ? 's' : ''}` : 'Aucune émotion retenue';
    case 'essai': {
      const aimees = etat.imposees.length, hors = etat.ecartees.length;
      return `${aimees} aimée${aimees > 1 ? 's' : ''} · ${hors} écartée${hors > 1 ? 's' : ''}`;
    }
    default: return '';
  }
}

/* --- 1. Récit --- */

function sceneRecit() {
  $('#scene').onclick = null;
  $('#scene').oninput = null;
  $('#scene').innerHTML = `
    <h2>Ce que dit le client</h2>
    <p class="consigne">Notez ses mots à lui : un souvenir, un lieu, une personne, une saison.
       Les formulations exactes valent mieux qu'un résumé.</p>
    <textarea id="recit" class="grand" placeholder="« Le chalet de mon grand-père en octobre… »"></textarea>
    <div class="assistant" style="margin-top:18px">
      <button type="button" class="tactile" id="lire-ia">Faire lire par l'assistant</button>
      <button type="button" class="lien-discret" id="reglages-ia">Réglages de l'assistant</button>
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
  $('#etat-ia').textContent = pret ? '' : 'Assistant non configuré — lecture par mots-clés.';
  $('#etat-ia').className = 'etat-ia discret';
}

async function lancerLecture() {
  const texte = etat.recit.trim();
  const etatIA = $('#etat-ia');
  if (texte.length < 15) { etatIA.textContent = 'Notez d\'abord quelques mots.'; return; }

  if (lectureEnCours) lectureEnCours.abort();
  lectureEnCours = new AbortController();
  etatIA.className = 'etat-ia discret';
  etatIA.textContent = 'Lecture en cours…';
  $('#lire-ia').disabled = true;

  try {
    const lu = await IA.lireRecit(texte, lectureEnCours.signal);
    etatIA.textContent = '';
    proposition(lu);
  } catch (e) {
    if (e.name !== 'AbortError') {
      etatIA.className = 'etat-ia alerte';
      etatIA.textContent = `Lecture impossible : ${e.message}`;
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
      <h4>Lecture de l'assistant</h4>
      <p class="resume">${lu.resume}</p>
      ${emos.length ? `<p class="detail"><strong>Émotions :</strong> ${emos.map((e) => `${e.icone} ${e.nom}`).join(' · ')}</p>` : ''}
      ${facettes.length ? `<p class="detail"><strong>Matières évoquées :</strong> ${facettes.join(' · ')}</p>` : ''}
      ${lu.indices.length ? `<p class="detail indices">D'après : ${lu.indices.map((i) => `« ${i} »`).join(', ')}</p>` : ''}
      <div class="bandeau-outils" style="margin:14px 0 0">
        <button type="button" class="tactile pleine" id="accepter-ia">Appliquer</button>
        <button type="button" class="tactile" id="refuser-ia">Ignorer</button>
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
    <h3>Réglages de l'assistant</h3>
    <p style="color:var(--encre-doux)">Sans assistant, le récit reste lu par un lexique de mots-clés.</p>
    <div style="display:grid;gap:14px;margin:18px 0">
      <label>Mode<br>
        <select id="ia-mode" style="width:100%;padding:12px;font:inherit;border:1px solid var(--ligne);border-radius:8px">
          <option value="off">Aucun (mots-clés seulement)</option>
          <option value="proxy">Service de la maison (recommandé)</option>
          <option value="direct">Clé sur cette tablette</option>
        </select></label>
      <label id="ia-champ-proxy">Adresse du service<br>
        <input id="ia-proxy" type="url" placeholder="https://…/lecture"
               style="width:100%;padding:12px;font:inherit;border:1px solid var(--ligne);border-radius:8px"></label>
      <label id="ia-champ-cle">Clé d'API Anthropic<br>
        <input id="ia-cle" type="password" placeholder="sk-ant-…"
               style="width:100%;padding:12px;font:inherit;border:1px solid var(--ligne);border-radius:8px"></label>
    </div>
    <p style="font-size:14.5px;color:var(--encre-doux)">Une tablette passe de main en main pendant
       le rendez-vous : préférez le service de la maison, qui garde la clé côté serveur.</p>
    <div class="bandeau-outils" style="margin:6px 0 0">
      <button type="button" class="tactile pleine" id="ia-enregistrer">Enregistrer</button>
      <button type="button" class="tactile" id="fermer-panneau">Fermer</button>
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

/* --- 2. Émotions --- */

function sceneEmotions() {
  $('#scene').innerHTML = `
    <h2>Qu'est-ce qu'il ressent ?</h2>
    <p class="consigne">Faites-lui toucher les cartes. Deux à quatre suffisent.</p>
    <div class="cartes">${EMOTIONS.map((e) => `
      <button type="button" class="carte" data-emotion="${e.id}"
              aria-pressed="${etat.emotions.includes(e.id)}">
        <span class="titre">${e.icone} ${e.nom}</span>
        <span class="phrase">${e.phrase}</span>
      </button>`).join('')}</div>`;

  // onclick (et non addEventListener) : #scene survit aux changements d'étape,
  // un écouteur ajouté à chaque rendu s'y empilerait.
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

/* --- 3. Réglages --- */

function sceneReglages() {
  $('#scene').innerHTML = `
    <h2>Réglez la matière avec lui</h2>
    <p class="consigne">Aucune connaissance en parfumerie n'est nécessaire : c'est son instinct qui parle.</p>
    ${CURSEURS.map((c) => `
      <div class="curseur">
        <div class="legende">
          <span data-cote="${c.id}-gauche">${c.gauche}</span>
          <span data-cote="${c.id}-droite">${c.droite}</span>
        </div>
        <input type="range" min="-100" max="100" step="5" value="${(etat.curseurs[c.id] || 0) * 100}"
               data-curseur="${c.id}" aria-label="${c.gauche} vers ${c.droite}">
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

/* --- 4. Contexte --- */

function sceneContexte() {
  const chip = (actif, attr, valeur, texte) =>
    `<button type="button" class="chip" aria-pressed="${actif}" data-${attr}="${valeur}">${texte}</button>`;

  $('#scene').innerHTML = `
    <h2>Quand le portera-t-il ?</h2>
    <p class="consigne">Et ce qui est hors de question.</p>

    <div class="groupe"><h3>Saison</h3><div class="chips">
      ${[['toutes', 'Toute l\'année'], ['printemps', 'Printemps'], ['ete', 'Été'],
         ['automne', 'Automne'], ['hiver', 'Hiver']]
        .map(([v, t]) => chip(etat.saison === v, 'saison', v, t)).join('')}
    </div></div>

    <div class="groupe"><h3>Moment</h3><div class="chips">
      ${[['indifferent', 'Indifférent'], ['jour', 'Le jour'], ['soir', 'Le soir']]
        .map(([v, t]) => chip(etat.moment === v, 'moment', v, t)).join('')}
    </div></div>

    <div class="groupe"><h3>Concentration</h3><div class="chips">
      ${CONCENTRATIONS.map((c) => chip(etat.concentration === c.id, 'concentration', c.id,
        `${c.nom} <small style="opacity:.7">${c.plage}</small>`)).join('')}
    </div></div>

    <div class="groupe"><h3>À écarter</h3><div class="chips">
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

/* --- 5. Mouillettes --- */

function sceneEssai() {
  $('#scene').onclick = null;
  $('#scene').oninput = null;
  if (!essai) essai = composer(etat);
  const lignes = ['tete', 'coeur', 'fond'].flatMap((r) =>
    essai.pyramide[r].map((l) => ({ ...l, role: r })));

  const nomRole = { tete: 'tête', coeur: 'cœur', fond: 'fond' };
  const verdict = (id) => etat.imposees.includes(id) ? 'aimee'
                        : etat.ecartees.includes(id) ? 'ecartee' : '';

  $('#scene').innerHTML = `
    <h2>Les touches à sentir</h2>
    <p class="consigne">Préparez une mouillette par matière, dans cet ordre. Notez sa réaction :
       ce qu'il aime sera gardé dans la formule, ce qu'il refuse en sortira.</p>

    <div class="rappel">Suivez la numérotation, de la tête au fond : les matières les plus lourdes
       saturent le nez et masqueraient ensuite les plus fines. Laissez respirer entre deux matières
       puissantes.</div>

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
                    title="Il aime">♥</button>
            <button type="button" data-verdict="ecarte" aria-pressed="${etat.ecartees.includes(l.matiere.id)}"
                    title="À écarter">✕</button>
          </span>
        </div>`).join('')}
    </div>

    <div class="bandeau-outils" style="margin-top:24px">
      <button type="button" class="tactile pleine" id="recomposer">Recomposer avec ces retours</button>
      <button type="button" class="tactile" id="oublier-retours">Repartir à zéro</button>
    </div>`;

  $('#mouillettes').addEventListener('click', (ev) => {
    const bouton = ev.target.closest('[data-verdict]');
    if (!bouton) return;
    const ligne = bouton.closest('[data-matiere]');
    const id = ligne.dataset.matiere;
    const aime = bouton.dataset.verdict === 'aime';

    // un verdict remplace l'autre ; recliquer annule
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

/* --- 6. Fiche --- */

function sceneFiche() {
  $('#scene').onclick = null;
  $('#scene').oninput = null;
  const c = composer(etat);
  const p = c.pyramide;
  const emos = c.emotionsRetenues.map((e) => `${e.icone} ${e.nom}`).join(' · ') || 'à préciser';

  $('#scene').innerHTML = `
    <h2 class="titre-fiche">Fiche de composition</h2>
    <p style="margin:0;color:var(--encre-doux)">${seance.nom ? `<strong>${seance.nom}</strong> — ` : ''}${emos}
       — ${c.concentration.nom} (${c.concentration.plage}), tenue estimée ${c.concentration.tenue}.</p>

    <p class="intention">${c.intention}</p>

    <div class="bandeau-outils">
      <button type="button" class="tactile" id="imprimer">Imprimer</button>
      <button type="button" class="tactile" id="copier">Copier le texte</button>
      <button type="button" class="tactile" id="json">Exporter en JSON</button>
    </div>

    ${tableEtage('Notes de tête', 'tete', p.tete, c.equilibre.tete, true, aDesDilutions(c))}
    ${tableEtage('Notes de cœur', 'coeur', p.coeur, c.equilibre.coeur, true, aDesDilutions(c))}
    ${tableEtage('Notes de fond', 'fond', p.fond, c.equilibre.fond, true, aDesDilutions(c))}
    ${blocPesee(c)}
    ${blocSolvant(c)}

    ${etat.imposees.length || etat.ecartees.length ? `
      <div class="rappel">
        <strong>Retours de la séance —</strong>
        ${etat.imposees.length ? `gardées : ${etat.imposees.map(nomMatiere).join(', ')}. ` : ''}
        ${etat.ecartees.length ? `écartées : ${etat.ecartees.map(nomMatiere).join(', ')}.` : ''}
      </div>` : ''}

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

    ${blocMiseEnAlcool(c)}`;

  $('#imprimer').addEventListener('click', () => window.print());
  $('#copier').addEventListener('click', (ev) => copier(texteFiche(c), ev.target));
  $('#json').addEventListener('click', () =>
    exporterJson(c, `fiche-${(seance.nom || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`));
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
