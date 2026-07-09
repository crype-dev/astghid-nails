import { BookingForm } from "@/components/booking-form";
import {
  gallery,
  salon,
  services,
} from "@/data/site";
import Image from "next/image";

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
            width={180}
            height={180}
            className="logo-img"
            priority
          />
        </a>
      </header>

      <section className="hero" id="accueil">
        <div className="hero-copy">
          <p className="eyebrow text-gradient">{salon.baseline}</p>
          <h1 className="text-gradient">Des ongles nets, élégants et pensés pour tenir.</h1>
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
            <strong className="text-gradient">4 semaines</strong>
            <span className="text-gradient">retouche recommandée</span>
          </div>
        </div>
      </section>

      <section className="split-section" id="tarifs">
        <div className="section-heading compact">
          <p className="eyebrow text-gradient">Tarifs</p>
          <h2 className="text-gradient">Prix lisibles, durée indiquée.</h2>
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
          <p className="eyebrow text-gradient">Rendez-vous</p>
          <h2 className="text-gradient">Réservation en ligne</h2>
        </div>
        <BookingForm />
      </section>

      <section className="section" id="galerie">
        <div className="section-heading">
          <p className="eyebrow text-gradient">Inspirations</p>
          <h2 className="text-gradient">Les créations de astghid nails</h2>
        </div>

        <div className="gallery-grid">
          {gallery.map((item) => (
            <figure key={item.title}>
              <Image alt={item.title} height={620} src={item.image} width={620} />
              <figcaption>
                <strong>{item.title}</strong>
                <span>
                  {item.category === "semi" ? "Semi-permanent" : 
                   item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
