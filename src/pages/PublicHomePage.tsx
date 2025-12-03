import React from 'react'
import { Link } from 'react-router-dom'

const PageSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
    <h2 style={{ marginBottom: 12, color: '#0f172a' }}>{title}</h2>
    <div style={{ color: '#475569', fontSize: 16, lineHeight: 1.6 }}>{children}</div>
  </section>
)

const bulletStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  background: '#e2f5ff',
  color: '#0f172a',
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
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#0ea5e9',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            H
          </div>
          <strong style={{ fontSize: 18, color: '#0f172a' }}>Hapke</strong>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link
            to="/login"
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #0ea5e9',
              color: '#0ea5e9',
              fontWeight: 600,
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
              background: '#0ea5e9',
              color: '#ffffff',
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(14,165,233,0.25)',
            }}
          >
            Voor restaurants
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
            <p style={{ color: '#0ea5e9', fontWeight: 700, marginBottom: 8 }}>
              Voor restaurants
            </p>
            <h1 style={{ fontSize: 36, margin: '0 0 12px', color: '#0f172a' }}>
              Bereik meer klanten met Hapke
            </h1>
            <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
              Combineer video en bezorgen in één platform speciaal voor restaurants.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                to="/register"
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#0ea5e9',
                  color: '#fff',
                  fontWeight: 700,
                  boxShadow: '0 10px 30px rgba(14,165,233,0.25)',
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
                  color: '#0f172a',
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
              color: '#0f172a',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ display: 'block', marginBottom: 8 }}>Waarom Hapke?</strong>
            <ul style={{ paddingLeft: 18, margin: 0, color: '#475569' }}>
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
