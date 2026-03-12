// app/page.tsx
import { getTokens } from '@/lib/tokens'
import { redirect } from 'next/navigation'

export default function Home({ searchParams }: { searchParams: { error?: string } }) {
  const { accessToken } = getTokens()
  if (accessToken) redirect('/dashboard')

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Mono', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        .card {
          background: #111;
          border: 1px solid #222;
          border-radius: 2px;
          padding: 48px;
          max-width: 420px;
          width: 100%;
        }
        .logo {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #e8f5a3;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }
        .sub {
          font-size: 11px;
          color: #444;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 40px;
        }
        .btn {
          display: block;
          width: 100%;
          padding: 14px 24px;
          background: #e8f5a3;
          color: #0a0a0a;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 1px;
          text-decoration: none;
          text-align: center;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn:hover { background: #f0ff99; }
        .error {
          background: #1a0a0a;
          border: 1px solid #3a1a1a;
          color: #ff6b6b;
          font-size: 12px;
          padding: 12px 16px;
          margin-bottom: 20px;
          border-radius: 2px;
        }
        .desc {
          font-size: 12px;
          color: #555;
          line-height: 1.7;
          margin-bottom: 32px;
        }
      `}</style>

      <div className="card">
        <div className="logo">AdminAI</div>
        <div className="sub">Exact Online × Claude</div>

        {searchParams.error && (
          <div className="error">Fout: {searchParams.error}</div>
        )}

        <p className="desc">
          Verwerkt automatisch inkoopfactuurboekingsvoorstellen uit Exact Online.
          Claude bepaalt de grootboekrekening, BTW-code en betalingsconditie op basis
          van historische boekingen en de PDF-inhoud.
        </p>

        <a href="/api/auth" className="btn">
          INLOGGEN MET EXACT ONLINE →
        </a>
      </div>
    </main>
  )
}
