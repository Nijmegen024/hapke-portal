import React from 'react'
import { Link } from 'react-router-dom'
import './PublicHomePage.css'
import logo from '../../assets/icons/hapke_logo.png'
import iphoneFrame from '../assets/iphone-frame.png'

const proofCards = [
  { title: 'Tot 30% meer bestellingen door video', icon: '' },
  { title: '12% commissie (geen verborgen kosten)', icon: '' },
  { title: 'Eigen bezorgers of Hapke-bezorging', icon: '' },
  { title: 'Alles in één app en portal', icon: '' },
]

const steps = [
  { title: 'Restaurant aanmelden', icon: '' },
  { title: 'Menu & video’s uploaden', icon: '' },
  { title: 'Bestellingen ontvangen', icon: '' },
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
            <h1>Meer bestellingen. Lagere commissie. Volledige controle.</h1>
            <p className="ph-hero-sub">
              Video + bezorgen in één platform, speciaal voor restaurants.
            </p>
            <div className="ph-cta-row">
              <Link to="/register" className="ph-btn primary lg">
                Start gratis – geen contract
              </Link>
              <a className="ph-btn ghost lg" href="#hapke-video">
                Bekijk hoe Hapke werkt (30 sec)
              </a>
            </div>
          </div>
        <div className="ph-hero-media ph-anim" id="hapke-video">
          <div className="phoneWrap">
            <div className="screen">
              <video
                className="screenVideo"
                src="https://fyveoxtiwzzaarfltvrj.supabase.co/storage/v1/object/public/Restaurant-media/cmikduk8p0001roebleqt4b22/1766254304749.MOV"
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

        <section className="ph-cta-repeat ph-anim">
          <div className="ph-cta-repeat-inner">
            <div>
              <strong>Start gratis – binnen 5 minuten live</strong>
              <p>Geen contract, geen opstartkosten, direct aan de slag.</p>
            </div>
            <Link to="/register" className="ph-btn primary">
              Start gratis
            </Link>
          </div>
        </section>

        <section className="ph-proof">
          <h2>Waarom Hapke?</h2>
          <div className="ph-card-grid">
            {proofCards.map((card) => (
              <div className="ph-card" key={card.title}>
                <span className="ph-card-icon">{card.icon}</span>
                <p>{card.title}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ph-steps">
          <h2>Hoe werkt het?</h2>
          <div className="ph-step-grid">
            {steps.map((step, idx) => (
              <div className="ph-step" key={step.title} style={{ animationDelay: `${idx * 80}ms` }}>
                <div className="ph-step-icon">{step.icon}</div>
                <div>
                  <div className="ph-step-index">{idx + 1}</div>
                  <p>{step.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ph-costs ph-anim">
          <div className="ph-costs-inner">
            <div>
              <p className="ph-pill ghost">Tarieven</p>
              <h2>12% commissie</h2>
              <ul>
                <li>Geen opstartkosten</li>
                <li>Geen abonnement</li>
                <li>Opzegbaar wanneer je wilt</li>
              </ul>
              <Link to="/register" className="ph-btn primary lg">
                Start gratis
              </Link>
            </div>
          </div>
        </section>

        <section className="ph-local">
          <div>
            <p className="ph-pill ghost">Lokaal & sociaal</p>
            <h2>Hapke is gebouwd met en voor restaurants in Nijmegen.</h2>
            <p className="ph-local-sub">
              Lokaal gestart. Gericht op groei, niet op uitknijpen.
            </p>
          </div>
          <div className="ph-local-placeholder">Logo’s / quotes van lokale partners</div>
        </section>

        <section className="ph-cta-final">
          <div>
            <h3>Start gratis – binnen 5 minuten live</h3>
            <p>Activeer je restaurant, upload menu & video’s, ontvang bestellingen.</p>
          </div>
          <div className="ph-cta-final-actions">
            <Link to="/register" className="ph-btn primary lg">
              Start gratis
            </Link>
            <Link to="/login" className="ph-btn ghost lg">
              Inloggen
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
