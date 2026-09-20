/* Data for the olfactory engine: facets, emotions, lexicon, raw materials.
   Everything is loaded in plain script tags (no fetch) so the application works
   from a local file as well as from GitHub Pages.

   English edition. Identifiers (facet keys, emotion ids, material ids, roles,
   natures, tags) are shared with the French edition, so a palette entered in
   one language is understood by the other. Only the visible names change. */

/* ------------------------------------------------------------------ */
/* 1. Olfactory facets — the shared vocabulary between emotion and matter */
/* ------------------------------------------------------------------ */

const FACETTES = {
  agrumes:      'Citrus',
  vert:         'Green / vegetal',
  aromatique:   'Aromatic',
  aldehyde:     'Aldehydic',
  aquatique:    'Aquatic / ozonic',
  floral_blanc: 'White floral',
  floral_poudre:'Powdery floral',
  rose:         'Rosy',
  fruite:       'Fruity',
  the:          'Tea / infused',
  epice_frais:  'Fresh spices',
  epice_chaud:  'Warm spices',
  miel:         'Honeyed',
  gourmand:     'Gourmand',
  vanille:      'Vanillic',
  bois_sec:     'Dry woods',
  bois_cremeux: 'Creamy woods',
  resine:       'Resins / incense',
  ambre:        'Amber',
  mousse_terre: 'Moss / earth',
  cuir:         'Leather',
  fume:         'Smoky',
  animal:       'Animalic',
  musc:         'Musky'
};

/* ------------------------------------------------------------------ */
/* 2. Emotions offered to the client                                   */
/* ------------------------------------------------------------------ */
/* poids: contribution of the emotion to the facet vector (0 to 1).    */

const EMOTIONS = [
  {
    id: 'serenite', nom: 'Serenity', icone: '🕊️',
    phrase: 'The calm after the storm, the breath slowing down.',
    poids: { aromatique: .8, the: .7, musc: .6, floral_poudre: .4, bois_cremeux: .4, vert: .3 }
  },
  {
    id: 'nostalgie', nom: 'Nostalgia', icone: '🕰️',
    phrase: 'A place, a season, someone who is no longer there.',
    poids: { floral_poudre: .9, mousse_terre: .6, vanille: .5, miel: .4, resine: .4, bois_sec: .3 }
  },
  {
    id: 'tendresse', nom: 'Tenderness', icone: '🤍',
    phrase: 'The softness of a skin, a gesture, a piece of cloth.',
    poids: { musc: .9, floral_poudre: .7, vanille: .5, floral_blanc: .4, bois_cremeux: .4 }
  },
  {
    id: 'desir', nom: 'Desire', icone: '🔥',
    phrase: 'Rising warmth, anticipation, closeness.',
    poids: { animal: .8, floral_blanc: .8, ambre: .7, miel: .5, epice_chaud: .5, musc: .5 }
  },
  {
    id: 'audace', nom: 'Boldness', icone: '⚡',
    phrase: 'To dare, to cut through, to be noticed.',
    poids: { cuir: .8, epice_chaud: .7, fume: .6, bois_sec: .5, aldehyde: .4, resine: .4 }
  },
  {
    id: 'force', nom: 'Inner strength', icone: '🗿',
    phrase: 'Standing tall. The backbone.',
    poids: { bois_sec: .9, mousse_terre: .6, resine: .5, cuir: .4, epice_chaud: .3 }
  },
  {
    id: 'joie', nom: 'Joy', icone: '☀️',
    phrase: 'Open laughter, morning light.',
    poids: { agrumes: 1, fruite: .7, floral_blanc: .5, aldehyde: .4, vert: .3 }
  },
  {
    id: 'melancolie', nom: 'Melancholy', icone: '🌧️',
    phrase: 'A beautiful sadness, held at a distance.',
    poids: { mousse_terre: .8, floral_poudre: .6, the: .5, resine: .5, bois_sec: .4, fume: .3 }
  },
  {
    id: 'liberte', nom: 'Freedom', icone: '🌬️',
    phrase: 'The open air, the open road, nothing holding you back.',
    poids: { aquatique: .9, vert: .7, agrumes: .6, aromatique: .5, musc: .3 }
  },
  {
    id: 'mystere', nom: 'Mystery', icone: '🌑',
    phrase: 'What goes unsaid. A chosen shadow.',
    poids: { resine: .8, fume: .7, bois_sec: .6, cuir: .5, epice_chaud: .5, animal: .4 }
  },
  {
    id: 'reconfort', nom: 'Comfort', icone: '🧣',
    phrase: 'Coming home, wool, the table laid.',
    poids: { gourmand: .9, vanille: .8, ambre: .6, epice_chaud: .5, bois_cremeux: .4, miel: .4 }
  },
  {
    id: 'elan', nom: 'Drive / vitality', icone: '🏃',
    phrase: 'The energy of setting off, the body answering.',
    poids: { epice_frais: .8, agrumes: .7, aromatique: .6, vert: .5, aquatique: .3 }
  },
  {
    id: 'purete', nom: 'Purity / renewal', icone: '🌱',
    phrase: 'Starting clean. Linen, rain, a blank page.',
    poids: { musc: .8, vert: .7, aquatique: .6, aldehyde: .5, floral_blanc: .4 }
  },
  {
    id: 'opulence', nom: 'Opulence', icone: '👑',
    phrase: 'The party, abundance, the rustle of a gown.',
    poids: { floral_blanc: .8, ambre: .7, rose: .6, epice_chaud: .5, aldehyde: .5, resine: .4 }
  },
  {
    id: 'recueillement', nom: 'Contemplation', icone: '🕯️',
    phrase: 'The silence of a nave, something larger than oneself.',
    poids: { resine: 1, fume: .6, bois_sec: .5, the: .4, floral_poudre: .3 }
  },
  {
    id: 'insouciance', nom: 'Lightheartedness', icone: '🍑',
    phrase: 'Childhood, holidays, thinking of nothing at all.',
    poids: { fruite: .9, gourmand: .6, agrumes: .5, floral_blanc: .4, vanille: .4 }
  }
];

