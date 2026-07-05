import { BookingForm } from "@/components/booking-form";
import { gallery, openingHours, promotions, salon, services } from "@/data/site";
import Image from "next/image";

const featuredServices = services.filter((service) => service.featured);
const categories = [
  { label: "Gel", value: "gel" },
  { label: "Semi-permanent", value: "semi" },
  { label: "Retouche", value: "retouche" },
  { label: "Nail art", value: "nail-art" },
  { label: "Pieds", value: "pieds" },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#accueil" aria-label="Astghid Nails accueil">
          <span>AN</span>
          Astghid Nails
        </a>
        <nav aria-label="Navigation principale">
          <a href="#prestations">Prestations</a>
          <a href="#tarifs">Tarifs</a>
          <a href="#galerie">Galerie</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="header-action" href="#rendez-vous">
          Réserver
        </a>
      </header>

      <section className="hero" id="accueil">
        <div className="hero-copy">
          <p className="eyebrow">{salon.baseline}</p>
          <h1>Des ongles nets, élégants et pensés pour tenir.</h1>
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
            alt="Pose d'ongles nude brillante"
            height={900}
            src="https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=90"
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

      <section className="section" id="prestations">
        <div className="section-heading">
          <p className="eyebrow">Prestations</p>
          <h2>Les soins les plus demandés.</h2>
          <p>
            Une carte volontairement claire pour réserver rapidement le bon
            créneau, sans mauvaise surprise.
          </p>
        </div>

        <div className="service-grid">
          {featuredServices.map((service) => (
            <article className="service-card" key={service.id}>
              <span>{service.duration} min</span>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <strong>{service.price}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="split-section" id="tarifs">
        <div className="section-heading compact">
          <p className="eyebrow">Tarifs</p>
          <h2>Prix lisibles, durée indiquée.</h2>
          <p>
            Les tarifs sont centralisés dans <code>src/data/site.ts</code> pour
            rester faciles à modifier.
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
            choisie dans le stockage local du projet.
          </p>
        </div>
        <BookingForm />
      </section>

      <section className="section" id="galerie">
        <div className="section-heading">
          <p className="eyebrow">Galerie</p>
          <h2>Inspirations et finitions.</h2>
          <p>
            Des visuels réalistes pour montrer l&apos;univers du salon et orienter
            le choix avant le rendez-vous.
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

      <section className="promo-section">
        <div className="section-heading compact">
          <p className="eyebrow">Promotions</p>
          <h2>Offres du moment.</h2>
        </div>
        <div className="promo-grid">
          {promotions.map((promotion) => (
            <article key={promotion.title}>
              <span>{promotion.price}</span>
              <h3>{promotion.title}</h3>
              <p>{promotion.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section">
        <div>
          <p className="eyebrow">À propos</p>
          <h2>Une onglerie calme, précise et orientée résultat.</h2>
        </div>
        <p>
          Astghid Nails accueille chaque cliente avec une analyse rapide de la
          base naturelle, du style souhaité et du rythme de retouche. Le but :
          une pose belle le jour même, mais aussi propre à porter au quotidien.
        </p>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-card">
          <p className="eyebrow">Contact</p>
          <h2>Passer au salon ou réserver en ligne.</h2>
          <div className="contact-list">
            <a href={`tel:${salon.phone}`}>{salon.phone}</a>
            <a href={`mailto:${salon.email}`}>{salon.email}</a>
            <span>{salon.address}</span>
            <div className="social-row">
              <a href={salon.whatsapp}>WhatsApp</a>
              <a href={salon.instagram}>Instagram</a>
              <a href={salon.facebook}>Facebook</a>
            </div>
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
