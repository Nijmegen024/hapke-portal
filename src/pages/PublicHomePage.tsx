import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/icons/hapke_logo.png'

const brand = {
  primary: '#14B8A6',
  accent: '#FFC857',
  text: '#0f172a',
  muted: '#475569',
  soft: '#f1f5f9',
}

const PageSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
    <h2 style={{ marginBottom: 12, color: brand.text }}>{title}</h2>
    <div style={{ color: brand.muted, fontSize: 16, lineHeight: 1.6 }}>{children}</div>
  </section>
)

const bulletStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  background: '#d1f6f1',
  color: brand.text,
  marginBottom: 8,
}

export default function PublicHomePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          background: '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logo} alt="Hapke" style={{ height: 36, width: 36, borderRadius: 8 }} />
          <strong style={{ fontSize: 18, color: brand.text }}>Hapke</strong>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link
            to="/login"
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: `1px solid ${brand.primary}`,
              color: brand.primary,
              fontWeight: 600,
              background: '#fff',
            }}
          >
            Inloggen
          </Link>
          <Link
            to="/register"
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: 'none',
              background: brand.primary,
              color: '#ffffff',
              fontWeight: 700,
              boxShadow: `0 8px 24px ${brand.primary}40`,
            }}
          >
            Restaurant aanmelden
          </Link>
        </div>
      </header>

      <main>
        <section
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '60px 20px',
            display: 'grid',
            gap: 24,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            alignItems: 'center',
          }}
        >
          <div>
            <p style={{ color: brand.primary, fontWeight: 700, marginBottom: 8 }}>
              Voor restaurants
            </p>
            <h1 style={{ fontSize: 36, margin: '0 0 12px', color: brand.text }}>
              Bereik meer klanten met Hapke
            </h1>
            <p style={{ color: brand.muted, fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
              Combineer video en bezorgen in één platform speciaal voor restaurants.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                to="/register"
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: brand.primary,
                  color: '#fff',
                  fontWeight: 700,
                  boxShadow: `0 10px 30px ${brand.primary}40`,
                }}
              >
                Maak een gratis account
              </Link>
              <Link
                to="/login"
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  color: brand.text,
                  fontWeight: 600,
                  background: '#fff',
                }}
              >
                Log in
              </Link>
            </div>
          </div>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 12px 36px rgba(0,0,0,0.08)',
              color: brand.text,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ display: 'block', marginBottom: 8 }}>Waarom Hapke?</strong>
            <ul style={{ paddingLeft: 18, margin: 0, color: brand.muted }}>
              <li>Lagere commissie dan Thuisbezorgd</li>
              <li>Video’s van gerechten voor meer bestellingen</li>
              <li>Eigen bezorgers of Hapke-bezorgers mogelijk</li>
              <li>Alles in één portal en app</li>
            </ul>
          </div>
        </section>

        <PageSection title="Hoe werkt het?">
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            <div style={bulletStyle}>1. Meld je restaurant aan</div>
            <div style={bulletStyle}>2. Zet je menu en video’s online</div>
            <div style={bulletStyle}>3. Ontvang bestellingen via app en portal</div>
          </div>
        </PageSection>

        <PageSection title="Kosten">
          <div
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
            }}
          >
            Standaard 12% commissie op orders, geen opstartkosten.
          </div>
        </PageSection>
      </main>
    </div>
  )
}
