/* Choix de la langue — une seule adresse, un bouton pour passer du français à l'anglais.
   Chargé en premier, dans l'en-tête des trois pages.

   Le français vit à la racine, l'anglais dans en/ ; les deux éditions ont les mêmes
   fichiers. La page est une coquille sans langue : ce script lit le choix, puis
   charge l'une ou l'autre série de fichiers.

   D'où vient le choix, dans l'ordre :
     1. le paramètre ?lang=fr ou ?lang=en de l'adresse (un lien peut imposer la langue) ;
     2. le choix retenu sur l'appareil (stockage du navigateur) ;
     3. la langue du navigateur, anglais ou, sinon, français.
   Le paramètre est retiré de l'adresse une fois lu : l'adresse reste la même dans
   les deux langues, seule la préférence change. */

const Langue = (() => {
  const CLE = 'parfum.langue';
  const LANGUES = ['fr', 'en'];

  const url = new URL(location.href);
  const param = url.searchParams.get('lang');
  let choix = LANGUES.includes(param) ? param : null;
  if (!choix) {
    try { choix = localStorage.getItem(CLE); } catch (e) { /* stockage indisponible */ }
  }
  if (!LANGUES.includes(choix)) {
    choix = /^en(-|$)/i.test(navigator.language || '') ? 'en' : 'fr';
  }
  try { localStorage.setItem(CLE, choix); } catch (e) { /* navigation privée : le choix vaut pour la page */ }

  if (param) {
    url.searchParams.delete('lang');
    history.replaceState(history.state, '', url);
  }

  document.documentElement.lang = choix;
  // En anglais, on attend les textes traduits avant d'afficher, pour ne pas voir
  // le français une fraction de seconde. Filet : jamais plus de deux secondes.
  if (choix !== 'fr') {
    document.documentElement.classList.add('langue-en-attente');
    setTimeout(() => document.documentElement.classList.remove('langue-en-attente'), 2000);
  }

  const dossier = choix === 'en' ? 'en/' : '';

  /* Charge les fichiers dans l'ordre donné. Un fichier « partagé » vit à la racine
     et sert aux deux langues (stock.js, palette-locale.js). */
  function charger(fichiers) {
    fichiers.forEach(([nom, partage]) => {
      const s = document.createElement('script');
      s.src = (partage ? './' : './' + dossier) + nom;
      s.async = false;                       // exécutés dans l'ordre d'insertion
      document.body.appendChild(s);
    });
  }

  /* Applique les textes fixes de la page : data-t (contenu), data-t-placeholder,
     data-t-title. Appelé par textes.js de chaque langue. */
  function appliquerTextes(textes) {
    document.querySelectorAll('[data-t]').forEach((el) => {
      const t = textes[el.dataset.t];
      if (t != null) el.textContent = t;
    });
    document.querySelectorAll('[data-t-placeholder]').forEach((el) => {
      const t = textes[el.dataset.tPlaceholder];
      if (t != null) el.placeholder = t;
    });
    document.querySelectorAll('[data-t-title]').forEach((el) => {
      const t = textes[el.dataset.tTitle];
      if (t != null) el.title = t;
    });
    document.documentElement.classList.remove('langue-en-attente');
  }

  /* Passe dans l'autre langue : la page se recharge à la même adresse. Avant de
     partir, la page peut mettre son état à l'abri (window.avantChangementDeLangue). */
  function basculer(vers) {
    if (!LANGUES.includes(vers) || vers === choix) return;
    if (typeof window.avantChangementDeLangue === 'function') {
      try { window.avantChangementDeLangue(); } catch (e) { /* on change de langue quand même */ }
    }
    try { localStorage.setItem(CLE, vers); } catch (e) { /* le paramètre d'adresse suffira */ }
    const cible = new URL(location.href);
    cible.searchParams.set('lang', vers);
    location.href = cible.toString();
  }

  function brancherBoutons() {
    document.querySelectorAll('[data-langue]').forEach((b) => {
      b.setAttribute('aria-pressed', b.dataset.langue === choix);
      b.addEventListener('click', () => basculer(b.dataset.langue));
    });
  }

  return { courante: choix, dossier, charger, appliquerTextes, basculer, brancherBoutons };
})();
