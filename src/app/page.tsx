import { BookingForm } from "@/components/booking-form";
import {
  gallery,
  openingHours,
  salon,
  services,
} from "@/data/site";
import Image from "next/image";

const categories = [
  { label: "Gel", value: "gel" },
  { label: "Semi-permanent", value: "semi" },
  { label: "Retouche", value: "retouche" },
  { label: "Nail art", value: "nail-art" },
  { label: "Pieds", value: "pieds" },
];

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  name: salon.name,
  description:
    "Onglerie à Charleroi spécialisée en pose gel, semi-permanent, retouches et nail art.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Charleroi",
    addressCountry: "BE",
  },
  areaServed: "Charleroi",
  openingHours: [
    "Tu 10:00-18:30",
    "We 10:00-18:30",
    "Th 10:00-19:00",
    "Fr 09:30-18:00",
    "Sa 09:30-16:00",
  ],
  priceRange: "€€",
};

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <header className="site-header">
        <a className="brand" href="#accueil" aria-label="Astghid Nails accueil">
          <Image
            alt="Logo Astghid Nails"
            src="/images/logo.png"
            width={160}
            height={160}
            className="logo-img"
            priority
          />
        </a>
      </header>

      <section className="hero" id="accueil">
        <div className="hero-copy">
          <p className="eyebrow text-gradient">{salon.baseline}</p>
          <h1 className="text-gradient">Des ongles nets, élégants et pensés pour tenir.</h1>
          <p>
            Pose gel, semi-permanent, retouches et nail art réalisés avec une
            attention précise sur la forme, l&apos;hygiène et le rendu final.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#rendez-vous">
              Prendre rendez-vous
            </a>
            <a className="secondary-action" href="#tarifs">
              Voir les tarifs
            </a>
          </div>
        </div>
        <div className="hero-media" aria-label="Manucure premium">
          <Image
            alt="Pose d'ongles multicolore par notre mascotte"
            height={900}
            src="/images/hero-mascot.png"
            priority
            width={760}
          />
          <div className="hero-badge">
            <strong>4 semaines</strong>
            <span>retouche recommandée</span>
          </div>
        </div>
      </section>

      <section className="trust-band" aria-label="Points forts">
        {[
          "Hygiène stricte",
          "Forme personnalisée",
          "Tenue longue durée",
          "Conseil couleur",
        ].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>

      <section className="split-section" id="tarifs">
        <div className="section-heading compact">
          <p className="eyebrow text-gradient">Tarifs</p>
          <h2 className="text-gradient">Prix lisibles, durée indiquée.</h2>
          <p>
            Chaque prestation affiche une durée estimée et un tarif clair pour
            choisir rapidement le bon rendez-vous.
          </p>
        </div>

        <div className="price-table">
          {services.map((service) => (
            <div className="price-row" key={service.id}>
              <div>
                <strong>{service.name}</strong>
                <span>{service.duration} min</span>
              </div>
              <p>{service.price}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section muted" id="rendez-vous">
        <div className="section-heading">
          <p className="eyebrow">Rendez-vous</p>
          <h2>Réservation en ligne réelle.</h2>
          <p>
            Le formulaire vérifie les créneaux disponibles et bloque l&apos;heure
            choisie dès que le rendez-vous est confirmé.
          </p>
        </div>
        <BookingForm />
      </section>

      <section className="section" id="galerie">
        <div className="section-heading">
          <p className="eyebrow">Inspirations</p>
          <h2>Inspirations et finitions.</h2>
          <p>
            Des idées de styles pour préparer votre rendez-vous et préciser la
            couleur, la forme ou la finition souhaitée.
          </p>
        </div>

        <div className="filter-row" aria-label="Catégories galerie">
          {categories.map((category) => (
            <span key={category.value}>{category.label}</span>
          ))}
        </div>

        <div className="gallery-grid">
          {gallery.map((item) => (
            <figure key={item.title}>
              <Image alt={item.title} height={620} src={item.image} width={620} />
              <figcaption>
                <strong>{item.title}</strong>
                <span>
                  {categories.find((category) => category.value === item.category)
                    ?.label ?? item.category}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>



      <section className="contact-section" id="contact">
        <div className="contact-card">
          <p className="eyebrow">Contact</p>
          <h2>Passer au salon ou réserver en ligne.</h2>
          <div className="contact-list">
            {salon.phone ? <a href={`tel:${salon.phone}`}>{salon.phone}</a> : null}
            {salon.email ? (
              <a href={`mailto:${salon.email}`}>{salon.email}</a>
            ) : null}
            <span>{salon.address}</span>
            <a href="#rendez-vous">Réserver en ligne</a>
            {salon.whatsapp || salon.instagram || salon.facebook ? (
              <div className="social-row">
                {salon.whatsapp ? <a href={salon.whatsapp}>WhatsApp</a> : null}
                {salon.instagram ? <a href={salon.instagram}>Instagram</a> : null}
                {salon.facebook ? <a href={salon.facebook}>Facebook</a> : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="hours-card">
          <h3>Horaires</h3>
          {openingHours.map((item) => (
            <div key={item.day}>
              <span>{item.day}</span>
              <strong>{item.hours}</strong>
            </div>
          ))}
          <iframe
            title="Carte du salon"
            src={`https://www.google.com/maps?q=${encodeURIComponent(
              salon.mapsQuery,
            )}&output=embed`}
          />
        </div>
      </section>
    </main>
  );
}