/* ------------------------------------------------------------------ */
/* 3. Lexicon — recognising words in the client's story               */
/* ------------------------------------------------------------------ */
/* Each entry: keywords (lowercase) -> suggested emotions and/or facets
   evoked directly. Words are matched at word boundaries, with the usual
   English endings tolerated (rain, rains, rained, raining, rainy) — see
   analyserRecit in moteur.js. Multi-word keys are allowed.            */

const LEXIQUE = [
  { mots: ['calm','peace','peaceful','soothe','soothing','serene','serenity','quiet','tranquil','silence','breathe','breath','unhurried'], emotions: ['serenite'] },
  { mots: ['memory','memories','childhood','grandmother','grandfather','grandma','grandpa','long ago','back then','remember','used to','miss','gone','once upon'], emotions: ['nostalgie'] },
  { mots: ['tender','tenderness','soft','softness','caress','skin','baby','cocoon','mom','mum','mother','affection','gentle','cuddle','embrace'], emotions: ['tendresse'] },
  { mots: ['desire','sensual','love','seduction','seductive','night','kiss','passion','passionate','erotic','lover','longing','intimate'], emotions: ['desir'] },
  { mots: ['bold','boldness','dare','daring','provoke','provocative','noticed','assert','rebel','rebellious','frank','stand out','fearless','defiant'], emotions: ['audace'] },
  { mots: ['strength','strong','solid','courage','hold','stable','anchor','sturdy','determination','determined','steady','backbone','rooted','resilient'], emotions: ['force'] },
  { mots: ['joy','joyful','laugh','laughter','happy','happiness','sun','sunny','sunshine','sunlight','light','bright','sparkling','cheerful','radiant'], emotions: ['joie'] },
  { mots: ['sad','sadness','melancholy','melancholic','rain','grey','gray','absence','absent','grief','mourning','regret','autumn','wistful','bittersweet'], emotions: ['melancolie'] },
  { mots: ['freedom','free','travel','road','wind','sea','ocean','open air','open road','wide open','horizon','mountain','journey','escape','sail'], emotions: ['liberte'] },
  { mots: ['mystery','mysterious','secret','shadow','enigma','hidden','deep','dark','obscure','veil','unsaid'], emotions: ['mystere'] },
  { mots: ['comfort','comforting','warmth','home','wool','fire','fireplace','hearth','cake','winter','blanket','cozy','cosy','soup','bread','sweater'], emotions: ['reconfort'] },
  { mots: ['energy','energetic','sport','morning','lively','dynamic','running','race','momentum','vigor','vigour','alive','awake','sprint','set off','take off'], emotions: ['elan'] },
  { mots: ['clean','brand new','pure','purity','linen','white','start over','start again','anew','renewal','renew','fresh','shower','crisp','soap','laundry','blank page'], emotions: ['purete'] },
  { mots: ['party','luxury','luxurious','evening','gala','rich','abundance','gown','dress','celebration','velvet','gold','golden','champagne','jewel','opulent','lavish'], emotions: ['opulence'] },
  { mots: ['prayer','pray','church','sacred','incense','spiritual','meditation','meditate','soul','chapel','cathedral','monastery','temple','silence','solemn'], emotions: ['recueillement'] },
  { mots: ['holiday','holidays','vacation','carefree','light-hearted','lighthearted','play','beach','summer','picnic','no worries','without a care','ice cream','childhood games'], emotions: ['insouciance'] },

  // Words that name a material or a facet directly
  { mots: ['citrus','lemon','orange','grapefruit','bergamot','mandarin','tangerine','zest','lime','yuzu'],            facettes: { agrumes: .9 } },
  { mots: ['grass','lawn','leaf','leaves','forest','green','stem','sap','garden','foliage','ivy','hedge'],            facettes: { vert: .8 } },
  { mots: ['lavender','rosemary','mint','thyme','scrubland','herbs','herb','sage','eucalyptus','maquis','garrigue'],  facettes: { aromatique: .8 } },
  { mots: ['sea','salt','sea spray','ocean spray','marine','rain','ozone','wave','water','ocean','lake','river','seaside','shore','tide'], facettes: { aquatique: .9 } },
  { mots: ['jasmine','tuberose','orange blossom','white flower','white flowers','magnolia','lily of the valley','gardenia','neroli'], facettes: { floral_blanc: .9 } },
  { mots: ['rose','roses','peony','petal'],                                                                           facettes: { rose: .9 } },
  { mots: ['powder','powdery','iris','orris','violet','makeup','make-up','talc','lipstick','face powder'],            facettes: { floral_poudre: .9 } },
  { mots: ['fruit','peach','pear','raspberry','fig','apple','apricot','blackcurrant','cassis','berry','berries','plum','cherry','mango','melon'], facettes: { fruite: .9 } },
  { mots: ['tea','matcha','infusion','herbal tea','green tea','earl grey','chai','brew'],                             facettes: { the: .9 } },
  { mots: ['pepper','ginger','cardamom','coriander','pink pepper','peppercorn'],                                      facettes: { epice_frais: .8 } },
  { mots: ['cinnamon','clove','cloves','nutmeg','saffron','curry','spice','spicy','cumin','turmeric','gingerbread'],  facettes: { epice_chaud: .8 } },
  { mots: ['honey','wax','beeswax','hive','bee','bees','honeycomb','mead'],                                           facettes: { miel: .9 } },
  { mots: ['vanilla','gourmand','caramel','sugar','chocolate','cocoa','praline','biscuit','cookie','cookies','candy','sweets','dessert','pastry','custard','toffee','marshmallow'], facettes: { gourmand: .8, vanille: .6 } },
  { mots: ['coffee','espresso','roasted','roast','mocha','latte'],                                                    facettes: { gourmand: .6, fume: .5 } },
  { mots: ['wood','wooden','woody','cedar','cedarwood','vetiver','dry','dried','pencil','shavings','sawdust','timber','plank'], facettes: { bois_sec: .9 } },
  { mots: ['sandalwood','sandal','milk','cream','creamy','smooth','velvet','velvety','silky','silk'],                 facettes: { bois_cremeux: .8 } },
  { mots: ['incense','resin','myrrh','frankincense','olibanum','balm','balsam','benzoin','labdanum'],                 facettes: { resine: .9 } },
  { mots: ['amber','ambery','warm','hot','heat','solar','sun-warmed','sunbaked','sand','sunset'],                     facettes: { ambre: .8 } },
  { mots: ['moss','mossy','earth','earthy','humus','mushroom','undergrowth','forest floor','stone','damp','soil','mud','petrichor','cellar'], facettes: { mousse_terre: .9 } },
  { mots: ['leather','jacket','saddle','tannery','boot','boots','suede'],                                             facettes: { cuir: .9 } },
  { mots: ['smoke','smoky','smokey','wood fire','bonfire','campfire','tobacco','ember','embers','tar','ash','ashes','chimney','cigar','burnt','burning'], facettes: { fume: .9 } },
  { mots: ['animal','animalic','bare skin','fur','wild','flesh','musk','musky','sweat','naked'],                      facettes: { animal: .7, musc: .6 } },
  { mots: ['clean','cotton','sheets','fresh laundry','laundry','linen','soap','dryer','clean skin','fabric softener','detergent'], facettes: { musc: .9 } }
];

