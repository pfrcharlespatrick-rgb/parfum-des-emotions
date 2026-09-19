/* Données du moteur olfactif : facettes, émotions, lexique, matières premières.
   Tout est chargé en clair (pas de fetch) pour que l'application fonctionne
   aussi bien depuis un fichier local que depuis GitHub Pages. */

/* ------------------------------------------------------------------ */
/* 1. Facettes olfactives — le vocabulaire commun entre émotion et matière */
/* ------------------------------------------------------------------ */

const FACETTES = {
  agrumes:      'Agrumes',
  vert:         'Vert / végétal',
  aromatique:   'Aromatique',
  aldehyde:     'Aldéhydé',
  aquatique:    'Aquatique / ozonique',
  floral_blanc: 'Floral blanc',
  floral_poudre:'Floral poudré',
  rose:         'Rosé',
  fruite:       'Fruité',
  the:          'Thé / infusé',
  epice_frais:  'Épices fraîches',
  epice_chaud:  'Épices chaudes',
  miel:         'Miellé',
  gourmand:     'Gourmand',
  vanille:      'Vanillé',
  bois_sec:     'Bois secs',
  bois_cremeux: 'Bois crémeux',
  resine:       'Résines / encens',
  ambre:        'Ambré',
  mousse_terre: 'Mousse / terre',
  cuir:         'Cuir',
  fume:         'Fumé',
  animal:       'Animal',
  musc:         'Musqué'
};

/* ------------------------------------------------------------------ */
/* 2. Émotions proposées au client                                     */
/* ------------------------------------------------------------------ */
/* poids : contribution de l'émotion au vecteur de facettes (0 à 1).   */

const EMOTIONS = [
  {
    id: 'serenite', nom: 'Sérénité', icone: '🕊️',
    phrase: 'Le calme après la tempête, la respiration qui ralentit.',
    poids: { aromatique: .8, the: .7, musc: .6, floral_poudre: .4, bois_cremeux: .4, vert: .3 }
  },
  {
    id: 'nostalgie', nom: 'Nostalgie', icone: '🕰️',
    phrase: 'Un lieu, une saison, quelqu\'un qui n\'est plus là.',
    poids: { floral_poudre: .9, mousse_terre: .6, vanille: .5, miel: .4, resine: .4, bois_sec: .3 }
  },
  {
    id: 'tendresse', nom: 'Tendresse', icone: '🤍',
    phrase: 'La douceur d\'une peau, d\'un geste, d\'une étoffe.',
    poids: { musc: .9, floral_poudre: .7, vanille: .5, floral_blanc: .4, bois_cremeux: .4 }
  },
  {
    id: 'desir', nom: 'Désir', icone: '🔥',
    phrase: 'La chaleur qui monte, l\'attente, la proximité.',
    poids: { animal: .8, floral_blanc: .8, ambre: .7, miel: .5, epice_chaud: .5, musc: .5 }
  },
  {
    id: 'audace', nom: 'Audace', icone: '⚡',
    phrase: 'Oser, trancher, ne pas passer inaperçu.',
    poids: { cuir: .8, epice_chaud: .7, fume: .6, bois_sec: .5, aldehyde: .4, resine: .4 }
  },
  {
    id: 'force', nom: 'Force intérieure', icone: '🗿',
    phrase: 'Tenir debout. La colonne vertébrale.',
    poids: { bois_sec: .9, mousse_terre: .6, resine: .5, cuir: .4, epice_chaud: .3 }
  },
  {
    id: 'joie', nom: 'Joie', icone: '☀️',
    phrase: 'Le rire franc, la lumière du matin.',
    poids: { agrumes: 1, fruite: .7, floral_blanc: .5, aldehyde: .4, vert: .3 }
  },
  {
    id: 'melancolie', nom: 'Mélancolie', icone: '🌧️',
    phrase: 'Une belle tristesse, tenue à distance.',
    poids: { mousse_terre: .8, floral_poudre: .6, the: .5, resine: .5, bois_sec: .4, fume: .3 }
  },
  {
    id: 'liberte', nom: 'Liberté', icone: '🌬️',
    phrase: 'Le grand air, la route ouverte, rien qui retienne.',
    poids: { aquatique: .9, vert: .7, agrumes: .6, aromatique: .5, musc: .3 }
  },
  {
    id: 'mystere', nom: 'Mystère', icone: '🌑',
    phrase: 'Ce qu\'on ne dit pas. L\'ombre choisie.',
    poids: { resine: .8, fume: .7, bois_sec: .6, cuir: .5, epice_chaud: .5, animal: .4 }
  },
  {
    id: 'reconfort', nom: 'Réconfort', icone: '🧣',
    phrase: 'Rentrer chez soi, la laine, la table mise.',
    poids: { gourmand: .9, vanille: .8, ambre: .6, epice_chaud: .5, bois_cremeux: .4, miel: .4 }
  },
  {
    id: 'elan', nom: 'Élan / vitalité', icone: '🏃',
    phrase: 'L\'énergie du départ, le corps qui répond.',
    poids: { epice_frais: .8, agrumes: .7, aromatique: .6, vert: .5, aquatique: .3 }
  },
  {
    id: 'purete', nom: 'Pureté / renouveau', icone: '🌱',
    phrase: 'Recommencer propre. Le linge, la pluie, la page blanche.',
    poids: { musc: .8, vert: .7, aquatique: .6, aldehyde: .5, floral_blanc: .4 }
  },
  {
    id: 'opulence', nom: 'Opulence', icone: '👑',
    phrase: 'La fête, l\'abondance, la robe qui froisse.',
    poids: { floral_blanc: .8, ambre: .7, rose: .6, epice_chaud: .5, aldehyde: .5, resine: .4 }
  },
  {
    id: 'recueillement', nom: 'Recueillement', icone: '🕯️',
    phrase: 'Le silence d\'une nef, quelque chose de plus grand que soi.',
    poids: { resine: 1, fume: .6, bois_sec: .5, the: .4, floral_poudre: .3 }
  },
  {
    id: 'insouciance', nom: 'Insouciance', icone: '🍑',
    phrase: 'L\'enfance, les vacances, ne penser à rien.',
    poids: { fruite: .9, gourmand: .6, agrumes: .5, floral_blanc: .4, vanille: .4 }
  }
];

