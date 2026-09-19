/* La palette saisie dans l'application, gardée sur l'appareil du parfumeur.
   Chargée par toutes les pages : dès qu'elle existe, le moteur ne propose
   plus que ces matières-là. */

const CLE_PALETTE = 'parfum.palette';

const PaletteLocale = {
  lire() {
    try {
      const brut = localStorage.getItem(CLE_PALETTE);
      const liste = brut ? JSON.parse(brut) : [];
      return Array.isArray(liste) ? liste : [];
    } catch (e) {
      return [];
    }
  },

  ecrire(liste) {
    try {
      localStorage.setItem(CLE_PALETTE, JSON.stringify(liste));
      definirPalette(liste);
      return true;
    } catch (e) {
      // stockage plein ou navigation privée : la palette vit le temps de l'onglet
      definirPalette(liste);
      return false;
    }
  },

  vider() {
    try { localStorage.removeItem(CLE_PALETTE); } catch (e) { /* rien à faire */ }
    definirPalette(null);
  },

  /* Combien de matières, et d'où vient la palette réellement utilisée. */
  etat() {
    return { nombre: palette().length, origine: originePalette() };
  }
};

definirPalette(PaletteLocale.lire());
