'use client'
import { useState, useEffect } from 'react'

type Supplier = {
  id: string
  name: string
  currentGLAccount: string | null
  currentVATCode: string | null
  currentPaymentCondition: string | null
  alreadyAuto: boolean
  canAutomate: boolean
  history: {
    transactions: number
    glAccounts: string[]
    vatCodes: string[]
    consistent: boolean
  } | null
  processing?: boolean
  done?: boolean
  error?: string
}

export default function Dashboard() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetch('/api/analyze')
      .then(async r => {
        const text = await r.text()
        try {
          const data = JSON.parse(text)
          if (data.error) {
            setError(data.error)
          } else {
            const list = Array.isArray(data.suppliers) ? data.suppliers : Array.isArray(data) ? data : []
            setSuppliers(list)
          }
        } catch {
          setError('Kon response niet verwerken: ' + text.slice(0, 200))
        }
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const automateOne = async (supplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, processing: true } : s))

    const glAccount = supplier.history?.glAccounts[0] || supplier.currentGLAccount
    const vatCode = supplier.history?.vatCodes[0] || supplier.currentVATCode

    const res = await fetch('/api/autobook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierID: supplier.id,
        glAccount,
        vatCode,
        paymentCondition: supplier.currentPaymentCondition,
      }),
    })

    const data = await res.json()
    setSuppliers(prev => prev.map(s =>
      s.id === supplier.id
        ? { ...s, processing: false, done: data.success, error: data.error, alreadyAuto: data.success }
        : s
    ))
  }

  const automateAll = async () => {
    setProcessing(true)
    const candidates = suppliers.filter(s => s.canAutomate && !s.done)
    for (const s of candidates) {
      await automateOne(s)
    }
    setProcessing(false)
  }

  const canAutomate = suppliers.filter(s => s.canAutomate && !s.done)
  const alreadyAuto = suppliers.filter(s => s.alreadyAuto || s.done)
  const noHistory = suppliers.filter(s => !s.history && !s.alreadyAuto && !s.canAutomate)

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: "'DM Mono', monospace", padding: '40px 24px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        .wrap { max-width: 900px; margin: 0 auto; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #e8f5a3; letter-spacing: -1px; }
        .logout { font-size: 11px; color: #444; text-decoration: none; letter-spacing: 1px; text-transform: uppercase; }
        .logout:hover { color: #666; }
        .section-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #333; margin-bottom: 12px; margin-top: 32px; }
        .stats { display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; }
        .stat-card { background: #111; border: 1px solid #1e1e1e; padding: 20px 24px; flex: 1; min-width: 140px; }
        .stat-num { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: #e8f5a3; }
        .stat-label { font-size: 11px; color: #444; margin-top: 4px; letter-spacing: 1px; }
        .btn-all {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; background: #e8f5a3; color: #0a0a0a;
          font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500;
          letter-spacing: 1px; border: none; cursor: pointer; margin-bottom: 24px;
          transition: background 0.15s;
        }
        .btn-all:hover:not(:disabled) { background: #f0ff99; }
        .btn-all:disabled { opacity: 0.4; cursor: not-allowed; }
        .supplier-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; border-bottom: 1px solid #141414;
          background: #0d0d0d; gap: 12px;
        }
        .supplier-row:hover { background: #111; }
        .supplier-name { font-size: 13px; color: #ddd; }
        .supplier-meta { font-size: 11px; color: #444; margin-top: 3px; }
        .badge { font-size: 10px; padding: 3px 8px; letter-spacing: 1px; text-transform: uppercase; border-radius: 2px; white-space: nowrap; }
        .badge-green { background: #0d2010; color: #a8ff78; border: 1px solid #1a4020; }
        .badge-gray { background: #141414; color: #444; border: 1px solid #1e1e1e; }
        .badge-red { background: #1a0808; color: #ff6b6b; border: 1px solid #2a1010; }
        .btn-small {
          font-size: 11px; padding: 6px 14px; background: #e8f5a3; color: #0a0a0a;
          font-family: 'DM Mono', monospace; letter-spacing: 1px; border: none;
          cursor: pointer; transition: background 0.15s; white-space: nowrap;
        }
        .btn-small:hover:not(:disabled) { background: #f0ff99; }
        .btn-small:disabled { opacity: 0.4; cursor: not-allowed; }
        .spinner { width: 12px; height: 12px; border: 2px solid #0a0a0a; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading { color: #333; font-size: 13px; padding: 40px 0; text-align: center; }
        .error-msg { color: #ff6b6b; font-size: 12px; padding: 16px; background: #1a0808; border: 1px solid #2a1010; margin-bottom: 16px; }
      `}</style>

      <div className="wrap">
        <div className="header">
          <div className="logo">AdminAI</div>
          <a href="/" className="logout">← Uitloggen</a>
        </div>

        {loading && <div className="loading">Leveranciers analyseren...</div>}
        {error && <div className="error-msg">Fout: {error}</div>}

        {!loading && !error && (
          <>
            <div className="stats">
              <div className="stat-card">
                <div className="stat-num">{canAutomate.length}</div>
                <div className="stat-label">Klaar voor automatisch boeken</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{alreadyAuto.length}</div>
                <div className="stat-label">Al ingesteld</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{noHistory.length}</div>
                <div className="stat-label">Onvoldoende historie</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{suppliers.length}</div>
                <div className="stat-label">Totaal leveranciers</div>
              </div>
            </div>

            {canAutomate.length > 0 && (
              <button className="btn-all" onClick={automateAll} disabled={processing}>
                {processing && <span className="spinner" />}
                ALLE {canAutomate.length} INSTELLEN OP AUTOMATISCH BOEKEN →
              </button>
            )}

            {canAutomate.length > 0 && (
              <>
                <div className="section-label">Klaar voor automatisch boeken</div>
                {canAutomate.map(s => (
                  <div key={s.id} className="supplier-row">
                    <div style={{ flex: 1 }}>
                      <div className="supplier-name">{s.name}</div>
                      <div className="supplier-meta">
                        {s.history?.transactions} boekingen — GB: {s.history?.glAccounts[0]?.slice(0, 8)}... BTW: {s.history?.vatCodes[0] || 'geen'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {s.done && <span className="badge badge-green">✓ INGESTELD</span>}
                      {s.error && <span className="badge badge-red">FOUT</span>}
                      {!s.done && (
                        <button className="btn-small" onClick={() => automateOne(s)} disabled={s.processing}>
                          {s.processing ? <span className="spinner" /> : 'INSTELLEN →'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {alreadyAuto.length > 0 && (
              <>
                <div className="section-label">Al ingesteld op automatisch boeken</div>
                {alreadyAuto.map(s => (
                  <div key={s.id} className="supplier-row">
                    <div style={{ flex: 1 }}>
                      <div className="supplier-name">{s.name}</div>
                      <div className="supplier-meta">BTW: {s.currentVATCode || '—'} — Betaling: {s.currentPaymentCondition || '—'}</div>
                    </div>
                    <span className="badge badge-green">✓ AUTO</span>
                  </div>
                ))}
              </>
            )}

            {noHistory.length > 0 && (
              <>
                <div className="section-label">Onvoldoende boekingshistorie</div>
                {noHistory.map(s => (
                  <div key={s.id} className="supplier-row">
                    <div style={{ flex: 1 }}>
                      <div className="supplier-name">{s.name}</div>
                      <div className="supplier-meta">Nog geen boekingen gevonden</div>
                    </div>
                    <span className="badge badge-gray">OVERGESLAGEN</span>
                  </div>
                ))}
              </>
            )}

            {suppliers.length === 0 && (
              <div className="loading">Geen leveranciers gevonden.</div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