/* ------------------------------------------------------------------ */
/* 4. Raw materials                                                    */
/* ------------------------------------------------------------------ */
/* role   : tete (top) | coeur (heart) | fond (base)
   dose   : indicative range in % of the concentrate (to be validated by the perfumer)
   force  : odour strength, 1 (discreet) to 5 (formidable) — moderates the dose
   tags   : exclusion filters (animal, gourmand, allergene, rare, couteux…)
   nature : naturelle (natural) | synthese (synthetic)                   */

const MATIERES = [
  /* ---------------- TOP ---------------- */
  { id:'bergamote', nom:'Bergamot', latin:'Citrus bergamia', famille:'Citrus', role:'tete', nature:'naturelle',
    facettes:{ agrumes:1, vert:.3, aromatique:.2 }, force:2, dose:[3,15], tags:['photosensible'],
    note:'The most elegant of zests: bitter, floral, instantly luminous.',
    prudence:'Photosensitising — prefer an FCF (bergapten-free) quality.' },

  { id:'citron', nom:'Lemon', latin:'Citrus limon', famille:'Citrus', role:'tete', nature:'naturelle',
    facettes:{ agrumes:1, vert:.2 }, force:2, dose:[2,10], tags:[],
    note:'Clean, sharp brightness, highly volatile.' },

  { id:'pamplemousse', nom:'Grapefruit', latin:'Citrus paradisi', famille:'Citrus', role:'tete', nature:'naturelle',
    facettes:{ agrumes:.9, fruite:.4, vert:.3 }, force:2, dose:[2,10], tags:[],
    note:'Sparkling bitterness, slightly sulphurous, very cheerful.' },

  { id:'mandarine', nom:'Green mandarin', latin:'Citrus reticulata', famille:'Citrus', role:'tete', nature:'naturelle',
    facettes:{ agrumes:.9, fruite:.5, floral_blanc:.2 }, force:2, dose:[2,10], tags:[],
    note:'The most tender of the citruses — sweet, childlike.' },

  { id:'petitgrain', nom:'Petitgrain bigarade', latin:'Citrus aurantium (leaves)', famille:'Citrus', role:'tete', nature:'naturelle',
    facettes:{ agrumes:.6, vert:.7, aromatique:.5 }, force:3, dose:[1,6], tags:[],
    note:'Bitter leaf and cologne: clean, a touch nervous.' },

  { id:'lavande', nom:'Lavender', latin:'Lavandula angustifolia', famille:'Aromatic', role:'tete', nature:'naturelle',
    facettes:{ aromatique:1, floral_poudre:.3, vert:.3 }, force:3, dose:[1,8], tags:['allergene'],
    note:'Camphoraceous, reassuring freshness; the backbone of the fougère.' },

  { id:'romarin', nom:'Rosemary', latin:'Rosmarinus officinalis', famille:'Aromatic', role:'tete', nature:'naturelle',
    facettes:{ aromatique:.9, vert:.5 }, force:3, dose:[.5,4], tags:[],
    note:'Dry, camphoraceous, wakes you up at once.' },

  { id:'menthe', nom:'Peppermint', latin:'Mentha piperita', famille:'Aromatic', role:'tete', nature:'naturelle',
    facettes:{ aromatique:.9, vert:.6 }, force:4, dose:[.2,2], tags:[],
    note:'Biting cold — a few tenths of a percent are enough.' },

  { id:'basilic', nom:'Basil', latin:'Ocimum basilicum', famille:'Aromatic', role:'tete', nature:'naturelle',
    facettes:{ aromatique:.8, vert:.7, epice_frais:.3 }, force:4, dose:[.2,2], tags:[],
    note:'Anisic, lively, slightly insolent.' },

  { id:'galbanum', nom:'Galbanum', latin:'Ferula gummosa', famille:'Green', role:'tete', nature:'naturelle',
    facettes:{ vert:1, resine:.4, mousse_terre:.3 }, force:5, dose:[.1,1.5], tags:['rare'],
    note:'The most violent of greens: cut stem, bitter sap.' },

  { id:'hexenol', nom:'Cis-3-hexenol', latin:'', famille:'Green', role:'tete', nature:'synthese',
    facettes:{ vert:1, aquatique:.3 }, force:5, dose:[.05,.5], tags:[],
    note:'Freshly cut grass, a “dew” effect.' },

  { id:'poivre_rose', nom:'Pink pepper', latin:'Schinus molle', famille:'Spices', role:'tete', nature:'naturelle',
    facettes:{ epice_frais:.9, fruite:.5, agrumes:.3 }, force:3, dose:[.5,4], tags:[],
    note:'Rosy, fruity bite, very modern.' },

  { id:'cardamome', nom:'Cardamom', latin:'Elettaria cardamomum', famille:'Spices', role:'tete', nature:'naturelle',
    facettes:{ epice_frais:1, aromatique:.4, bois_cremeux:.2 }, force:3, dose:[.5,4], tags:[],
    note:'A bright, eucalyptus-tinged spice, very chic.' },

  { id:'gingembre', nom:'Ginger', latin:'Zingiber officinale', famille:'Spices', role:'tete', nature:'naturelle',
    facettes:{ epice_frais:.9, agrumes:.4, vert:.3 }, force:3, dose:[.3,3], tags:[],
    note:'Dry heat and sparkle at once.' },

  { id:'aldehyde_c11', nom:'Aldehyde C-11 undecylenic', latin:'', famille:'Aldehydes', role:'tete', nature:'synthese',
    facettes:{ aldehyde:1, musc:.3 }, force:5, dose:[.05,.8], tags:[],
    note:'The starched collar of the great classics; it glitters and keeps its distance.' },

  { id:'calone', nom:'Calone 1951', latin:'', famille:'Aquatic', role:'tete', nature:'synthese',
    facettes:{ aquatique:1, fruite:.3 }, force:5, dose:[.05,1], tags:[],
    note:'Marine melon, sea spray — the “water” note of the nineties.' },

  { id:'helional', nom:'Helional', latin:'', famille:'Aquatic', role:'tete', nature:'synthese',
    facettes:{ aquatique:.8, floral_blanc:.4, vert:.3 }, force:3, dose:[.5,4], tags:[],
    note:'Air after the rain, softer and finer than Calone.' },

  { id:'the_vert', nom:'Green tea (absolute)', latin:'Camellia sinensis', famille:'Tea', role:'tete', nature:'naturelle',
    facettes:{ the:1, vert:.5, fume:.2 }, force:3, dose:[.3,3], tags:[],
    note:'Dry leaf, quiet bitterness.' },

  /* ---------------- HEART ---------------- */
  { id:'rose', nom:'Rose de Mai (absolute)', latin:'Rosa centifolia', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ rose:1, miel:.4, vert:.3, floral_poudre:.3 }, force:3, dose:[1,12], tags:['allergene','couteux'],
    note:'Petal flesh, honey and wax — never replaceable.' },

  { id:'rose_damas', nom:'Damask rose (essential oil)', latin:'Rosa damascena', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ rose:1, epice_frais:.3, fruite:.3 }, force:4, dose:[.5,6], tags:['allergene','couteux'],
    note:'Livelier and more lemony than the centifolia.' },

  { id:'geranium', nom:'Bourbon geranium', latin:'Pelargonium graveolens', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ rose:.7, vert:.5, aromatique:.4 }, force:4, dose:[.3,3], tags:['allergene'],
    note:'The rose for men: green, mineral, forthright.' },

  { id:'jasmin', nom:'Jasmine sambac (absolute)', latin:'Jasminum sambac', famille:'White floral', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:1, fruite:.3, animal:.3 }, force:4, dose:[.5,8], tags:['couteux'],
    note:'Solar, a little carnal — the heart of almost everything.' },

  { id:'tubereuse', nom:'Tuberose (absolute)', latin:'Polianthes tuberosa', famille:'White floral', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:1, gourmand:.4, animal:.4 }, force:5, dose:[.3,5], tags:['couteux'],
    note:'A narcotic, creamy, almost insolent flower.' },

  { id:'ylang', nom:'Ylang-ylang extra', latin:'Cananga odorata', famille:'White floral', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:.9, fruite:.4, gourmand:.3 }, force:4, dose:[.5,6], tags:['allergene'],
    note:'Banana, soft leather and the flower of a tropical evening.' },

  { id:'neroli', nom:'Neroli', latin:'Citrus aurantium (flower)', famille:'White floral', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:.8, agrumes:.5, vert:.3, musc:.2 }, force:3, dose:[.5,6], tags:['couteux'],
    note:'Bright, clean orange blossom, almost childlike.' },

  { id:'fleur_oranger', nom:'Orange blossom (absolute)', latin:'Citrus aurantium', famille:'White floral', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:1, miel:.4, gourmand:.3 }, force:4, dose:[.5,6], tags:['couteux'],
    note:'The honeyed, sensual version of neroli.' },

  { id:'hedione', nom:'Hedione', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.6, vert:.4, the:.3 }, force:1, dose:[5,30], tags:[],
    note:'Jasmine-like transparency; widens and airs the whole formula.' },

  { id:'ionone', nom:'Alpha-ionone (violet)', latin:'', famille:'Powdery', role:'coeur', nature:'synthese',
    facettes:{ floral_poudre:1, bois_sec:.4, fruite:.3 }, force:3, dose:[1,8], tags:[],
    note:'Powdery, woody violet — an instant retro effect.' },

  { id:'iris', nom:'Orris butter', latin:'Iris pallida', famille:'Powdery', role:'coeur', nature:'naturelle',
    facettes:{ floral_poudre:1, bois_sec:.3, mousse_terre:.3 }, force:2, dose:[.5,5], tags:['couteux','rare'],
    note:'Powdery, cold, aristocratic root — the most expensive material of all.' },

  { id:'osmanthus', nom:'Osmanthus (absolute)', latin:'Osmanthus fragrans', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ fruite:.8, floral_poudre:.5, cuir:.4, the:.4 }, force:3, dose:[.3,3], tags:['couteux'],
    note:'Apricot, leather and tea — of rare elegance.' },

  { id:'muguet_syn', nom:'Lily of the valley accord (Florhydral / Lilyflore)', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.7, vert:.6, aquatique:.3 }, force:3, dose:[.5,6], tags:[],
    note:'Lily of the valley exists only in synthesis; green, clean clarity.' },

  { id:'lactone_peche', nom:'Gamma-undecalactone (peach)', latin:'', famille:'Fruity', role:'coeur', nature:'synthese',
    facettes:{ fruite:1, gourmand:.5, bois_cremeux:.2 }, force:4, dose:[.2,2], tags:['gourmand'],
    note:'Velvety peach skin, very enveloping.' },

  { id:'framboise', nom:'Raspberry (frambinone)', latin:'', famille:'Fruity', role:'coeur', nature:'synthese',
    facettes:{ fruite:1, gourmand:.4, rose:.3 }, force:4, dose:[.1,1.5], tags:['gourmand'],
    note:'Tart jam; marries the rose wonderfully.' },

  { id:'figue', nom:'Fig accord (stemone / octalactone)', latin:'', famille:'Fruity', role:'coeur', nature:'synthese',
    facettes:{ fruite:.8, vert:.7, bois_cremeux:.3 }, force:3, dose:[.3,3], tags:[],
    note:'Fig-tree milk, leaf and green fruit.' },

  { id:'cassis', nom:'Blackcurrant bud', latin:'Ribes nigrum', famille:'Fruity', role:'coeur', nature:'naturelle',
    facettes:{ fruite:.9, vert:.6, animal:.3 }, force:5, dose:[.05,.6], tags:['rare'],
    note:'Sulphurous, wild fruitiness — powerful, dosed in tenths of a percent.' },

  { id:'sauge_sclaree', nom:'Clary sage', latin:'Salvia sclarea', famille:'Aromatic', role:'coeur', nature:'naturelle',
    facettes:{ aromatique:.8, ambre:.4, the:.3, mousse_terre:.3 }, force:3, dose:[.3,3], tags:[],
    note:'Ambery herbaceous, dry warmth — the pivot of the modern fougère.' },

  { id:'immortelle', nom:'Immortelle', latin:'Helichrysum italicum', famille:'Aromatic', role:'coeur', nature:'naturelle',
    facettes:{ miel:.9, gourmand:.5, aromatique:.5, epice_chaud:.3 }, force:4, dose:[.1,1.5], tags:['rare'],
    note:'Curry, honey and burnt hay — a highly divisive signature.' },

  { id:'safran', nom:'Saffron', latin:'Crocus sativus', famille:'Spices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:.9, cuir:.6, miel:.3 }, force:4, dose:[.1,1.2], tags:['couteux','rare'],
    note:'Leathery, metallic spice — very contemporary oriental.' },

  { id:'poivre_noir', nom:'Black pepper', latin:'Piper nigrum', famille:'Spices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:.8, bois_sec:.4, fume:.3 }, force:3, dose:[.2,2], tags:[],
    note:'Biting dryness; gives relief to the woods.' },

  { id:'cannelle', nom:'Ceylon cinnamon', latin:'Cinnamomum verum', famille:'Spices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:1, gourmand:.5, ambre:.3 }, force:4, dose:[.1,1], tags:['allergene'],
    note:'Sweet, woody warmth; a regulated allergen, kept at a low dose.',
    prudence:'Cinnamaldehyde — severe IFRA restriction.' },

  { id:'girofle', nom:'Clove', latin:'Syzygium aromaticum', famille:'Spices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:1, cuir:.3, floral_blanc:.2 }, force:4, dose:[.1,1.5], tags:['allergene'],
    note:'Eugenol: dental, virile, highly structuring.' },

  { id:'muscade', nom:'Nutmeg', latin:'Myristica fragrans', famille:'Spices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:.8, bois_sec:.3, aromatique:.3 }, force:3, dose:[.2,2], tags:[],
    note:'Dry, woody spice, a little dusty.' },

  { id:'cumin', nom:'Cumin', latin:'Cuminum cyminum', famille:'Spices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:.7, animal:.8 }, force:5, dose:[.02,.3], tags:['animal','rare'],
    note:'The smell of skin, unsettling and magnetic. Traces only.' },

  /* ---------------- BASE ---------------- */
  { id:'santal', nom:'Sandalwood Mysore / New Caledonia', latin:'Santalum album', famille:'Woods', role:'fond', nature:'naturelle',
    facettes:{ bois_cremeux:1, musc:.4, floral_poudre:.2 }, force:3, dose:[2,15], tags:['couteux'],
    note:'Milk of wood; consoling, round, never aggressive.' },

  { id:'javanol', nom:'Javanol', latin:'', famille:'Woods', role:'fond', nature:'synthese',
    facettes:{ bois_cremeux:1, musc:.3, vert:.2 }, force:5, dose:[.1,1.5], tags:[],
    note:'Crystalline synthetic sandalwood, formidable tenacity.' },

  { id:'cedre_atlas', nom:'Atlas cedar', latin:'Cedrus atlantica', famille:'Woods', role:'fond', nature:'naturelle',
    facettes:{ bois_sec:1, mousse_terre:.3, fume:.2 }, force:3, dose:[1,10], tags:[],
    note:'Sharpened pencil, dry attic.' },

  { id:'iso_e', nom:'Iso E Super', latin:'', famille:'Woods', role:'fond', nature:'synthese',
    facettes:{ bois_sec:.8, ambre:.4, musc:.3 }, force:2, dose:[3,25], tags:[],
    note:'Transparent woody velvet; enlarges the sillage without hardening it.' },

  { id:'vetiver', nom:'Haiti vetiver', latin:'Chrysopogon zizanioides', famille:'Woods', role:'fond', nature:'naturelle',
    facettes:{ bois_sec:.8, mousse_terre:.9, fume:.3 }, force:4, dose:[1,10], tags:[],
    note:'Root, damp earth and grapefruit — rugged nobility.' },

  { id:'patchouli', nom:'Patchouli (heart fraction)', latin:'Pogostemon cablin', famille:'Woods', role:'fond', nature:'naturelle',
    facettes:{ mousse_terre:.9, bois_sec:.5, gourmand:.3, ambre:.3 }, force:4, dose:[1,12], tags:[],
    note:'Earth, cocoa and cellar; the heart fraction avoids the camphoraceous side.' },

  { id:'oud', nom:'Oud (agarwood)', latin:'Aquilaria spp.', famille:'Woods', role:'fond', nature:'naturelle',
    facettes:{ fume:.9, animal:.7, bois_sec:.6, cuir:.5 }, force:5, dose:[.1,2], tags:['animal','couteux','rare'],
    note:'Fermented, medicinal, immense. Reserved for compositions that own it.' },

  { id:'mousse_chene', nom:'Oakmoss (Evernyl)', latin:'Evernia prunastri', famille:'Chypre', role:'fond', nature:'synthese',
    facettes:{ mousse_terre:1, fume:.3, cuir:.3 }, force:4, dose:[.2,2], tags:['allergene'],
    note:'The skeleton of the chypre; the natural absolute is heavily restricted (IFRA).',
    prudence:'Atranol / chloroatranol — use an IFRA-compliant quality.' },

  { id:'encens', nom:'Frankincense (olibanum)', latin:'Boswellia carterii', famille:'Resins', role:'fond', nature:'naturelle',
    facettes:{ resine:1, agrumes:.3, fume:.4 }, force:3, dose:[.5,6], tags:[],
    note:'Dry, lemony smoke — vertical, sacred.' },

  { id:'myrrhe', nom:'Myrrh', latin:'Commiphora myrrha', famille:'Resins', role:'fond', nature:'naturelle',
    facettes:{ resine:.9, ambre:.4, miel:.3, fume:.3 }, force:3, dose:[.3,4], tags:[],
    note:'Bitter, medicinal balm, almost liturgical.' },

  { id:'labdanum', nom:'Labdanum (cistus)', latin:'Cistus ladaniferus', famille:'Resins', role:'fond', nature:'naturelle',
    facettes:{ ambre:1, resine:.7, cuir:.5, miel:.4 }, force:4, dose:[.5,6], tags:[],
    note:'The heart of the amber accord: warm, leathery, a little animalic.' },

  { id:'benjoin', nom:'Siam benzoin', latin:'Styrax tonkinensis', famille:'Resins', role:'fond', nature:'naturelle',
    facettes:{ vanille:.8, resine:.7, ambre:.5, gourmand:.4 }, force:3, dose:[1,8], tags:['allergene'],
    note:'Vanillic, balsamic resin; comfort itself.' },

  { id:'ambroxan', nom:'Ambroxan', latin:'', famille:'Amber', role:'fond', nature:'synthese',
    facettes:{ ambre:1, musc:.5, bois_sec:.4 }, force:5, dose:[.5,6], tags:[],
    note:'Mineral, salty ambergris; a “second skin” effect.' },

  { id:'vanille', nom:'Bourbon vanilla (absolute)', latin:'Vanilla planifolia', famille:'Gourmand', role:'fond', nature:'naturelle',
    facettes:{ vanille:1, gourmand:.8, ambre:.3 }, force:3, dose:[1,10], tags:['gourmand','couteux'],
    note:'Round, woody, less sugary than vanillin alone.' },

  { id:'tonka', nom:'Tonka bean (absolute)', latin:'Dipteryx odorata', famille:'Gourmand', role:'fond', nature:'naturelle',
    facettes:{ gourmand:.8, vanille:.6, aromatique:.4, miel:.3 }, force:4, dose:[.5,5], tags:['gourmand','allergene'],
    note:'Coumarin: almond, cut hay, blond tobacco.' },

  { id:'cacao', nom:'Cocoa (absolute)', latin:'Theobroma cacao', famille:'Gourmand', role:'fond', nature:'naturelle',
    facettes:{ gourmand:1, fume:.3, mousse_terre:.3 }, force:4, dose:[.1,1.5], tags:['gourmand'],
    note:'Bitter and powdery, not sweet at all.' },

  { id:'cafe', nom:'Coffee (absolute)', latin:'Coffea arabica', famille:'Gourmand', role:'fond', nature:'naturelle',
    facettes:{ gourmand:.7, fume:.7, bois_sec:.3 }, force:4, dose:[.1,1.5], tags:['gourmand'],
    note:'Dark roast, instantly recognisable.' },

  { id:'miel_abs', nom:'Honey (absolute) / phenylacetic acid', latin:'', famille:'Honeyed', role:'fond', nature:'naturelle',
    facettes:{ miel:1, animal:.5, floral_blanc:.3 }, force:4, dose:[.05,1], tags:['animal'],
    note:'Wax, hive and soft sweat — frank sensuality.' },

  { id:'tabac', nom:'Blond tobacco (absolute)', latin:'Nicotiana tabacum', famille:'Smoky', role:'fond', nature:'naturelle',
    facettes:{ fume:.8, miel:.5, cuir:.4, gourmand:.3 }, force:4, dose:[.2,3], tags:[],
    note:'Dried leaf, honey and hay — virile, nostalgic warmth.' },

  { id:'cuir_iq', nom:'Leather accord (isobutyl quinoline)', latin:'', famille:'Leather', role:'fond', nature:'synthese',
    facettes:{ cuir:1, fume:.4, mousse_terre:.4, bois_sec:.3 }, force:5, dose:[.05,.8], tags:[],
    note:'Green, bitter leather, tannery; extremely tenacious.' },

  { id:'bouleau', nom:'Birch tar (rectified)', latin:'Betula pendula', famille:'Smoky', role:'fond', nature:'naturelle',
    facettes:{ fume:1, cuir:.8, bois_sec:.3 }, force:5, dose:[.02,.4], tags:['rare'],
    note:'Campfire and Russian leather. IFRA restriction.',
    prudence:'Use only a rectified, IFRA-compliant quality.' },

  { id:'castoreum', nom:'Castoreum (reconstitution)', latin:'', famille:'Animalic', role:'fond', nature:'synthese',
    facettes:{ animal:1, cuir:.7, fume:.4, miel:.3 }, force:5, dose:[.05,.8], tags:['animal'],
    note:'Warm, slightly dirty animal leather — a reconstitution with no animal-derived material.' },

  { id:'muscone', nom:'White musks (Habanolide / Galaxolide)', latin:'', famille:'Musky', role:'fond', nature:'synthese',
    facettes:{ musc:1, floral_poudre:.3 }, force:3, dose:[3,25], tags:[],
    note:'Clean skin, dry linen; the binder of almost every modern formula.' },

  { id:'ambrette', nom:'Ambrette seed', latin:'Abelmoschus moschatus', famille:'Musky', role:'fond', nature:'naturelle',
    facettes:{ musc:1, floral_poudre:.4, animal:.3, fruite:.2 }, force:3, dose:[.5,5], tags:['couteux'],
    note:'The only plant musk: pear, skin, powder.' },

  { id:'foin', nom:'Hay (absolute)', latin:'', famille:'Aromatic', role:'fond', nature:'naturelle',
    facettes:{ mousse_terre:.6, gourmand:.4, aromatique:.5, fume:.3 }, force:4, dose:[.1,1.5], tags:[],
    note:'Dried grass, natural coumarin, the countryside in August.' },

  { id:'ambre_gris_acc', nom:'Ambergris accord (Ambrettolide + Cetalox)', latin:'', famille:'Amber', role:'fond', nature:'synthese',
    facettes:{ ambre:.8, musc:.7, aquatique:.4 }, force:4, dose:[.5,6], tags:[],
    note:'Saline, mineral, warm-marine: skin in the sun.' },

  /* ---- common workshop materials, outside the classic palette ---- */

  { id:'acetate_amyle', nom:'Amyl acetate', latin:'', famille:'Fruity', role:'tete', nature:'synthese',
    facettes:{ fruite:1, gourmand:.3 }, force:4, dose:[.05,.6], tags:[],
    note:'Banana and pear drops: a frank, straightforward fruitiness.' },

  { id:'aldehyde_c16', nom:'Aldehyde C-16 (strawberry)', latin:'', famille:'Fruity', role:'coeur', nature:'synthese',
    facettes:{ fruite:1, gourmand:.5 }, force:4, dose:[.1,1], tags:['gourmand'],
    note:'Candied strawberry — sweet, round, a little candyfloss.' },

  { id:'furanone', nom:'Furaneol (strawberry furanone)', latin:'', famille:'Gourmand', role:'coeur', nature:'synthese',
    facettes:{ gourmand:1, fruite:.9, miel:.4 }, force:5, dose:[.01,.2], tags:['gourmand'],
    note:'Warm strawberry and caramel — invasive, dosed in hundredths of a percent.' },

  { id:'damascone_delta', nom:'Delta-damascone', latin:'', famille:'Fruity', role:'coeur', nature:'synthese',
    facettes:{ fruite:.9, rose:.7, the:.3 }, force:5, dose:[.02,.3], tags:[],
    note:'Crushed apple and rose; lights up a formula from a trace.' },

  { id:'methyl_anthranilate', nom:'Methyl anthranilate', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.7, fruite:.5, animal:.3 }, force:4, dose:[.05,.8], tags:[],
    note:'Orange blossom and grape: suave, a little heady.' },

  { id:'heliotropine', nom:'Heliotropin (heliotrope)', latin:'', famille:'Powdery', role:'coeur', nature:'synthese',
    facettes:{ floral_poudre:.9, vanille:.5, gourmand:.3 }, force:3, dose:[.5,5], tags:[],
    note:'Powdery almond and cherry blossom — the comfort of an old talc.' },

  { id:'muguet_aldehyde', nom:'Aldehydic lily of the valley', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.8, vert:.5, aquatique:.3 }, force:4, dose:[.2,2], tags:[],
    note:'The aldehydes’ lily of the valley: bright, clean, a little soapy.',
    prudence:'Several aldehydic muguet materials (Lilial, Lyral) are now banned — check the exact molecule on the bottle.' },

  { id:'lyral', nom:'Lyral', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.8, vert:.4, floral_poudre:.3 }, force:4, dose:[.2,2], tags:['allergene'],
    note:'Creamy, tenacious lily of the valley, long indispensable.',
    prudence:'Banned in fine fragrance (IFRA, 49th Amendment) — no longer to be used in a formula intended for the skin.' },

  { id:'narcisse', nom:'Narcissus (absolute)', latin:'Narcissus poeticus', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:.7, miel:.5, vert:.5, animal:.3 }, force:4, dose:[.1,1.5], tags:['couteux','rare'],
    note:'Green hay, honey and light leather — a flower that smells of the meadow.' },

  { id:'oeillet', nom:'Carnation', latin:'Dianthus caryophyllus', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:.8, floral_poudre:.5, rose:.4 }, force:4, dose:[.2,2], tags:['allergene'],
    note:'Pepper, clove and petal: the flower of the buttonhole.' },

  { id:'linalol', nom:'Linalool', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.5, aromatique:.5, vert:.3, agrumes:.2 }, force:2, dose:[1,10], tags:['allergene'],
    note:'Fresh flower and pale wood; a discreet binder, found almost everywhere.' },

  { id:'angelique', nom:'Angelica (root)', latin:'Angelica archangelica', famille:'Aromatic', role:'coeur', nature:'naturelle',
    facettes:{ vert:.6, aromatique:.6, mousse_terre:.5, epice_frais:.4 }, force:4, dose:[.1,1], tags:['couteux','rare'],
    note:'Cold, musky, earthy root — strange and thoroughbred.',
    prudence:'Photosensitising.' },

  { id:'cedre_feuille', nom:'Cedar leaf', latin:'Thuja occidentalis', famille:'Green', role:'tete', nature:'naturelle',
    facettes:{ vert:.8, aromatique:.6, bois_sec:.4 }, force:4, dose:[.1,1], tags:[],
    note:'A conifer crushed between the fingers: green, camphoraceous, biting.',
    prudence:'Rich in thujone — restricted use, very low doses.' },

  { id:'davana', nom:'Davana', latin:'Artemisia pallens', famille:'Fruity', role:'coeur', nature:'naturelle',
    facettes:{ fruite:.8, miel:.5, the:.3, bois_sec:.3 }, force:4, dose:[.1,1], tags:['rare'],
    note:'Dried fruit and amber rum; changes face from one skin to the next.' },

  { id:'tilleul', nom:'Linden blossom (absolute)', latin:'Tilia cordata', famille:'Floral', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:.6, miel:.5, the:.4, vert:.3 }, force:3, dose:[.2,2], tags:['couteux'],
    note:'Lime-tree flower and a lukewarm infusion — a village summer.' },

  { id:'lotus', nom:'Lotus', latin:'Nelumbo nucifera', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ floral_blanc:.6, aquatique:.5, the:.4, floral_poudre:.3 }, force:3, dose:[.3,3], tags:[],
    note:'A water flower, fresh and powdery at once.' },

  { id:'jasmin_grandiflorum', nom:'Jasmine grandiflorum (absolute)', latin:'Jasminum grandiflorum', famille:'White floral', role:'coeur', nature:'naturelle',
    facettes:{ floral_blanc:1, animal:.3, fruite:.3, the:.2 }, force:4, dose:[.5,8], tags:['couteux'],
    note:'Greener and more indolic than the sambac; the jasmine of Grasse.' },

  { id:'safranal', nom:'Safranal', latin:'', famille:'Spices', role:'coeur', nature:'synthese',
    facettes:{ epice_chaud:.8, cuir:.5, miel:.3 }, force:5, dose:[.02,.3], tags:[],
    note:'The metallic, leathery heart of saffron, without its price.' },

  { id:'nerol', nom:'Nerol', latin:'', famille:'Floral', role:'coeur', nature:'synthese',
    facettes:{ rose:.8, agrumes:.4, vert:.3 }, force:3, dose:[.5,5], tags:[],
    note:'Fresh, lemony rose — not to be confused with neroli.' },

  { id:'methyl_ionone', nom:'Alpha-methyl ionone', latin:'', famille:'Powdery', role:'coeur', nature:'synthese',
    facettes:{ floral_poudre:1, bois_sec:.4, rose:.3 }, force:3, dose:[1,10], tags:[],
    note:'Powdery, woody violet, softer and more tenacious than ionone.' },

  { id:'curcuma', nom:'Turmeric', latin:'Curcuma longa', famille:'Spices', role:'coeur', nature:'naturelle',
    facettes:{ epice_chaud:.7, bois_sec:.4, vert:.3 }, force:4, dose:[.05,.5], tags:[],
    note:'A warm, dusty root, a little medicinal.' }
];

