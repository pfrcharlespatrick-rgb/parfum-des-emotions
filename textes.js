/* Textes fixes des trois pages, en français. en/textes.js porte les mêmes clés
   en anglais ; langue.js charge l'un ou l'autre et les applique aux éléments
   marqués data-t. Tout le reste de l'interface est écrit par app.js, salon.js
   et palette.js, chacun dans sa langue. */

const TEXTES = {
  /* page client */
  index_titre: 'Le Parfum des émotions — de l\'émotion à la formule',
  titre: 'Le Parfum des émotions',
  chapeau: 'Le client raconte ce qu\'il ressent ; le parfumeur reçoit une fiche de composition — matières premières, pyramide olfactive et dosages indicatifs — pour commencer à travailler.',
  e1_titre: 'Racontez',
  e1_aide: 'Un souvenir, un lieu, une personne, un moment que ce parfum devrait contenir. Écrivez librement : les mots sont lus et traduits en matières.',
  recit_placeholder: '« Le chalet de mon grand-père en octobre. La pluie sur les feuilles, le feu qui prend mal, sa veste de laine… »',
  lire_ia: 'Faire lire mon récit par l\'assistant',
  reglages_ia: 'Réglages de l\'assistant',
  e2_titre: 'Choisissez vos émotions',
  e2_aide: 'Deux à quatre suffisent. Les émotions déduites de votre récit sont déjà suggérées.',
  e3_titre: 'Réglez la matière',
  e3_aide: 'Aucune connaissance en parfumerie n\'est nécessaire : suivez votre instinct.',
  e4_titre: 'Précisez l\'usage',
  e4_aide: 'Quand le portera-t-on, et qu\'est-ce qui est hors de question ?',
  saison: 'Saison',
  saison_toutes: 'Toute l\'année',
  saison_printemps: 'Printemps',
  saison_ete: 'Été',
  saison_automne: 'Automne',
  saison_hiver: 'Hiver',
  moment: 'Moment',
  moment_indifferent: 'Indifférent',
  moment_jour: 'Le jour',
  moment_soir: 'Le soir',
  concentration: 'Concentration souhaitée',
  conc_edt: 'Eau de toilette',
  conc_edp: 'Eau de parfum',
  conc_extrait: 'Extrait',
  exclusions_intro: 'À écarter :',
  pied: 'Les pourcentages sont exprimés dans le concentré et donnés à titre indicatif : ils constituent un point de départ de laboratoire, non une formule finie. La conformité IFRA, le contrôle des allergènes et l\'équilibre réel du mélange restent le travail et la responsabilité du parfumeur.',
  pied_parfumeur: 'Parfumeur :',
  pied_palette: 'ma palette',
  pied_salon: 'séance en salon',

  /* vue salon */
  salon_titre: 'Le Parfum des émotions — séance en salon',
  nom_client: 'Nom du client',
  salon_palette: 'Palette',
  salon_seances: 'Séances',
  salon_nouvelle: 'Nouvelle',
  salon_precedent: '← Précédent',
  salon_suivant: 'Suivant →',

  /* palette */
  palette_titre: 'Ma palette — Le Parfum des émotions',
  ma_palette: 'Ma palette',
  palette_seance: 'Séance',
  palette_client: 'Page client',
  ajouter: '+ Ajouter une matière',
  depuis_liste: 'Coller ma liste',
  partir_demo: 'Partir de la palette de démonstration',
  exporter: 'Sauvegarder / exporter',
  importer: 'Restaurer une sauvegarde',
  vider: 'Tout effacer',
  recherche: 'Chercher une matière…',

  /* commun */
  langue_groupe: 'Langue / Language'
};

Langue.appliquerTextes(TEXTES);
