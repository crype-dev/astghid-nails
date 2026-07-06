# Astghid Nails

Site Next.js complet pour un salon de nails : prestations, tarifs, promotions,
galerie, contact et réservation en ligne. Le projet tourne en localhost et se
déploie sur Cloudflare Workers via OpenNext.

Production :

```bash
https://astghidnails.com
```

## Lancer en local

```bash
npm install
npm run dev
```

Ouvrir ensuite :

```bash
http://localhost:3000
```

## Réservation

Le site fonctionne directement sans API externe.

En local Next.js, les rendez-vous sont enregistrés dans :

```bash
data/appointments.json
```

En production Cloudflare, les rendez-vous sont enregistrés dans D1 :

```bash
astghid-nails-db
```

La route serveur utilisée par le formulaire est :

```bash
GET  /api/appointments?date=YYYY-MM-DD
POST /api/appointments
```

Le système vérifie les créneaux disponibles et bloque les doublons sur la même
date et la même heure. En production, la table D1 impose aussi une contrainte
unique `(date, time)`.

## Cloudflare

Appliquer les migrations D1 en local :

```bash
npm run db:migrate:local
```

Appliquer les migrations D1 en production :

```bash
npm run db:migrate:prod
```

Prévisualiser avec le runtime Cloudflare Workers :

```bash
npm run preview
```

Déployer en production :

```bash
npm run deploy
```

## Variables d'environnement

Copier le modèle si des intégrations externes sont ajoutées :

```bash
cp .env.example .env.local
```

Variables prévues :

```bash
NEXT_PUBLIC_SITE_URL=https://astghidnails.com
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_CALENDAR_ID=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_OWNER_EMAIL=
```

Google Calendar et Resend sont préparés côté configuration, mais pas activés
par défaut. Le comportement actuel est volontairement local et explicite pour
éviter tout faux succès.

Pour activer les emails de confirmation avec Resend :

```bash
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=Astghid Nails <reservations@astghidnails.com>
RESEND_OWNER_EMAIL=astghid86@gmail.com
```

Remplacer `re_xxxxxxxxx` par la vraie clé API Resend, puis ajouter les mêmes
variables en secrets Cloudflare avant de redéployer.

## Modifier le contenu

Les prestations, tarifs, promotions, galerie, coordonnées et horaires sont dans :

```bash
src/data/site.ts
```

## Scripts utiles

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run deploy
```
