/* Palette de la maison — le stock réel du parfumeur.
 *
 * Tant que ce tableau est vide, l'application utilise la palette de démonstration
 * de donnees.js (~70 matières classiques). Dès qu'il contient quelque chose,
 * il la remplace entièrement : le moteur ne proposera plus que ce qui est ici,
 * c'est-à-dire ce que le parfumeur a réellement sur ses étagères.
 *
 * Trois façons de le remplir :
 *   1. À la main, en suivant le gabarit ci-dessous.
 *   2. Depuis une liste ou un tableur :
 *        node outils/importer-stock.mjs mon-stock.csv > stock.js
 *      Les matières déjà décrites dans donnees.js sont reprises telles quelles ;
 *      les autres sortent en ébauche, à compléter.
 *   3. En demandant à Claude de le faire à partir de la liste du parfumeur.
 *
 * Après toute modification :  node outils/verifier-stock.mjs
 *
 * ------------------------------------------------------------------
 * Gabarit d'une matière
 * ------------------------------------------------------------------
 *   id        identifiant unique, sans accent ni espace          (obligatoire)
 *   nom       tel qu'il apparaîtra sur la fiche                  (obligatoire)
 *   famille   libellé libre : Agrumes, Floral, Bois, Résines…    (obligatoire)
 *   role      'tete' | 'coeur' | 'fond'                          (obligatoire)
 *   nature    'naturelle' | 'synthese'                           (obligatoire)
 *   facettes  { facette: poids 0–1 }, identifiants de FACETTES   (obligatoire)
 *   force     pouvoir odorant, 1 discret → 5 redoutable          (obligatoire)
 *   dose      [min, max] en % du concentré                       (obligatoire)
 *   note      une phrase de caractère, lue par le client         (obligatoire)
 *   latin     nom botanique                                      (facultatif)
 *   tags      'animal', 'gourmand', 'allergene', 'couteux', 'rare'… (facultatif)
 *   prudence  restriction réglementaire à rappeler sur la fiche  (facultatif)
 *
 * Les identifiants de facettes autorisés sont les clés de FACETTES dans
 * donnees.js : agrumes, vert, aromatique, aldehyde, aquatique, floral_blanc,
 * floral_poudre, rose, fruite, the, epice_frais, epice_chaud, miel, gourmand,
 * vanille, bois_sec, bois_cremeux, resine, ambre, mousse_terre, cuir, fume,
 * animal, musc.
 *
 * Exemple :
 *   { id:'bergamote', nom:'Bergamote', latin:'Citrus bergamia', famille:'Agrumes',
 *     role:'tete', nature:'naturelle', facettes:{ agrumes:1, vert:.3 },
 *     force:2, dose:[3,15], tags:['photosensible'],
 *     note:'Le zeste le plus élégant : amer, floral, immédiatement lumineux.',
 *     prudence:'Photosensibilisante — préférer une qualité FCF.' },
 */

/* ------------------------------------------------------------------
   Volontairement vide : ce dépôt est public, et l'inventaire d'un atelier
   ne l'est pas. Le site sert donc la palette de démonstration, tandis que
   le parfumeur saisit — ou importe — sa vraie palette dans « Ma palette » :
   elle reste sur sa tablette (stockage local du navigateur) et n'est
   envoyée nulle part.

   Ce fichier n'a de sens que pour une palette que l'on accepte de publier,
   ou pour un dépôt privé.
   ------------------------------------------------------------------ */

const STOCK_MAISON = [];