/* ------------------------------------------------------------------ */
/* 3. Lexique — reconnaissance de mots dans le récit du client         */
/* ------------------------------------------------------------------ */
/* Chaque entrée : mots-clés (sans accents, en minuscules) -> émotions
   suggérées et/ou facettes directement évoquées. */

const LEXIQUE = [
  { mots: ['calme','paix','apaise','serein','repos','tranquille','silence','respirer'], emotions: ['serenite'] },
  { mots: ['souvenir','enfance','grand-mere','grand-pere','autrefois','jadis','memoire','disparu','maison de'], emotions: ['nostalgie'] },
  { mots: ['tendre','douceur','caresse','peau','bebe','cocon','maman','affection'], emotions: ['tendresse'] },
  { mots: ['desir','sensuel','amour','seduction','nuit','baiser','passion','erotique'], emotions: ['desir'] },
  { mots: ['audace','oser','provoquer','remarque','affirmer','rebelle','franc'], emotions: ['audace'] },
  { mots: ['force','solide','courage','tenir','stable','ancre','robuste','determination'], emotions: ['force'] },
  { mots: ['joie','rire','heureux','bonheur','soleil','lumiere','eclat','petillant'], emotions: ['joie'] },
  { mots: ['triste','melancolie','pluie','gris','absence','deuil','regret','automne'], emotions: ['melancolie'] },
  { mots: ['liberte','voyage','route','vent','mer','ocean','large','horizon','montagne'], emotions: ['liberte'] },
  { mots: ['mystere','secret','ombre','enigme','cache','profond','obscur'], emotions: ['mystere'] },
  { mots: ['reconfort','chaleur','foyer','laine','feu','cheminee','gateau','hiver','doudou'], emotions: ['reconfort'] },
  { mots: ['energie','elan','sport','matin','vif','dynamique','course','depart'], emotions: ['elan'] },
  { mots: ['propre','neuf','pur','linge','blanc','recommencer','frais','douche'], emotions: ['purete'] },
  { mots: ['fete','luxe','soiree','gala','riche','abondance','robe','celebration'], emotions: ['opulence'] },
  { mots: ['priere','eglise','sacre','encens','spirituel','meditation','recueil','ame'], emotions: ['recueillement'] },
  { mots: ['vacances','insouciant','leger','jeu','plage','ete','pique-nique','sans souci'], emotions: ['insouciance'] },

  // Mots qui désignent directement une matière ou une facette
  { mots: ['agrume','citron','orange','pamplemousse','bergamote','mandarine','zeste'], facettes: { agrumes: .9 } },
  { mots: ['herbe','gazon','feuille','foret','vert','tige','seve','jardin'],           facettes: { vert: .8 } },
  { mots: ['lavande','romarin','menthe','thym','maquis','garrigue'],                    facettes: { aromatique: .8 } },
  { mots: ['mer','sel','embrun','marin','pluie','ozone','vague','eau'],                 facettes: { aquatique: .9 } },
  { mots: ['jasmin','tubereuse','fleur d\'oranger','fleur blanche','magnolia','muguet'],facettes: { floral_blanc: .9 } },
  { mots: ['rose','pivoine','petale'],                                                  facettes: { rose: .9 } },
  { mots: ['poudre','iris','violette','maquillage','talc','poudre de riz'],             facettes: { floral_poudre: .9 } },
  { mots: ['fruit','peche','poire','framboise','figue','pomme','abricot','cassis'],     facettes: { fruite: .9 } },
  { mots: ['the','matcha','infusion','tisane'],                                         facettes: { the: .9 } },
  { mots: ['poivre','gingembre','cardamome','coriandre'],                               facettes: { epice_frais: .8 } },
  { mots: ['cannelle','clou de girofle','muscade','safran','curry','epice'],            facettes: { epice_chaud: .8 } },
  { mots: ['miel','cire','ruche','abeille'],                                            facettes: { miel: .9 } },
  { mots: ['vanille','gourmand','caramel','sucre','chocolat','cacao','praline','biscuit'], facettes: { gourmand: .8, vanille: .6 } },
  { mots: ['cafe','torrefie','expresso'],                                               facettes: { gourmand: .6, fume: .5 } },
  { mots: ['bois','cedre','vetiver','sec','crayon','copeaux'],                          facettes: { bois_sec: .9 } },
  { mots: ['santal','lait','creme','onctueux','velours','soyeux'],                      facettes: { bois_cremeux: .8 } },
  { mots: ['encens','resine','myrrhe','oliban','baume','benjoin'],                      facettes: { resine: .9 } },
  { mots: ['ambre','ambree','chaud','solaire','sable'],                                 facettes: { ambre: .8 } },
  { mots: ['mousse','terre','humus','champignon','sous-bois','pierre','humide'],        facettes: { mousse_terre: .9 } },
  { mots: ['cuir','blouson','selle','tannerie','botte'],                                facettes: { cuir: .9 } },
  { mots: ['fumee','feu de bois','tabac','braise','goudron','cendre'],                  facettes: { fume: .9 } },
  { mots: ['animal','peau nue','fourrure','sauvage','chair','musc'],                    facettes: { animal: .7, musc: .6 } },
  { mots: ['propre','coton','drap','linge seche','lessive'],                            facettes: { musc: .9 } }
];

