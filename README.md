# Le Parfum des émotions

Application autonome : le client exprime ce qu'il ressent, le parfumeur reçoit une fiche de
composition (matières premières, pyramide, dosages indicatifs).

Aucune dépendance, aucun serveur, aucune clé d'API : quatre fichiers statiques qui fonctionnent
aussi bien en double-cliquant `index.html` que publiés sur GitHub Pages
(`https://<compte>.github.io/parfum-des-emotions/`).

Deux entrées :

- **`index.html`** — la page publique, que le client remplit lui-même et dont il envoie le lien.
- **`salon.html`** — la même séance menée sur tablette pendant le rendez-vous, avec les touches
  à sentir et la mémoire des clients reçus.
- **`palette.html`** — la palette du parfumeur : son stock, saisi dans l'application.

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure de la page et des quatre étapes du questionnaire |
| `salon.html` | Vue tablette : six étapes plein écran, une à la fois |
| `donnees.js` | Facettes, émotions, lexique de lecture du récit, palette de démonstration, curseurs |
| `stock.js`   | Palette versée au dépôt — vide, car ce dépôt est public (voir plus bas) |
| `palette.html` · `palette.js` · `palette.css` | Éditeur de palette dans l'application |
| `palette-locale.js` | Palette gardée sur l'appareil |
| `palette-outils.js` | Rapprochement des noms, vérification, essais à blanc — partagés navigateur et ligne de commande |
| `moteur.js`  | Traduction émotion → facettes → matières → pourcentages |
| `fiche.js`   | Rendu et exports de la fiche, partagés par les deux vues |
| `ia.js`      | Lecture du récit par l'API Claude (facultative) |
| `app.js`     | Interface publique, fiche, impression, export JSON, lien de partage |
| `salon.js`   | Interface salon : étapes, mouillettes, mémoire des séances |
| `style.css` / `salon.css` | Mise en page écran, tablette et impression |
| `serveur/`   | Fonction serverless qui garde la clé d'API côté maison |
| `outils/`    | Vérification de la synchronisation moteur ↔ service |

## Comment ça marche

1. **Le récit libre est lu** par un lexique (`LEXIQUE`) : les mots reconnus proposent des émotions
   et évoquent parfois directement une facette (« pluie » → aquatique, « laine » → rien, « tabac »
   → fumé). Le client confirme d'un clic ; rien n'est imposé.
2. **Émotions, curseurs, saison et moment** sont additionnés en un *vecteur de facettes* : 24 axes
   olfactifs (agrumes, poudré, résines, cuir, musqué…), positifs ou négatifs. C'est le seul langage
   commun entre le ressenti et la matière.
3. **Chaque matière est notée** par produit scalaire avec ce vecteur, atténué par sa spécialisation :
   une matière très typée n'est pas écrasée par une matière passe-partout.
