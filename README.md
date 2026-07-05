# Astghid Nails

Site Next.js complet pour un salon de nails : prestations, tarifs, promotions,
galerie, contact et réservation en ligne.

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

Les rendez-vous sont enregistrés dans :

```bash
data/appointments.json
```

La route serveur utilisée par le formulaire est :

```bash
GET  /api/appointments?date=YYYY-MM-DD
POST /api/appointments
```

Le système vérifie les créneaux disponibles et bloque les doublons sur la même
date et la même heure.

## Variables d'environnement

Copier le modèle si des intégrations externes sont ajoutées :

```bash
cp .env.example .env.local
```

Variables prévues :

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_CALENDAR_ID=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

Google Calendar et Resend sont préparés côté configuration, mais pas activés
par défaut. Le comportement actuel est volontairement local et explicite pour
éviter tout faux succès.

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
```