/* ------------------------------------------------------------------ */
/* 4. Matières premières                                               */
/* ------------------------------------------------------------------ */
/* role   : tete | coeur | fond
   dose   : fourchette indicative en % du concentré (à valider par le parfumeur)
   force  : pouvoir odorant 1 (discret) à 5 (redoutable) — module la dose
   tags   : filtres d'exclusion (animal, gourmand, allergene, rare, alcool_lourd…)
   nature : naturelle | synthese                                           */

const MATIERES = [
  /* ---------------- TÊTE ---------------- */
  { id:'bergamote', nom:'Bergamote', latin:'Citrus bergamia', famille:'Agrumes', role:'tete', nature:'naturelle',
    facettes:{ agrumes:1, vert:.3, aromatique:.2 }, force:2, dose:[3,15], tags:['photosensible'],
    note:'Le zeste le plus élégant : amer, floral, immédiatement lumineux.',
    prudence:'Photosensibilisante — préférer une qualité FCF (sans bergaptène).' },

  { id:'citron', nom:'Citron', latin:'Citrus limon', famille:'Agrumes', role:'tete', nature:'naturelle',
    facettes:{ agrumes:1, vert:.2 }, force:2, dose:[2,10], tags:[],
    note:'Éclat net, tranchant, très volatil.' },

  { id:'pamplemousse', nom:'Pamplemousse', latin:'Citrus paradisi', famille:'Agrumes', role:'tete', nature:'naturelle',
    facettes:{ agrumes:.9, fruite:.4, vert:.3 }, force:2, dose:[2,10], tags:[],
    note:'Amertume pétillante, un peu soufrée, très gaie.' },

  { id:'mandarine', nom:'Mandarine verte', latin:'Citrus reticulata', famille:'Agrumes', role:'tete', nature:'naturelle',
    facettes:{ agrumes:.9, fruite:.5, floral_blanc:.2 }, force:2, dose:[2,10], tags:[],
    note:'Le plus tendre des agrumes — sucré, enfantin.' },

  { id:'petitgrain', nom:'Petitgrain bigarade', latin:'Citrus aurantium (feuilles)', famille:'Agrumes', role:'tete', nature:'naturelle',
    facettes:{ agrumes:.6, vert:.7, aromatique:.5 }, force:3, dose:[1,6], tags:[],
    note:'Feuille amère et cologne : propre, un peu nerveux.' },

  { id:'lavande', nom:'Lavande', latin:'Lavandula angustifolia', famille:'Aromatique', role:'tete', nature:'naturelle',
    facettes:{ aromatique:1, floral_poudre:.3, vert:.3 }, force:3, dose:[1,8], tags:['allergene'],
    note:'Fraîcheur camphrée et rassurante, colonne des fougères.' },

  { id:'romarin', nom:'Romarin', latin:'Rosmarinus officinalis', famille:'Aromatique', role:'tete', nature:'naturelle',
    facettes:{ aromatique:.9, vert:.5 }, force:3, dose:[.5,4], tags:[],
    note:'Sec, camphré, réveille immédiatement.' },

  { id:'menthe', nom:'Menthe poivrée', latin:'Mentha piperita', famille:'Aromatique', role:'tete', nature:'naturelle',
    facettes:{ aromatique:.9, vert:.6 }, force:4, dose:[.2,2], tags:[],
    note:'Froid mordant — quelques dixièmes suffisent.' },

  { id:'basilic', nom:'Basilic', latin:'Ocimum basilicum', famille:'Aromatique', role:'tete', nature:'naturelle',
    facettes:{ aromatique:.8, vert:.7, epice_frais:.3 }, force:4, dose:[.2,2], tags:[],
    note:'Anisé, vif, légèrement insolent.' },

  { id:'galbanum', nom:'Galbanum', latin:'Ferula gummosa', famille:'Vert', role:'tete', nature:'naturelle',
    facettes:{ vert:1, resine:.4, mousse_terre:.3 }, force:5, dose:[.1,1.5], tags:['rare'],
    note:'Le vert le plus violent : tige coupée, sève amère.' },

  { id:'hexenol', nom:'Cis-3-hexénol', latin:'', famille:'Vert', role:'tete', nature:'synthese',
    facettes:{ vert:1, aquatique:.3 }, force:5, dose:[.05,.5], tags:[],
    note:'Herbe fraîchement coupée, effet « rosée ».' },

  { id:'poivre_rose', nom:'Poivre rose', latin:'Schinus molle', famille:'Épices', role:'tete', nature:'naturelle',
    facettes:{ epice_frais:.9, fruite:.5, agrumes:.3 }, force:3, dose:[.5,4], tags:[],
    note:'Piquant rosé et fruité, très moderne.' },

  { id:'cardamome', nom:'Cardamome', latin:'Elettaria cardamomum', famille:'Épices', role:'tete', nature:'naturelle',
    facettes:{ epice_frais:1, aromatique:.4, bois_cremeux:.2 }, force:3, dose:[.5,4], tags:[],
    note:'Épice claire, eucalyptée, chic.' },

  { id:'gingembre', nom:'Gingembre', latin:'Zingiber officinale', famille:'Épices', role:'tete', nature:'naturelle',
    facettes:{ epice_frais:.9, agrumes:.4, vert:.3 }, force:3, dose:[.3,3], tags:[],
    note:'Chaleur sèche et pétillante à la fois.' },

  { id:'aldehyde_c11', nom:'Aldéhyde C-11 undécylénique', latin:'', famille:'Aldéhydes', role:'tete', nature:'synthese',
    facettes:{ aldehyde:1, musc:.3 }, force:5, dose:[.05,.8], tags:[],
    note:'Le col empesé des grands classiques ; scintille et éloigne.' },

  { id:'calone', nom:'Calone 1951', latin:'', famille:'Aquatique', role:'tete', nature:'synthese',
    facettes:{ aquatique:1, fruite:.3 }, force:5, dose:[.05,1], tags:[],
    note:'Melon marin, embrun — la note « eau » des années 90.' },

  { id:'helional', nom:'Helional', latin:'', famille:'Aquatique', role:'tete', nature:'synthese',
    facettes:{ aquatique:.8, floral_blanc:.4, vert:.3 }, force:3, dose:[.5,4], tags:[],
    note:'Air après la pluie, plus doux et plus fin que la calone.' },

  { id:'the_vert', nom:'Thé vert (absolu)', latin:'Camellia sinensis', famille:'Thé', role:'tete', nature:'naturelle',
    facettes:{ the:1, vert:.5, fume:.2 }, force:3, dose:[.3,3], tags:[],
    note:'Feuille sèche, amertume tranquille.' },

  /* ---------------- CŒUR ---------------- */
  { id:'rose', nom:'Rose de mai (absolue)', latin:'Rosa centifolia', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ rose:1, miel:.4, vert:.3, floral_poudre:.3 }, force:3, dose:[1,12], tags:['allergene','couteux'],
    note:'Chair de pétale, miel et cire — jamais remplaçable.' },

  { id:'rose_damas', nom:'Rose de Damas (essence)', latin:'Rosa damascena', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ rose:1, epice_frais:.3, fruite:.3 }, force:4, dose:[.5,6], tags:['allergene','couteux'],
    note:'Plus vive et citronnée que la centifolia.' },

  { id:'geranium', nom:'Géranium bourbon', latin:'Pelargonium graveolens', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ rose:.7, vert:.5, aromatique:.4 }, force:4, dose:[.3,3], tags:['allergene'],
    note:'La rose des hommes : verte, minérale, franche.' },

  { id:'jasmin', nom:'Jasmin sambac (absolue)', latin:'Jasminum sambac', famille:'Floral blanc', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:1, fruite:.3, animal:.3 }, force:4, dose:[.5,8], tags:['couteux'],
    note:'Solaire, un peu charnel — le cœur de presque tout.' },

  { id:'tubereuse', nom:'Tubéreuse (absolue)', latin:'Polianthes tuberosa', famille:'Floral blanc', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:1, gourmand:.4, animal:.4 }, force:5, dose:[.3,5], tags:['couteux'],
    note:'Fleur narcotique, crémeuse, presque insolente.' },

  { id:'ylang', nom:'Ylang-ylang extra', latin:'Cananga odorata', famille:'Floral blanc', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:.9, fruite:.4, gourmand:.3 }, force:4, dose:[.5,6], tags:['allergene'],
    note:'Banane, cuir doux et fleur d\'ambiance tropicale.' },

  { id:'neroli', nom:'Néroli', latin:'Citrus aurantium (fleur)', famille:'Floral blanc', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:.8, agrumes:.5, vert:.3, musc:.2 }, force:3, dose:[.5,6], tags:['couteux'],
    note:'Fleur d\'oranger claire et propre, presque enfantine.' },

  { id:'fleur_oranger', nom:'Fleur d\'oranger (absolue)', latin:'Citrus aurantium', famille:'Floral blanc', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:1, miel:.4, gourmand:.3 }, force:4, dose:[.5,6], tags:['couteux'],
    note:'Version miellée et sensuelle du néroli.' },

  { id:'hedione', nom:'Hédione', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.6, vert:.4, the:.3 }, force:1, dose:[5,30], tags:[],
    note:'Transparence jasminée ; élargit et aère toute la formule.' },

  { id:'ionone', nom:'Ionone alpha (violette)', latin:'', famille:'Poudré', role:'coeur', nature:'synthese',
    facettes:{ floral_poudre:1, bois_sec:.4, fruite:.3 }, force:3, dose:[1,8], tags:[],
    note:'Violette poudrée et boisée, effet rétro immédiat.' },

  { id:'iris', nom:'Beurre d\'iris', latin:'Iris pallida', famille:'Poudré', role:'coeur', nature:'naturelle',
    facettes:{ floral_poudre:1, bois_sec:.3, mousse_terre:.3 }, force:2, dose:[.5,5], tags:['couteux','rare'],
    note:'Racine poudrée, froide, aristocratique — la matière la plus chère.' },

  { id:'osmanthus', nom:'Osmanthus (absolue)', latin:'Osmanthus fragrans', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ fruite:.8, floral_poudre:.5, cuir:.4, the:.4 }, force:3, dose:[.3,3], tags:['couteux'],
    note:'Abricot, cuir et thé — d\'une élégance rare.' },

  { id:'muguet_syn', nom:'Accord muguet (Florhydral / Lilyflore)', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.7, vert:.6, aquatique:.3 }, force:3, dose:[.5,6], tags:[],
    note:'Le muguet n\'existe qu\'en synthèse ; clarté verte et propre.' },

  { id:'lactone_peche', nom:'Gamma-undécalactone (pêche)', latin:'', famille:'Fruité', role:'coeur', nature:'synthese',
    facettes:{ fruite:1, gourmand:.5, bois_cremeux:.2 }, force:4, dose:[.2,2], tags:['gourmand'],
    note:'Peau de pêche veloutée, très enveloppante.' },

  { id:'framboise', nom:'Framboise (frambinone)', latin:'', famille:'Fruité', role:'coeur', nature:'synthese',
    facettes:{ fruite:1, gourmand:.4, rose:.3 }, force:4, dose:[.1,1.5], tags:['gourmand'],
    note:'Confiture acidulée ; épouse la rose à merveille.' },

  { id:'figue', nom:'Accord figue (stémone / octalactone)', latin:'', famille:'Fruité', role:'coeur', nature:'synthese',
    facettes:{ fruite:.8, vert:.7, bois_cremeux:.3 }, force:3, dose:[.3,3], tags:[],
    note:'Lait de figuier, feuille et fruit vert.' },

  { id:'cassis', nom:'Bourgeon de cassis', latin:'Ribes nigrum', famille:'Fruité', role:'coeur', nature:'naturelle',
    facettes:{ fruite:.9, vert:.6, animal:.3 }, force:5, dose:[.05,.6], tags:['rare'],
    note:'Fruité soufré et sauvage — puissant, à doser au dixième.' },

  { id:'sauge_sclaree', nom:'Sauge sclarée', latin:'Salvia sclarea', famille:'Aromatique', role:'coeur', nature:'naturelle',
    facettes:{ aromatique:.8, ambre:.4, the:.3, mousse_terre:.3 }, force:3, dose:[.3,3], tags:[],
    note:'Herbacé ambré, chaleur sèche — pivot des fougères modernes.' },

  { id:'immortelle', nom:'Immortelle', latin:'Helichrysum italicum', famille:'Aromatique', role:'coeur', nature:'naturelle',
    facettes:{ miel:.9, gourmand:.5, aromatique:.5, epice_chaud:.3 }, force:4, dose:[.1,1.5], tags:['rare'],
    note:'Curry, miel et foin brûlé — signature très clivante.' },

  { id:'safran', nom:'Safran', latin:'Crocus sativus', famille:'Épices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:.9, cuir:.6, miel:.3 }, force:4, dose:[.1,1.2], tags:['couteux','rare'],
    note:'Épice cuirée et métallique, très orientale contemporaine.' },

  { id:'poivre_noir', nom:'Poivre noir', latin:'Piper nigrum', famille:'Épices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:.8, bois_sec:.4, fume:.3 }, force:3, dose:[.2,2], tags:[],
    note:'Sécheresse piquante ; donne du relief aux bois.' },

  { id:'cannelle', nom:'Cannelle de Ceylan', latin:'Cinnamomum verum', famille:'Épices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:1, gourmand:.5, ambre:.3 }, force:4, dose:[.1,1], tags:['allergene'],
    note:'Chaleur sucrée et boisée ; allergène réglementé, dose faible.',
    prudence:'Cinnamaldéhyde — restriction IFRA sévère.' },

  { id:'girofle', nom:'Clou de girofle', latin:'Syzygium aromaticum', famille:'Épices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:1, cuir:.3, floral_blanc:.2 }, force:4, dose:[.1,1.5], tags:['allergene'],
    note:'Eugénol : dentaire, viril, très structurant.' },

  { id:'muscade', nom:'Noix de muscade', latin:'Myristica fragrans', famille:'Épices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:.8, bois_sec:.3, aromatique:.3 }, force:3, dose:[.2,2], tags:[],
    note:'Épice sèche et boisée, un peu poussiéreuse.' },

  { id:'cumin', nom:'Cumin', latin:'Cuminum cyminum', famille:'Épices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:.7, animal:.8 }, force:5, dose:[.02,.3], tags:['animal','rare'],
    note:'Odeur de peau, dérangeante et magnétique. Traces seulement.' },

  /* ---------------- FOND ---------------- */
  { id:'santal', nom:'Santal Mysore / Nouvelle-Calédonie', latin:'Santalum album', famille:'Bois', role:'fond', nature:'naturelle',
    facettes:{ bois_cremeux:1, musc:.4, floral_poudre:.2 }, force:3, dose:[2,15], tags:['couteux'],
    note:'Lait de bois ; consolant, rond, jamais agressif.' },

  { id:'javanol', nom:'Javanol', latin:'', famille:'Bois', role:'fond', nature:'synthese',
    facettes:{ bois_cremeux:1, musc:.3, vert:.2 }, force:5, dose:[.1,1.5], tags:[],
    note:'Santal de synthèse cristallin, tenue redoutable.' },

  { id:'cedre_atlas', nom:'Cèdre de l\'Atlas', latin:'Cedrus atlantica', famille:'Bois', role:'fond', nature:'naturelle',
    facettes:{ bois_sec:1, mousse_terre:.3, fume:.2 }, force:3, dose:[1,10], tags:[],
    note:'Crayon taillé, grenier sec.' },

  { id:'iso_e', nom:'Iso E Super', latin:'', famille:'Bois', role:'fond', nature:'synthese',
    facettes:{ bois_sec:.8, ambre:.4, musc:.3 }, force:2, dose:[3,25], tags:[],
    note:'Velours boisé transparent ; agrandit le sillage sans le durcir.' },

  { id:'vetiver', nom:'Vétiver Haïti', latin:'Chrysopogon zizanioides', famille:'Bois', role:'fond', nature:'naturelle',
    facettes:{ bois_sec:.8, mousse_terre:.9, fume:.3 }, force:4, dose:[1,10], tags:[],
    note:'Racine, terre humide et pamplemousse — noblesse rugueuse.' },

  { id:'patchouli', nom:'Patchouli (cœur)', latin:'Pogostemon cablin', famille:'Bois', role:'fond', nature:'naturelle',
    facettes:{ mousse_terre:.9, bois_sec:.5, gourmand:.3, ambre:.3 }, force:4, dose:[1,12], tags:[],
    note:'Terre, cacao et cave ; la fraction cœur évite le côté camphré.' },

  { id:'oud', nom:'Oud (bois d\'agar)', latin:'Aquilaria spp.', famille:'Bois', role:'fond', nature:'naturelle',
    facettes:{ fume:.9, animal:.7, bois_sec:.6, cuir:.5 }, force:5, dose:[.1,2], tags:['animal','couteux','rare'],
    note:'Fermenté, médicinal, immense. Réservé aux compositions assumées.' },

  { id:'mousse_chene', nom:'Mousse de chêne (Evernyl)', latin:'Evernia prunastri', famille:'Chypré', role:'fond', nature:'synthese',
    facettes:{ mousse_terre:1, fume:.3, cuir:.3 }, force:4, dose:[.2,2], tags:['allergene'],
    note:'L\'ossature du chypre ; l\'absolue naturelle est très restreinte (IFRA).',
    prudence:'Atranol / chloroatranol — utiliser une qualité conforme IFRA.' },

  { id:'encens', nom:'Encens (oliban)', latin:'Boswellia carterii', famille:'Résines', role:'fond', nature:'naturelle',
    facettes:{ resine:1, agrumes:.3, fume:.4 }, force:3, dose:[.5,6], tags:[],
    note:'Fumée sèche et citronnée, verticale, sacrée.' },

  { id:'myrrhe', nom:'Myrrhe', latin:'Commiphora myrrha', famille:'Résines', role:'fond', nature:'naturelle',
    facettes:{ resine:.9, ambre:.4, miel:.3, fume:.3 }, force:3, dose:[.3,4], tags:[],
    note:'Baume amer et médicinal, presque liturgique.' },

  { id:'labdanum', nom:'Labdanum (ciste)', latin:'Cistus ladaniferus', famille:'Résines', role:'fond', nature:'naturelle',
    facettes:{ ambre:1, resine:.7, cuir:.5, miel:.4 }, force:4, dose:[.5,6], tags:[],
    note:'Le cœur de l\'accord ambré : chaud, cuiré, un peu animal.' },

  { id:'benjoin', nom:'Benjoin du Siam', latin:'Styrax tonkinensis', famille:'Résines', role:'fond', nature:'naturelle',
    facettes:{ vanille:.8, resine:.7, ambre:.5, gourmand:.4 }, force:3, dose:[1,8], tags:['allergene'],
    note:'Résine vanillée et balsamique ; le confort même.' },

  { id:'ambroxan', nom:'Ambroxan', latin:'', famille:'Ambré', role:'fond', nature:'synthese',
    facettes:{ ambre:1, musc:.5, bois_sec:.4 }, force:5, dose:[.5,6], tags:[],
    note:'Ambre gris minéral et salé ; effet « seconde peau ».' },

  { id:'vanille', nom:'Vanille Bourbon (absolue)', latin:'Vanilla planifolia', famille:'Gourmand', role:'fond', nature:'naturelle',
    facettes:{ vanille:1, gourmand:.8, ambre:.3 }, force:3, dose:[1,10], tags:['gourmand','couteux'],
    note:'Ronde, boisée, moins sucrée que la vanilline seule.' },

  { id:'tonka', nom:'Fève tonka (absolue)', latin:'Dipteryx odorata', famille:'Gourmand', role:'fond', nature:'naturelle',
    facettes:{ gourmand:.8, vanille:.6, aromatique:.4, miel:.3 }, force:4, dose:[.5,5], tags:['gourmand','allergene'],
    note:'Coumarine : amande, foin coupé, tabac blond.' },

  { id:'cacao', nom:'Cacao (absolue)', latin:'Theobroma cacao', famille:'Gourmand', role:'fond', nature:'naturelle',
    facettes:{ gourmand:1, fume:.3, mousse_terre:.3 }, force:4, dose:[.1,1.5], tags:['gourmand'],
    note:'Amer et poudreux, pas sucré du tout.' },

  { id:'cafe', nom:'Café (absolue)', latin:'Coffea arabica', famille:'Gourmand', role:'fond', nature:'naturelle',
    facettes:{ gourmand:.7, fume:.7, bois_sec:.3 }, force:4, dose:[.1,1.5], tags:['gourmand'],
    note:'Torréfaction sombre, très reconnaissable.' },

  { id:'miel_abs', nom:'Miel (absolue) / acide phénylacétique', latin:'', famille:'Miellé', role:'fond', nature:'naturelle',
    facettes:{ miel:1, animal:.5, floral_blanc:.3 }, force:4, dose:[.05,1], tags:['animal'],
    note:'Cire, ruche et sueur douce — sensualité franche.' },

  { id:'tabac', nom:'Tabac blond (absolue)', latin:'Nicotiana tabacum', famille:'Fumé', role:'fond', nature:'naturelle',
    facettes:{ fume:.8, miel:.5, cuir:.4, gourmand:.3 }, force:4, dose:[.2,3], tags:[],
    note:'Feuille séchée, miel et foin — chaleur virile et nostalgique.' },

  { id:'cuir_iq', nom:'Accord cuir (isobutylquinoléine)', latin:'', famille:'Cuir', role:'fond', nature:'synthese',
    facettes:{ cuir:1, fume:.4, mousse_terre:.4, bois_sec:.3 }, force:5, dose:[.05,.8], tags:[],
    note:'Cuir vert et amer, tannerie ; extrêmement tenace.' },

  { id:'bouleau', nom:'Goudron de bouleau (rectifié)', latin:'Betula pendula', famille:'Fumé', role:'fond', nature:'naturelle',
    facettes:{ fume:1, cuir:.8, bois_sec:.3 }, force:5, dose:[.02,.4], tags:['rare'],
    note:'Feu de camp et cuir russe. Restriction IFRA.',
    prudence:'Utiliser uniquement une qualité rectifiée conforme IFRA.' },

  { id:'castoreum', nom:'Castoréum (reconstitution)', latin:'', famille:'Animal', role:'fond', nature:'synthese',
    facettes:{ animal:1, cuir:.7, fume:.4, miel:.3 }, force:5, dose:[.05,.8], tags:['animal'],
    note:'Cuir animal, chaud, un peu sale — reconstitution sans matière animale.' },

  { id:'muscone', nom:'Muscs blancs (Habanolide / Galaxolide)', latin:'', famille:'Musqué', role:'fond', nature:'synthese',
    facettes:{ musc:1, floral_poudre:.3 }, force:3, dose:[3,25], tags:[],
    note:'Peau propre, linge sec ; le liant de presque toute formule moderne.' },

  { id:'ambrette', nom:'Graine d\'ambrette', latin:'Abelmoschus moschatus', famille:'Musqué', role:'fond', nature:'naturelle',
    facettes:{ musc:1, floral_poudre:.4, animal:.3, fruite:.2 }, force:3, dose:[.5,5], tags:['couteux'],
    note:'Le seul musc végétal : poire, peau, poudre.' },

  { id:'foin', nom:'Foin (absolue)', latin:'', famille:'Aromatique', role:'fond', nature:'naturelle',
    facettes:{ mousse_terre:.6, gourmand:.4, aromatique:.5, fume:.3 }, force:4, dose:[.1,1.5], tags:[],
    note:'Herbe séchée, coumarine naturelle, campagne d\'août.' },

  { id:'ambre_gris_acc', nom:'Accord ambre gris (Ambrettolide + Cétalox)', latin:'', famille:'Ambré', role:'fond', nature:'synthese',
    facettes:{ ambre:.8, musc:.7, aquatique:.4 }, force:4, dose:[.5,6], tags:[],
    note:'Salin, minéral, marin-chaud : la peau au soleil.' },

  /* ---- matières d'atelier courantes, hors palette classique ---- */

  { id:'acetate_amyle', nom:'Acétate d\'amyle', latin:'', famille:'Fruité', role:'tete', nature:'synthese',
    facettes:{ fruite:1, gourmand:.3 }, force:4, dose:[.05,.6], tags:[],
    note:'Banane et bonbon anglais : un fruité franc, sans détour.' },

  { id:'aldehyde_c16', nom:'Aldéhyde C-16 (fraise)', latin:'', famille:'Fruité', role:'coeur', nature:'synthese',
    facettes:{ fruite:1, gourmand:.5 }, force:4, dose:[.1,1], tags:['gourmand'],
    note:'Fraise confite — sucré, rond, un peu barbe à papa.' },

  { id:'furanone', nom:'Furanéol (furanone fraise)', latin:'', famille:'Gourmand', role:'coeur', nature:'synthese',
    facettes:{ gourmand:1, fruite:.9, miel:.4 }, force:5, dose:[.01,.2], tags:['gourmand'],
    note:'Fraise chaude et caramel — envahissant, à doser au centième.' },

  { id:'damascone_delta', nom:'Damascone delta', latin:'', famille:'Fruité', role:'coeur', nature:'synthese',
    facettes:{ fruite:.9, rose:.7, the:.3 }, force:5, dose:[.02,.3], tags:[],
    note:'Pomme et rose froissées ; illumine une formule d\'une trace.' },

  { id:'methyl_anthranilate', nom:'Méthyl anthranilate', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.7, fruite:.5, animal:.3 }, force:4, dose:[.05,.8], tags:[],
    note:'Fleur d\'oranger et raisin : suave, un peu entêtant.' },

  { id:'heliotropine', nom:'Héliotropine (héliotrope)', latin:'', famille:'Poudré', role:'coeur', nature:'synthese',
    facettes:{ floral_poudre:.9, vanille:.5, gourmand:.3 }, force:3, dose:[.5,5], tags:[],
    note:'Amande poudrée et fleur de cerisier — le confort d\'un talc ancien.' },

  { id:'muguet_aldehyde', nom:'Muguet aldéhydé', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.8, vert:.5, aquatique:.3 }, force:4, dose:[.2,2], tags:[],
    note:'Le muguet des aldéhydes : clair, propre, un peu savonneux.',
    prudence:'Plusieurs muguets aldéhydés (Lilial, Lyral) sont désormais interdits — vérifier la molécule exacte du flacon.' },

  { id:'lyral', nom:'Lyral', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.8, vert:.4, floral_poudre:.3 }, force:4, dose:[.2,2], tags:['allergene'],
    note:'Muguet crémeux et tenace, longtemps incontournable.',
    prudence:'Interdit en parfumerie fine (IFRA, amendement 49) — à ne plus utiliser en formule destinée à la peau.' },

  { id:'narcisse', nom:'Narcisse (absolue)', latin:'Narcissus poeticus', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:.7, miel:.5, vert:.5, animal:.3 }, force:4, dose:[.1,1.5], tags:['couteux','rare'],
    note:'Foin vert, miel et cuir léger — une fleur qui sent le pré.' },

  { id:'oeillet', nom:'Œillet', latin:'Dianthus caryophyllus', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:.8, floral_poudre:.5, rose:.4 }, force:4, dose:[.2,2], tags:['allergene'],
    note:'Poivre, girofle et pétale : la fleur des boutonnières.' },

  { id:'linalol', nom:'Linalol', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.5, aromatique:.5, vert:.3, agrumes:.2 }, force:2, dose:[1,10], tags:['allergene'],
    note:'Fleur fraîche et bois clair ; un liant discret, presque partout.' },

  { id:'angelique', nom:'Angélique (racine)', latin:'Angelica archangelica', famille:'Aromatique', role:'coeur', nature:'naturelle',
    facettes:{ vert:.6, aromatique:.6, mousse_terre:.5, epice_frais:.4 }, force:4, dose:[.1,1], tags:['couteux','rare'],
    note:'Racine froide, musquée et terreuse — étrange et racée.',
    prudence:'Photosensibilisante.' },

  { id:'cedre_feuille', nom:'Cèdre feuille', latin:'Thuja occidentalis', famille:'Vert', role:'tete', nature:'naturelle',
    facettes:{ vert:.8, aromatique:.6, bois_sec:.4 }, force:4, dose:[.1,1], tags:[],
    note:'Conifère écrasé entre les doigts : vert, camphré, mordant.',
    prudence:'Riche en thuyone — usage restreint, doses très faibles.' },

  { id:'davana', nom:'Davana', latin:'Artemisia pallens', famille:'Fruité', role:'coeur', nature:'naturelle',
    facettes:{ fruite:.8, miel:.5, the:.3, bois_sec:.3 }, force:4, dose:[.1,1], tags:['rare'],
    note:'Fruit sec et rhum ambré ; change de visage selon la peau.' },

  { id:'tilleul', nom:'Tilleul (absolue)', latin:'Tilia cordata', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:.6, miel:.5, the:.4, vert:.3 }, force:3, dose:[.2,2], tags:['couteux'],
    note:'Fleur de tilleul et infusion tiède — un été de village.' },

  { id:'lotus', nom:'Lotus', latin:'Nelumbo nucifera', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.6, aquatique:.5, the:.4, floral_poudre:.3 }, force:3, dose:[.3,3], tags:[],
    note:'Fleur d\'eau, fraîche et poudrée à la fois.' },

  { id:'jasmin_grandiflorum', nom:'Jasmin grandiflorum (absolue)', latin:'Jasminum grandiflorum', famille:'Floral blanc', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:1, animal:.3, fruite:.3, the:.2 }, force:4, dose:[.5,8], tags:['couteux'],
    note:'Plus vert et plus indolé que le sambac ; le jasmin de Grasse.' },

  { id:'safranal', nom:'Safranal', latin:'', famille:'Épices', role:'coeur', nature:'synthese',
    facettes:{ epice_chaud:.8, cuir:.5, miel:.3 }, force:5, dose:[.02,.3], tags:[],
    note:'Le cœur métallique et cuiré du safran, sans son prix.' },

  { id:'nerol', nom:'Nérol', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ rose:.8, agrumes:.4, vert:.3 }, force:3, dose:[.5,5], tags:[],
    note:'Rose fraîche et citronnée — à ne pas confondre avec le néroli.' },

  { id:'methyl_ionone', nom:'Méthyl ionone alpha', latin:'', famille:'Poudré', role:'coeur', nature:'synthese',
    facettes:{ floral_poudre:1, bois_sec:.4, rose:.3 }, force:3, dose:[1,10], tags:[],
    note:'Violette poudrée et boisée, plus douce et plus tenace que l\'ionone.' },

  { id:'curcuma', nom:'Curcuma', latin:'Curcuma longa', famille:'Épices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:.7, bois_sec:.4, vert:.3 }, force:4, dose:[.05,.5], tags:[],
    note:'Racine chaude et poussiéreuse, un peu médicinale.' }
];