4. **La sélection** prend les mieux notées par étage, avec deux garde-fous : pas plus de deux
   matières d'une même famille, et l'ajout d'un *porteur* si l'étage retenu ne peut pas atteindre
   sa part (des molécules qui se dosent au dixième ne remplissent pas 25 % d'un concentré).
   Un liant (hédione, Iso E Super, muscs) est garanti : sans lui, rien ne fond.
5. **Les pourcentages** sont répartis par remplissage sous contraintes : la part de chaque étage est
   d'abord ramenée dans ce que ses matières autorisent réellement, puis distribuée sans jamais
   sortir de la fourchette de dosage d'une matière. Si les exclusions du client réduisent trop la
   palette, le solde est affiché comme **solvant de mise au point** au lieu d'être maquillé en
   surdosages.

## L'assistant (facultatif)

Le lexique de mots-clés ne voit que ce qu'il connaît. Branché à l'API Claude, l'assistant lit
vraiment le récit : les métaphores, les souvenirs racontés sur plusieurs phrases, les odeurs
suggérées sans être nommées. Il ne remplace rien — il **propose**, et le client confirme d'un
bouton, comme pour le lexique.

Sa sortie est contrainte par un schéma JSON construit à partir de `donnees.js` : le modèle ne peut
répondre qu'avec des émotions et des facettes que le moteur connaît déjà. `ia.js` revalide malgré
tout tout ce qui entre dans le moteur, et l'application retombe sur le lexique dès que la lecture
échoue (service indisponible, texte décliné, appareil hors ligne).

Deux modes, dans **Réglages de l'assistant** :

| Mode | Où vit la clé | Pour qui |
| --- | --- | --- |
| Service de la maison | Sur le serveur (`serveur/worker.js`) | Recommandé — le seul acceptable pour une page publique ou une tablette prêtée |
| Clé sur cet appareil | Dans le navigateur du poste | Le poste privé du parfumeur, pour essayer sans rien déployer |

Le modèle utilisé est `claude-opus-5`, à effort réduit : la tâche est une traduction, pas une
dissertation. Une lecture coûte quelques milliers de jetons.

## La vue salon

`salon.html` est la même séance, tenue à la main pendant le rendez-vous : six étapes plein écran,
grandes cibles tactiles, une seule décision à la fois. Deux choses qu'elle seule apporte :

- **Les touches à sentir.** La composition devient une liste numérotée de mouillettes à préparer,
  dans l'ordre où les faire sentir. Pour chaque matière, le parfumeur note la réaction du client :
  ♥ la garde dans la formule quoi qu'en dise le calcul, ✕ l'en sort. « Recomposer avec ces retours »
  refait la formule autour de ce qui a plu — c'est là que l'outil cesse de deviner et se met à
  écouter.
- **La mémoire des séances.** Nom du client, récit, réglages et retours d'essai sont enregistrés
  dans la tablette (et nulle part ailleurs), et se reprennent d'un bouton au rendez-vous suivant.
  L'écriture est forcée avant tout changement de séance et dès que l'application passe en
  arrière-plan : une tablette est interrompue à tout moment.

## Ce que la fiche donne au parfumeur

Pyramide tête / cœur / fond avec part du concentré et masse pour 10 g **de matière pure**, familles dominantes, profil
olfactif, mise en alcool pour 30 mL selon la concentration choisie, et les points de vigilance
réglementaire portés par les matières retenues (cannelle, mousse de chêne, goudron de bouleau…).

Quand des matières sont diluées, une colonne supplémentaire donne la masse **à prélever au flacon**
— masse pure ÷ dilution — et un bloc vérifie que la pesée est seulement possible : si les
prélèvements dépassent le lot, la fiche le dit, nomme les matières en cause et indique la dilution
minimale qu'il faudrait. Agrandir le lot n'y changerait rien : les deux quantités suivent la même
échelle.

Les dosages sont un **point de départ de laboratoire**, pas une formule finie : la conformité IFRA,
le calcul des allergènes déclarables et l'équilibre réel restent le travail du parfumeur.

## La palette de la maison

La palette livrée dans `donnees.js` est une **démonstration** : ~70 matières classiques, choisies
pour que l'application fonctionne dès l'ouverture. Un parfumeur ne travaille pas avec ça — il
travaille avec ce qu'il a sur ses étagères.

`stock.js` est **volontairement vide**. Ce dépôt est public : y verser l'inventaire d'un atelier
reviendrait à le publier — les matières, leurs dilutions de travail, les bases du fournisseur.
La vraie palette se saisit donc dans « Ma palette », où elle reste sur l'appareil du parfumeur.
`stock.js` n'a de sens que pour une palette que l'on accepte de publier, ou pour un dépôt privé.

Le moteur prend sa palette au premier de ces trois endroits qui est rempli :

1. **celle saisie dans l'application** (`palette.html`), gardée sur l'appareil du parfumeur ;
2. **celle versée au dépôt** (`stock.js`), valable pour tous les appareils ;
3. la palette de démonstration.

Dans les deux premiers cas, elle **remplace entièrement** la démonstration : le moteur ne propose
plus que des matières réellement disponibles, sous les noms de la maison (« Bergamote FCF »,
« Lavande fine de Haute-Provence »).

### Dans l'application : « Ma palette »

`palette.html` — accessible depuis la séance en salon et depuis le bas de la page client. C'est la
voie normale : le parfumeur n'a ni fichier à éditer ni commande à lancer.

- **Coller ma liste** : une matière par ligne. Celles que l'application connaît arrivent déjà
  décrites — facettes, dosages, caractère ; les autres sont signalées, nommément, comme restant à
  compléter.
- **Partir de la palette du dépôt** (ou de la démonstration si le dépôt n'en a pas) : on copie tout,
  puis on retire ce qu'on n'a pas. Souvent plus rapide que de tout saisir.
- Chaque matière s'ouvre d'un toucher : nom, famille, étage, nature, puissance, fourchette de
  dosage, **dilution de travail**, caractère, et les facettes en trois intensités — léger, net,
  dominant.
- **Les dilutions sont lues dans les noms collés** : « Ionone alpha 10% » donne la matière *Ionone
  alpha* diluée à 10 %, comme sur l'étiquette du flacon. La fiche rappelle ensuite la dilution à
  côté de chaque matière — c'est le flacon que le parfumeur ira chercher.
- **Le bilan est permanent** : à chaque modification, les six essais à blanc sont relancés et
  l'état de la palette se met à jour — étage sans porteur, plafond sous 100 %, familles trop peu
  nombreuses, matière que le moteur ne pourra jamais choisir.
- **Sauvegarder / exporter** : un `.json` de sauvegarde, ou un fichier `stock.js` prêt à déposer
  dans le dépôt pour que la palette vaille sur tous les appareils.

La palette vit dans le navigateur de l'appareil. C'est ce qui permet de se passer de serveur — et
c'est aussi pourquoi le bouton d'export existe : un nettoyage d'historique l'effacerait.

### En ligne de commande, pour verser la palette au dépôt

```bash
node outils/importer-stock.mjs mon-stock.txt > stock.js   # une matière par ligne
node outils/importer-stock.mjs mon-stock.csv > stock.js   # avec colonnes
node outils/verifier-stock.mjs                            # toujours, après
```

Les matières déjà décrites dans `donnees.js` sont **reprises telles quelles** — inutile de ressaisir
les facettes de la bergamote ; seul le nom de la maison est conservé. Les autres sortent en ébauche,
signalées `À COMPLÉTER`, et l'outil dit lesquelles.

Le CSV accepte, toutes facultatives sauf `nom` : `latin`, `famille`, `role`, `nature`, `force`,
`dose_min`, `dose_max`, `facettes` (`agrumes:1 vert:0.3`), `tags` (`couteux;allergene`), `note`,
`prudence`. Voir `exemples/stock-liste.txt` et `exemples/stock-detaille.csv`.

### La vérification

`outils/verifier-stock.mjs` ne se contente pas de relire les champs : il **soumet six demandes
contrastées au moteur** avec la palette de la maison et vérifie que chacune produit une formule
tenable. Il signale ce qui compte vraiment en pratique :

- un étage sans aucune matière, ou sans matière dosable au-dessus de 4 % — cet étage restera famélique ;
- une palette qui plafonne sous 100 %, donc toujours complétée au solvant ;
- moins de quatre familles, signe que toutes les compositions se ressembleront ;
- un dosage inversé, une facette inexistante, un identifiant en double.

Il échoue (code de sortie 1) sur une vraie erreur, et se contente d'avertir sur ce qui est
seulement discutable.

## Adapter le reste

Tout se règle dans `donnees.js`, sans toucher au moteur :

- **Émotions** : `EMOTIONS` — un nom, une phrase, et des poids sur les facettes.
- **Vocabulaire du client** : `LEXIQUE` — ajouter les mots de sa clientèle (régionalismes, marques,
  lieux). Les accents et la casse sont ignorés.
- **Exclusions** : `EXCLUSIONS` filtre par `tags` ou par `nature` ; ajouter par exemple un
  « sans matière d'origine animale » ou « conforme à telle liste interne ».

Les identifiants de facettes doivent exister dans `FACETTES` : c'est la seule contrainte de cohérence.

Si vous ajoutez une émotion, une facette ou un curseur, mettez à jour la liste correspondante dans
`serveur/worker.js` (elle y est dupliquée pour que le navigateur ne puisse pas imposer son propre
schéma au service). `node outils/verifier-schema.mjs` le vérifie et échoue si les deux divergent.

## Partage

Le bouton « Copier le lien de partage » encode toute la demande dans le fragment de l'URL. Le client
envoie ce lien au parfumeur, qui rouvre exactement la même fiche — sans base de données ni compte.
L'export JSON sert, lui, à verser la demande dans un système de suivi de commandes.
