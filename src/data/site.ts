export type Service = {
  id: string;
  name: string;
  category: "gel" | "semi" | "retouche" | "nail-art" | "pieds";
  duration: number;
  price: string;
  description: string;
  featured?: boolean;
};

export type Promotion = {
  title: string;
  detail: string;
  price: string;
};

export type GalleryItem = {
  title: string;
  category: Service["category"];
  image: string;
};

export const salon = {
  name: "Astghid Nails",
  baseline: "Onglerie premium a Charleroi",
  phone: "+32 470 00 00 00",
  email: "contact@astghidnails.be",
  address: "Rue de la Beauté 12, 6000 Charleroi",
  instagram: "https://www.instagram.com/",
  facebook: "https://www.facebook.com/",
  whatsapp:
    "https://wa.me/32470000000?text=Bonjour%2C%20je%20souhaite%20prendre%20rendez-vous%20pour%20une%20pose%20d%27ongles.",
  mapsQuery: "Rue de la Beauté 12, 6000 Charleroi",
};

export const openingHours = [
  { day: "Lundi", hours: "Fermé" },
  { day: "Mardi", hours: "10:00 - 18:30" },
  { day: "Mercredi", hours: "10:00 - 18:30" },
  { day: "Jeudi", hours: "10:00 - 19:00" },
  { day: "Vendredi", hours: "09:30 - 18:00" },
  { day: "Samedi", hours: "09:30 - 16:00" },
  { day: "Dimanche", hours: "Fermé" },
];

export const services: Service[] = [
  {
    id: "pose-gel",
    name: "Pose complete gel",
    category: "gel",
    duration: 120,
    price: "a partir de 65 €",
    description: "Construction soignee, forme personnalisee et finition brillante.",
    featured: true,
  },
  {
    id: "retouche-gel",
    name: "Retouche gel",
    category: "retouche",
    duration: 90,
    price: "a partir de 50 €",
    description: "Remise en forme, remplissage et nouvelle couleur.",
    featured: true,
  },
  {
    id: "gainage",
    name: "Gainage sur ongles naturels",
    category: "gel",
    duration: 90,
    price: "50 €",
    description: "Renfort fin pour garder un rendu naturel et resistant.",
  },
  {
    id: "semi-mains",
    name: "Semi-permanent mains",
    category: "semi",
    duration: 60,
    price: "35 €",
    description: "Couleur nette, tenue longue duree et cuticules propres.",
    featured: true,
  },
  {
    id: "french-babyboomer",
    name: "French ou babyboomer",
    category: "nail-art",
    duration: 30,
    price: "+ 10 €",
    description: "Finition elegante a ajouter a une pose ou retouche.",
  },
  {
    id: "nail-art",
    name: "Nail art personnalise",
    category: "nail-art",
    duration: 30,
    price: "sur devis",
    description: "Effets, strass, dessins fins ou inspiration Instagram.",
  },
  {
    id: "depose",
    name: "Depose",
    category: "retouche",
    duration: 45,
    price: "25 €",
    description: "Retrait propre avec soin protecteur de l'ongle naturel.",
  },
  {
    id: "pieds",
    name: "Semi-permanent pieds",
    category: "pieds",
    duration: 60,
    price: "38 €",
    description: "Mise en beaute nette et couleur longue tenue.",
  },
];

export const promotions: Promotion[] = [
  {
    title: "Premiere visite",
    detail: "-10% sur une pose complete gel ou un gainage.",
    price: "Offre bienvenue",
  },
  {
    title: "Pack mains + pieds",
    detail: "Semi-permanent mains et pieds sur le meme rendez-vous.",
    price: "68 €",
  },
  {
    title: "Retouche fidele",
    detail: "Tarif bloque si la retouche est faite sous 4 semaines.",
    price: "50 €",
  },
];

export const gallery: GalleryItem[] = [
  {
    title: "French fine",
    category: "nail-art",
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Gel nude",
    category: "gel",
    image:
      "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Rouge classique",
    category: "semi",
    image:
      "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Details brillants",
    category: "nail-art",
    image:
      "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Soin pieds",
    category: "pieds",
    image:
      "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Rose laiteux",
    category: "gel",
    image:
      "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=900&q=85",
  },
];