/* ------------------------------------------------------------------ */
/* 5. Curseurs sensoriels                                              */
/* ------------------------------------------------------------------ */
/* effet : facettes poussées quand le curseur va vers +1 (et retirées
   quand il va vers -1), pondérées par la valeur du curseur.           */

const CURSEURS = [
  { id:'lumiere', gauche:'Sombre', droite:'Lumineux',
    effet:{ agrumes:.6, aldehyde:.4, floral_blanc:.3, aquatique:.3, vert:.2,
            resine:-.4, fume:-.5, cuir:-.4, animal:-.3, mousse_terre:-.3 } },
  { id:'temperature', gauche:'Frais', droite:'Chaud',
    effet:{ ambre:.7, epice_chaud:.6, vanille:.5, resine:.4, miel:.3, gourmand:.3,
            agrumes:-.5, aquatique:-.6, vert:-.4, aromatique:-.2 } },
  { id:'presence', gauche:'Discret', droite:'Enveloppant',
    effet:{ musc:.3, ambre:.4, bois_cremeux:.3, floral_blanc:.3, resine:.2 } },
  { id:'caractere', gauche:'Classique', droite:'Singulier',
    effet:{ animal:.5, fume:.5, cuir:.4, mousse_terre:.3, epice_chaud:.3,
            floral_blanc:-.1, musc:-.2 } },
  { id:'texture', gauche:'Sec', droite:'Velouté',
    effet:{ bois_cremeux:.7, floral_poudre:.6, vanille:.4, musc:.4, gourmand:.3,
            bois_sec:-.5, vert:-.3, aldehyde:-.2 } }
];

/* Exclusions proposées au client (allergies, dégoûts, convictions) */
const EXCLUSIONS = [
  { id:'animal',    nom:'Notes animales',            tags:['animal'] },
  { id:'gourmand',  nom:'Notes sucrées / gourmandes', tags:['gourmand'] },
  { id:'allergene', nom:'Allergènes réglementés fréquents', tags:['allergene'] },
  { id:'couteux',   nom:'Matières très coûteuses',   tags:['couteux'] },
  { id:'synthese',  nom:'Molécules de synthèse (tout naturel)', nature:'synthese' }
];

/* Concentrations usuelles (part de concentré dans l'alcool) */
const CONCENTRATIONS = [
  { id:'edt',     nom:'Eau de toilette', plage:'8–12 %',  tenue:'3 à 5 h' },
  { id:'edp',     nom:'Eau de parfum',   plage:'15–20 %', tenue:'6 à 8 h' },
  { id:'extrait', nom:'Extrait',         plage:'22–30 %', tenue:'8 h et plus' }
];
