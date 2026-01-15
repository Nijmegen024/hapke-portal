import React from 'react'
import { Link } from 'react-router-dom'
import './PublicHomePage.css'
import logo from '../../assets/icons/hapke_logo.png'
import iphoneFrame from '../assets/iphone-frame.png'

const proofCards = [
  { title: 'Tot 30% meer bestellingen via video', icon: 'trending_up' },
  {
    title: 'Commissie daalt mee',
    icon: 'payments',
    highlight: true,
    lines: ['Start op 12%', 'Daalt automatisch naar 3% bij volume'],
  },
  { title: 'Keuze: eigen bezorgers of Hapke', icon: 'local_shipping' },
  { title: 'Alles in een dashboard', icon: 'dashboard' },
]

const steps = [
  { title: 'Restaurant aanmelden', icon: 'person_add' },
  { title: "Upload menu & korte video's (met je telefoon)", icon: 'smartphone' },
  { title: 'Bestellingen ontvangen', icon: 'receipt_long' },
]

export default function PublicHomePage() {
  return (
    <div className="ph-page">
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
          <div className="ph-hero-copy ph-anim">
            <p className="ph-pill">Voor restaurants</p>
            <h1>
              <span className="ph-hero-line primary">Meer bestellingen.</span>
              <span className="ph-hero-line secondary">Lagere commissie.</span>
              <span className="ph-hero-line tertiary">Volledige controle.</span>
            </h1>
            <p className="ph-hero-sub">
              Video + bezorgen in een platform voor restaurants.
              <span className="ph-hero-region">Nijmegen (en omgeving)</span>
            </p>
            <div className="ph-cta-row">
              <a className="ph-btn ghost lg" href="#hoe-werkt-het">
                Zo werkt het
              </a>
            </div>
          </div>
        <div className="ph-hero-media ph-anim" id="hapke-video">
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

        <section className="ph-story">
          <section className="ph-proof">
            <h2>Waarom Hapke?</h2>
            <div className="ph-card-grid">
              {proofCards.map((card) => (
                <div className={`ph-card${card.highlight ? ' highlight' : ''}`} key={card.title}>
                  <div className="ph-card-icon" aria-hidden="true">
                    <span className="material-icon">{card.icon}</span>
                  </div>
                  <div className="ph-card-body">
                    <p className="ph-card-title">{card.title}</p>
                    {card.highlight && (
                      <div className="ph-commission">
                        <span>12%</span>
                        <span className="ph-commission-line" aria-hidden="true" />
                        <span>3%</span>
                      </div>
                    )}
                    {card.lines && (
                      <div className="ph-card-lines">
                        {card.lines.map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="ph-story-divider" aria-hidden="true" />

          <section className="ph-steps" id="hoe-werkt-het">
            <h2>Hoe werkt het?</h2>
            <p className="ph-steps-sub">Binnen 5-10 minuten live.</p>
            <div className="ph-steps-rail" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="ph-step-grid">
              {steps.map((step, idx) => (
                <div className="ph-step" key={step.title} style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="ph-step-icon" aria-hidden="true">
                    <span className="material-icon">{step.icon}</span>
                  </div>
                  <div>
                    <div className="ph-step-index">{idx + 1}</div>
                    <p>{step.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="ph-costs ph-anim">
          <div className="ph-costs-inner">
            <div>
              <p className="ph-pill ghost">Tarieven</p>
              <h2>Start op 12%. Groei naar 3%.</h2>
              <p className="ph-costs-note">Geldt voor de eerste 10 bedrijven.</p>
              <p className="ph-costs-sub">
                We belonen groei. Hoe meer bestellingen via Hapke, hoe lager je commissie.
              </p>
              <ul className="ph-costs-tiers">
                <li>1.000 orders → 10%</li>
                <li>2.500 orders → 8%</li>
                <li>5.000 orders → 3%</li>
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
        </section>

        <section className="ph-local">
          <div>
            <p className="ph-pill ghost">Lokaal & sociaal</p>
            <h2>Hapke is gebouwd met en voor restaurants in Nijmegen.</h2>
            <p className="ph-local-sub">
              Lokaal gestart. Gericht op groei, niet op uitknijpen. Gebouwd samen met
              Nijmeegse restaurants, niet door een anoniem platform.
            </p>
            <p className="ph-local-sub">
              Heb je ideeen of aanpassingen voor de app of het dashboard om het makkelijker of
              beter te maken? Laat het ons weten, we horen het graag en passen snel aan.
            </p>
          </div>
          <div className="ph-local-placeholder">Logo’s / quotes van lokale partners</div>
        </section>

        <section className="ph-cta-final">
          <div>
            <h3>Start gratis – binnen 5 minuten live</h3>
            <p>Geen contract. Binnen 5 minuten live.</p>
          </div>
          <div className="ph-cta-final-actions">
            <Link to="/register" className="ph-btn primary lg">
              Start gratis
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