/* ------------------------------------------------------------------ */
/* 5. Sensory sliders                                                  */
/* ------------------------------------------------------------------ */
/* effet: facets pushed when the slider goes towards +1 (and withdrawn
   when it goes towards -1), weighted by the slider value.             */

const CURSEURS = [
  { id:'lumiere', gauche:'Dark', droite:'Luminous',
    effet:{ agrumes:.6, aldehyde:.4, floral_blanc:.3, aquatique:.3, vert:.2,
            resine:-.4, fume:-.5, cuir:-.4, animal:-.3, mousse_terre:-.3 } },
  { id:'temperature', gauche:'Cool', droite:'Warm',
    effet:{ ambre:.7, epice_chaud:.6, vanille:.5, resine:.4, miel:.3, gourmand:.3,
            agrumes:-.5, aquatique:-.6, vert:-.4, aromatique:-.2 } },
  { id:'presence', gauche:'Discreet', droite:'Enveloping',
    effet:{ musc:.3, ambre:.4, bois_cremeux:.3, floral_blanc:.3, resine:.2 } },
  { id:'caractere', gauche:'Classic', droite:'Singular',
    effet:{ animal:.5, fume:.5, cuir:.4, mousse_terre:.3, epice_chaud:.3,
            floral_blanc:-.1, musc:-.2 } },
  { id:'texture', gauche:'Dry', droite:'Velvety',
    effet:{ bois_cremeux:.7, floral_poudre:.6, vanille:.4, musc:.4, gourmand:.3,
            bois_sec:-.5, vert:-.3, aldehyde:-.2 } }
];

/* Exclusions offered to the client (allergies, dislikes, convictions) */
const EXCLUSIONS = [
  { id:'animal',    nom:'Animalic notes',                tags:['animal'] },
  { id:'gourmand',  nom:'Sweet / gourmand notes',        tags:['gourmand'] },
  { id:'allergene', nom:'Common regulated allergens',    tags:['allergene'] },
  { id:'couteux',   nom:'Very costly materials',         tags:['couteux'] },
  { id:'synthese',  nom:'Synthetic molecules (all natural)', nature:'synthese' }
];

/* Usual concentrations (share of concentrate in alcohol) */
const CONCENTRATIONS = [
  { id:'edt',     nom:'Eau de toilette', plage:'8–12%',  tenue:'3 to 5 h' },
  { id:'edp',     nom:'Eau de parfum',   plage:'15–20%', tenue:'6 to 8 h' },
  { id:'extrait', nom:'Extrait',         plage:'22–30%', tenue:'8 h and more' }
];
