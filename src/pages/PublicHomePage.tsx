import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './PublicHomePage.css'
import logo from '../../assets/icons/hapke_logo.png'
import iphoneFrame from '../assets/iphone-frame.png'

const uspItems = [
  {
    title: 'Lage commissie',
    description: 'Start op 12% en daalt naar 3% bij volume.',
    icon: 'payments',
  },
  {
    title: 'Geen extra tablet nodig',
    description: 'Werkt met je eigen telefoon of bestaande schermen.',
    icon: 'devices',
  },
  {
    title: 'Geschikt voor kassasystemen',
    description: 'Past in bestaande kassasystemen en workflows.',
    icon: 'point_of_sale',
  },
]

const steps = [
  { title: 'Gesprek inplannen', icon: 'event' },
  { title: 'Aanmelden als partner', icon: 'groups' },
  { title: "Video's opnemen (met onze hulp)", icon: 'videocam' },
  { title: "Menu & video's uploaden", icon: 'cloud_upload' },
  { title: 'Live gaan & eerste bestellingen', icon: 'rocket_launch' },
]

export default function PublicHomePage() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.ph-reveal'))
    if (!elements.length) return

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  const revealStyle = (delay: number) =>
    ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties)

  return (
    <div className="ph-page" id="top">
      <header className="ph-header">
        <div className="ph-brand">
          <img src={logo} alt="Hapke" />
          <strong>Hapke</strong>
        </div>
        <div className="ph-nav-actions">
          <Link to="/login" className="ph-btn ghost">
            Inloggen
          </Link>
          <Link to="/register" className="ph-btn primary">
            Restaurant aanmelden
          </Link>
        </div>
      </header>

      <main>
        <section className="ph-hero">
          <div className="ph-hero-copy">
            <p className="ph-pill">Voor restaurants</p>
            <h1 className="ph-hero-title ph-reveal" style={revealStyle(0)}>
              Meer bestellingen. Lagere commissie.
            </h1>
            <p className="ph-hero-sub">
              Video en bezorgen in één platform.
              <span className="ph-hero-region">Nijmegen (en omgeving)</span>
            </p>
            <div className="ph-cta-row">
              <a className="ph-btn primary lg" href="#hoe-werkt-het">
                Bekijk hoe het werkt
              </a>
            </div>
          </div>
        <div className="ph-hero-media" id="hapke-video">
          <div className="ph-live-floating">Live demo</div>
          <div className="phoneWrap">
            <div className="screen">
              <video
                className="screenVideo"
                src="/16423978-uhd_2160_3840_25fps.mp4"
                muted
                playsInline
                loop
                autoPlay
              />
              <div className="ph-iphone-notch" aria-hidden="true" />
              <div className="ph-media-overlay">
                <div className="ph-app-topbar">
                  <button className="ph-top-icon">←</button>
                  <div className="ph-media-titlebar">Video&apos;s</div>
                  <div className="ph-top-actions">
                    <button className="ph-top-icon">↻</button>
                    <button className="ph-top-icon">🔇</button>
                  </div>
                </div>
                <div className="ph-media-actions">
                  <button className="ph-icon-btn heart" aria-label="Like">
                    <span className="material-icon">favorite</span>
                    <span className="ph-count">124</span>
                  </button>
                  <button className="ph-icon-btn bubble" aria-label="Comments">
                    <span className="material-icon">chat_bubble_outline</span>
                    <span className="ph-count">36</span>
                  </button>
                  <button className="ph-icon-btn bubble" aria-label="Delen">
                    <span className="material-icon">share</span>
                  </button>
                </div>
                <div className="ph-media-bottom">
                  <p className="ph-media-label">Pizzeria Napoli</p>
                  <h3 className="ph-media-title">Prik water</h3>
                  <button className="ph-btn primary lg ph-order-btn">Bestel</button>
                </div>
                <div className="ph-app-bottombar">
                  <div className="ph-bottom-progress" />
                  <div className="ph-bottom-nav">
                    <button className="ph-bottom-item">
                      <span className="material-icon">explore</span>
                      <small>Ontdek</small>
                    </button>
                    <button className="ph-bottom-item active">
                      <span className="material-icon">smart_display</span>
                      <small>Video&apos;s</small>
                    </button>
                    <button className="ph-bottom-item">
                      <span className="material-icon">shopping_bag</span>
                      <small>MANDDD!!</small>
                    </button>
                    <button className="ph-bottom-item">
                      <span className="material-icon">group</span>
                      <small>Vrienden</small>
                    </button>
                    <button className="ph-bottom-item">
                      <span className="material-icon">person</span>
                      <small>Account</small>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <img className="frameOverlay" src={iphoneFrame} alt="Hapke app preview" draggable="false" />
          </div>
        </div>
      </section>

        <section className="ph-section ph-usp">
          <div className="ph-section-inner ph-split">
            <div className="ph-section-copy">
              <h2 className="ph-reveal" style={revealStyle(0)}>
                Waarom Hapke?
              </h2>
              <p className="ph-section-sub ph-reveal" style={revealStyle(80)}>
                Rustige, voorspelbare kosten en een setup die past bij je dagelijkse
                workflow.
              </p>
              <ul className="ph-usp-list ph-reveal" style={revealStyle(140)}>
                {uspItems.map((item, idx) => (
                  <li key={item.title} className="ph-usp-item">
                    <span className="ph-usp-icon" aria-hidden="true">
                      <span className="material-icon">{item.icon}</span>
                    </span>
                    <div>
                      <p className="ph-usp-title">{item.title}</p>
                      <p className="ph-usp-text">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="ph-section-visual ph-reveal" style={revealStyle(320)}>
              <div className="ph-usp-panel">
                <span className="ph-usp-eyebrow">Commissie</span>
                <div className="ph-usp-metric">
                  <span>12%</span>
                  <span className="ph-usp-arrow" aria-hidden="true">
                    →
                  </span>
                  <span>3%</span>
                </div>
                <div className="ph-usp-track" aria-hidden="true">
                  <span className="ph-usp-fill" />
                </div>
                <p className="ph-usp-caption">Daalt automatisch bij volume.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="ph-section ph-steps" id="hoe-werkt-het">
          <div className="ph-section-inner ph-split reverse">
            <div className="ph-section-copy">
              <h2 className="ph-reveal" style={revealStyle(0)}>
                Hoe werkt het?
              </h2>
              <p className="ph-steps-sub ph-reveal" style={revealStyle(80)}>
                Binnen 5-10 minuten live.
              </p>
            </div>
            <div className="ph-section-visual ph-reveal" style={revealStyle(160)}>
              <div className="ph-roadmap" role="list">
                <svg
                  className="ph-roadmap-path"
                  viewBox="0 0 1000 300"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id="ph-roadmap-gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="55%" stopColor="#14b8a6" />
                      <stop offset="70%" stopColor="#ffc857" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 120 96 C 200 10, 250 280, 300 234 C 360 200, 420 20, 500 75 C 580 130, 630 300, 700 240 C 760 200, 820 20, 880 96"
                    stroke="url(#ph-roadmap-gradient)"
                  />
                </svg>
                {steps.map((step, idx) => (
                  <div
                    className="ph-roadmap-node"
                    data-step={idx + 1}
                    key={step.title}
                    role="listitem"
                  >
                    <span className="ph-roadmap-dot" aria-hidden="true" />
                    <div className="ph-roadmap-card">
                      <div className="ph-roadmap-icon" aria-hidden="true">
                        <span className="material-icon">{step.icon}</span>
                      </div>
                      <div className="ph-roadmap-text">
                        <span className="ph-roadmap-index">Stap {idx + 1}</span>
                        <p className="ph-roadmap-title">{step.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ph-section ph-costs">
          <div className="ph-section-inner">
            <div className="ph-costs-inner">
              <div>
                <p className="ph-pill ghost">Tarieven</p>
                <h2 className="ph-reveal" style={revealStyle(0)}>
                  Start op 12%. Groei naar 3%.
                </h2>
                <div className="ph-costs-details ph-reveal" style={revealStyle(80)}>
                  <p className="ph-costs-note">Geldt voor de eerste 10 bedrijven.</p>
                  <p className="ph-costs-sub">
                    We belonen groei. Hoe meer bestellingen via Hapke, hoe lager je commissie.
                  </p>
                  <ul className="ph-costs-tiers">
                    <li>600 orders → 10%</li>
                    <li>1.400 orders → 8%</li>
                    <li>2.800 orders → 3%</li>
                  </ul>
                  <p className="ph-costs-footnote">
                    Staffels gelden op basis van totaal aantal bestellingen.
                  </p>
                  <ul>
                    <li>Geen opstartkosten</li>
                    <li>Geen abonnement</li>
                    <li>Opzegbaar wanneer je wilt</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ph-section ph-local">
          <div className="ph-section-inner ph-split">
            <div className="ph-section-copy">
              <p className="ph-pill ghost">Lokaal & sociaal</p>
              <h2 className="ph-reveal" style={revealStyle(0)}>
                Gebouwd met restaurants in Nijmegen.
              </h2>
              <div className="ph-local-text ph-reveal" style={revealStyle(80)}>
                <p className="ph-local-sub">
                  Lokaal gestart en samen ontwikkeld met Nijmeegse ondernemers. Geen anoniem
                  platform, maar directe lijnen.
                </p>
                <p className="ph-local-sub">
                  Ideeën voor de app of het dashboard? We luisteren en passen snel aan.
                </p>
              </div>
            </div>
            <div className="ph-section-visual ph-reveal" style={revealStyle(200)}>
              <div className="ph-local-panel">
                <span className="material-icon" aria-hidden="true">
                  verified
                </span>
                <div>
                  <p>Lokale partners</p>
                  <span>Logo’s en quotes kunnen hier geplaatst worden.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ph-cta-final">
          <div>
            <h3>Word partner – binnen 5 minuten live</h3>
            <p>Geen contract. Binnen 5 minuten live.</p>
          </div>
          <div className="ph-cta-final-actions">
            <Link to="/register" className="ph-btn primary lg">
              Word partner
            </Link>
          </div>
        </section>

        <footer className="ph-footer">
          <div className="ph-footer-inner">
            <div className="ph-footer-top">
              <div className="ph-footer-brand">
                <img src={logo} alt="Hapke" />
                <div>
                  <strong>Hapke</strong>
                  <p>Video + bezorgen in één platform voor restaurants.</p>
                </div>
              </div>
              <div className="ph-footer-social">
                <span>Volg ons</span>
                <div className="ph-footer-social-links">
                  <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                    <span className="material-icon">photo_camera</span>
                  </a>
                  <a href="https://www.tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">
                    <span className="material-icon">play_circle</span>
                  </a>
                  <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                    <span className="material-icon">work</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="ph-footer-grid">
              <div className="ph-footer-col">
                <h4>Voor restaurants</h4>
                <a href="#hoe-werkt-het">Hoe werkt het</a>
                <Link to="/register">Restaurant aanmelden</Link>
                <Link to="/login">Inloggen</Link>
                <a href="mailto:partners@hapke.nl">Gesprek inplannen</a>
              </div>
              <div className="ph-footer-col">
                <h4>Bedrijf</h4>
                <a href="mailto:info@hapke.nl">Contact</a>
                <a href="mailto:info@hapke.nl?subject=Partner%20worden">Partner worden</a>
                <a href="mailto:info@hapke.nl?subject=Vacature">Vacatures</a>
              </div>
              <div className="ph-footer-col">
                <h4>Support</h4>
                <a href="mailto:support@hapke.nl">Hulp nodig?</a>
                <a href="mailto:feedback@hapke.nl">Feedback & ideeën</a>
                <a href="mailto:privacy@hapke.nl">Privacyvragen</a>
              </div>
              <div className="ph-footer-col">
                <h4>Juridisch</h4>
                <a href="/voorwaarden">Algemene voorwaarden</a>
                <a href="/privacy">Privacy</a>
                <a href="/cookies">Cookieverklaring</a>
              </div>
            </div>

            <div className="ph-footer-bottom">
              <span>© 2026 Hapke. Alle rechten voorbehouden.</span>
              <div className="ph-footer-legal">
                <a href="/voorwaarden">Voorwaarden</a>
                <a href="/privacy">Privacy</a>
                <a href="/cookies">Cookies</a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <a className="ph-back-to-top" href="#top" aria-label="Terug naar boven">
        <span className="material-icon">north</span>
      </a>
    </div>
  )
}
