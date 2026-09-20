/* Fixed texts of the three pages, in English. The root textes.js carries the same
   keys in French; langue.js loads one or the other and applies them to the
   elements marked data-t. Everything else in the interface is written by app.js,
   salon.js and palette.js, each in its own language. */

const TEXTES = {
  /* client page */
  index_titre: 'The Perfume of Emotions — from emotion to formula',
  titre: 'The Perfume of Emotions',
  chapeau: 'The client describes what they feel; the perfumer receives a composition sheet — raw materials, olfactory pyramid and indicative dosages — to start working from.',
  e1_titre: 'Tell us',
  e1_aide: 'A memory, a place, a person, a moment this perfume should hold. Write freely: the words are read and translated into materials.',
  recit_placeholder: '“My grandfather’s cabin in October. Rain on the leaves, a fire that won’t catch, his wool jacket…”',
  lire_ia: 'Have the assistant read my story',
  reglages_ia: 'Assistant settings',
  e2_titre: 'Choose your emotions',
  e2_aide: 'Two to four are enough. The emotions inferred from your story are already suggested.',
  e3_titre: 'Set the material',
  e3_aide: 'No knowledge of perfumery is needed: follow your instinct.',
  e4_titre: 'Specify the use',
  e4_aide: 'When will it be worn, and what is out of the question?',
  saison: 'Season',
  saison_toutes: 'All year round',
  saison_printemps: 'Spring',
  saison_ete: 'Summer',
  saison_automne: 'Autumn',
  saison_hiver: 'Winter',
  moment: 'Time of day',
  moment_indifferent: 'No preference',
  moment_jour: 'Daytime',
  moment_soir: 'Evening',
  concentration: 'Desired concentration',
  conc_edt: 'Eau de toilette',
  conc_edp: 'Eau de parfum',
  conc_extrait: 'Extrait',
  exclusions_intro: 'To set aside:',
  pied: 'Percentages are expressed within the concentrate and given as guidance only: they are a laboratory starting point, not a finished formula. IFRA compliance, allergen control and the actual balance of the blend remain the perfumer\'s work and responsibility.',
  pied_parfumeur: 'Perfumer:',
  pied_palette: 'my palette',
  pied_salon: 'salon session',

  /* salon view */
  salon_titre: 'The Perfume of Emotions — salon session',
  nom_client: 'Client\'s name',
  salon_palette: 'Palette',
  salon_seances: 'Sessions',
  salon_nouvelle: 'New',
  salon_precedent: '← Previous',
  salon_suivant: 'Next →',

  /* palette */
  palette_titre: 'My palette — The Perfume of Emotions',
  ma_palette: 'My palette',
  palette_seance: 'Session',
  palette_client: 'Client page',
  ajouter: '+ Add a material',
  depuis_liste: 'Paste my list',
  partir_demo: 'Start from the demonstration palette',
  exporter: 'Save / export',
  importer: 'Restore a backup',
  vider: 'Erase everything',
  recherche: 'Search for a material…',

  /* shared */
  langue_groupe: 'Langue / Language'
};

Langue.appliquerTextes(TEXTES);
