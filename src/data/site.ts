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

export type Testimonial = {
  name: string;
  service: string;
  quote: string;
  rating: 5;
};

export const salon = {
  name: "Astghid Nails",
  baseline: "Onglerie premium à Gilly",
  phone: "",
  email: "",
  address: "Rue des Hayettes 54, 6060 Gilly",
  instagram: "",
  facebook: "",
  whatsapp: "",
  mapsQuery: "Rue des Hayettes 54, 6060 Gilly",
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
    name: "Pose complète gel",
    category: "gel",
    duration: 120,
    price: "à partir de 65 €",
    description: "Construction soignée, forme personnalisée et finition brillante.",
    featured: true,
  },
  {
    id: "retouche-gel",
    name: "Retouche gel",
    category: "retouche",
    duration: 90,
    price: "à partir de 50 €",
    description: "Remise en forme, remplissage et nouvelle couleur.",
    featured: true,
  },
  {
    id: "gainage",
    name: "Gainage sur ongles naturels",
    category: "gel",
    duration: 90,
    price: "50 €",
    description: "Renfort fin pour garder un rendu naturel et résistant.",
  },
  {
    id: "semi-mains",
    name: "Semi-permanent mains",
    category: "semi",
    duration: 60,
    price: "35 €",
    description: "Couleur nette, tenue longue durée et cuticules propres.",
    featured: true,
  },
  {
    id: "french-babyboomer",
    name: "French ou babyboomer",
    category: "nail-art",
    duration: 30,
    price: "+ 10 €",
    description: "Finition élégante à ajouter à une pose ou retouche.",
  },
  {
    id: "nail-art",
    name: "Nail art personnalisé",
    category: "nail-art",
    duration: 30,
    price: "sur devis",
    description: "Effets, strass, dessins fins ou inspiration Instagram.",
  },
  {
    id: "depose",
    name: "Dépose",
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
    description: "Mise en beauté nette et couleur longue tenue.",
  },
];

export const promotions: Promotion[] = [
  {
    title: "Première visite",
    detail: "-10% sur une pose complète gel ou un gainage.",
    price: "Offre bienvenue",
  },
  {
    title: "Pack mains + pieds",
    detail: "Semi-permanent mains et pieds sur le même rendez-vous.",
    price: "68 €",
  },
  {
    title: "Retouche fidèle",
    detail: "Tarif bloqué si la retouche est faite sous 4 semaines.",
    price: "50 €",
  },
];

export const testimonials: Testimonial[] = [
  {
    name: "Sarah",
    service: "Pose complète gel",
    quote:
      "Pose très propre, forme exactement comme demandé et tenue impeccable.",
    rating: 5,
  },
  {
    name: "Nora",
    service: "Semi-permanent mains",
    quote:
      "Travail précis, salon calme et résultat naturel. Je recommande.",
    rating: 5,
  },
  {
    name: "Elena",
    service: "Retouche gel",
    quote:
      "Retouche rapide, couleur parfaite et conseils utiles pour l'entretien.",
    rating: 5,
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
    image: "/images/hero-nails.png",
  },
  {
    title: "Rouge classique",
    category: "semi",
    image:
      "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Détails brillants",
    category: "nail-art",
    image: "/images/nail-art-chrome.png",
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
    image: "/images/milky-rose.png",
  },
];
