# Service de lecture du récit

Petite fonction serverless qui interroge l'API Claude à la place du navigateur. Son seul rôle est
de garder la clé d'API du côté de la maison : la page reste statique et publiable sur GitHub Pages.

Sans ce service, l'application fonctionne quand même — par lexique de mots-clés, ou avec une clé
stockée sur le poste du parfumeur (mode « clé sur cet appareil », à réserver à un poste privé).

## Déployer sur Cloudflare Workers

```bash
npm install -g wrangler
wrangler login

# depuis parfum/serveur/
wrangler deploy worker.js --name lecture-parfum --compatibility-date 2026-01-01

# la clé, stockée côté Cloudflare et jamais dans le dépôt
wrangler secret put ANTHROPIC_API_KEY --name lecture-parfum

# facultatif mais recommandé : restreindre les origines qui peuvent appeler le service
wrangler secret put ORIGINES_AUTORISEES --name lecture-parfum
# → https://votrecompte.github.io
```

Wrangler affiche ensuite l'adresse du service (`https://lecture-parfum.<compte>.workers.dev`).
Reportez-la dans l'application : **Réglages de l'assistant → Service de la maison**.

## Contrat

`POST /` avec `{"recit": "…"}` renvoie exactement l'objet attendu par l'application :

```json
{
  "resume": "Vous cherchez à retrouver un automne d'enfance, la pluie et la laine.",
  "emotions": ["nostalgie", "reconfort"],
  "facettes": [{ "id": "mousse_terre", "poids": 0.8 }, { "id": "fume", "poids": 0.5 }],
  "curseurs": { "lumiere": -0.3, "temperature": 0.5, "presence": 0, "caractere": 0.2, "texture": 0.6 },
  "indices": ["la pluie sur les feuilles", "sa veste de laine"]
}
```

En cas d'échec, `{"erreur": "…"}` avec un code HTTP parlant (400 récit trop court, 403 origine non
autorisée, 422 lecture déclinée, 502 problème amont). Le détail des erreurs de l'API n'est jamais
relayé au navigateur — il part dans les journaux du Worker.

## Points de vigilance

- **Le schéma de sortie est dupliqué** entre `worker.js` et `../donnees.js`. C'est volontaire : le
  navigateur ne doit pas pouvoir imposer son propre schéma ni sa propre consigne au service. En
  contrepartie, les deux listes doivent rester synchronisées — `outils/verifier-schema.mjs` le
  vérifie et échoue si elles divergent.
- **Le récit est du texte écrit par un client.** La consigne dit explicitement au modèle de le
  traiter comme une matière à interpréter et non comme des instructions, et la sortie est contrainte
  par un schéma JSON : le modèle ne peut renvoyer que des identifiants que le moteur connaît déjà.
- **Coût.** Une lecture consomme quelques milliers de jetons. Si le service est exposé publiquement,
  ajoutez une limite de débit (Cloudflare Rate Limiting) ou un jeton partagé avec l'application.

## Autre hébergeur

Le fichier est un module standard `export default { fetch(requete, env) }`. Pour Vercel, Netlify
Functions ou Deno Deploy, seule l'enveloppe change : la logique — validation, appel, schéma —
se transpose telle quelle.
