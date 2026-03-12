'use client'
import { useState, useEffect } from 'react'

type Division = { code: string; name: string }
type Supplier = {
  id: string; name: string
  currentGLAccount: string | null; currentVATCode: string | null; currentPaymentCondition: string | null
  alreadyAuto: boolean; canAutomate: boolean
  history: { transactions: number; glAccounts: string[]; vatCodes: string[]; consistent: boolean } | null
  processing?: boolean; done?: boolean; error?: string
}

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; }
  .wrap { max-width: 900px; margin: 0 auto; padding: 40px 24px; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; }
  .logo { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #e8f5a3; letter-spacing: -1px; }
  .logout { font-size: 11px; color: #444; text-decoration: none; letter-spacing: 1px; text-transform: uppercase; }
  .logout:hover { color: #666; }
  .section-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #333; margin-bottom: 12px; margin-top: 32px; }
  .stats { display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; }
  .stat-card { background: #111; border: 1px solid #1e1e1e; padding: 20px 24px; flex: 1; min-width: 140px; }
  .stat-num { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: #e8f5a3; }
  .stat-label { font-size: 11px; color: #444; margin-top: 4px; letter-spacing: 1px; }
  .div-card { background: #0d0d0d; border: 1px solid #1a1a1a; padding: 20px 24px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: border-color 0.15s; }
  .div-card:hover { border-color: #e8f5a3; }
  .div-card.active { border-color: #e8f5a3; background: #111; }
  .div-name { font-size: 14px; color: #ddd; font-family: 'Syne', sans-serif; font-weight: 700; }
  .div-code { font-size: 11px; color: #444; margin-top: 3px; }
  .add-form { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
  .input { background: #0d0d0d; border: 1px solid #222; color: #ddd; font-family: 'DM Mono', monospace; font-size: 12px; padding: 10px 14px; outline: none; flex: 1; min-width: 120px; }
  .input:focus { border-color: #444; }
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #e8f5a3; color: #0a0a0a; font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; letter-spacing: 1px; border: none; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
  .btn:hover:not(:disabled) { background: #f0ff99; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-ghost { background: transparent; border: 1px solid #222; color: #444; }
  .btn-ghost:hover:not(:disabled) { background: #111; color: #666; border-color: #333; }
  .supplier-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #141414; background: #0d0d0d; gap: 12px; }
  .supplier-row:hover { background: #111; }
  .supplier-name { font-size: 13px; color: #ddd; }
  .supplier-meta { font-size: 11px; color: #444; margin-top: 3px; }
  .badge { font-size: 10px; padding: 3px 8px; letter-spacing: 1px; text-transform: uppercase; border-radius: 2px; white-space: nowrap; }
  .badge-green { background: #0d2010; color: #a8ff78; border: 1px solid #1a4020; }
  .badge-gray { background: #141414; color: #444; border: 1px solid #1e1e1e; }
  .badge-red { background: #1a0808; color: #ff6b6b; border: 1px solid #2a1010; }
  .btn-small { font-size: 11px; padding: 6px 14px; background: #e8f5a3; color: #0a0a0a; font-family: 'DM Mono', monospace; letter-spacing: 1px; border: none; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
  .btn-small:hover:not(:disabled) { background: #f0ff99; }
  .btn-small:disabled { opacity: 0.4; cursor: not-allowed; }
  .spinner { width: 12px; height: 12px; border: 2px solid #0a0a0a; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
  .spinner-white { width: 12px; height: 12px; border: 2px solid #333; border-top-color: #e8f5a3; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading { color: #333; font-size: 13px; padding: 40px 0; text-align: center; display: flex; align-items: center; justify-content: center; gap: 12px; }
  .error-msg { color: #ff6b6b; font-size: 12px; padding: 16px; background: #1a0808; border: 1px solid #2a1010; margin-bottom: 16px; }
  .back-btn { font-size: 11px; color: #444; background: none; border: none; cursor: pointer; letter-spacing: 1px; text-transform: uppercase; font-family: 'DM Mono', monospace; padding: 0; }
  .back-btn:hover { color: #666; }
  .delete-btn { font-size: 10px; color: #333; background: none; border: none; cursor: pointer; padding: 4px 8px; font-family: 'DM Mono', monospace; }
  .delete-btn:hover { color: #ff6b6b; }
`

export default function Dashboard() {
  const [view, setView] = useState<'divisions' | 'analyze'>('divisions')
  const [divisions, setDivisions] = useState<Division[]>([])
  const [selectedDiv, setSelectedDiv] = useState<Division | null>(null)
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetch('/api/divisions').then(r => r.json()).then(d => {
      setDivisions(d.divisions || [])
    })
  }, [])

  const addDivision = async () => {
    if (!newCode || !newName) return
    setAdding(true)
    const res = await fetch('/api/divisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: newCode, name: newName }),
    })
    const data = await res.json()
    setDivisions(data.divisions || [])
    setNewCode('')
    setNewName('')
    setAdding(false)
  }

  const deleteDivision = async (code: string) => {
    const res = await fetch('/api/divisions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    setDivisions(data.divisions || [])
  }

  const analyze = async (div: Division) => {
    setSelectedDiv(div)
    setView('analyze')
    setLoading(true)
    setError('')
    setSuppliers([])

    const res = await fetch(`/api/analyze?division=${div.code}`)
    const text = await res.text()
    try {
      const data = JSON.parse(text)
      if (data.error) setError(data.error)
      else {
        const list = Array.isArray(data.suppliers) ? data.suppliers : []
        setSuppliers(list)
      }
    } catch {
      setError('Kon response niet verwerken: ' + text.slice(0, 200))
    }
    setLoading(false)
  }

  const automateOne = async (supplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, processing: true } : s))
    const glAccount = supplier.history?.glAccounts[0] || supplier.currentGLAccount
    const vatCode = supplier.history?.vatCodes[0] || supplier.currentVATCode
    const res = await fetch('/api/autobook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplierID: supplier.id, glAccount, vatCode, paymentCondition: supplier.currentPaymentCondition, division: selectedDiv?.code }),
    })
    const data = await res.json()
    setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, processing: false, done: data.success, error: data.error, alreadyAuto: data.success } : s))
  }

  const automateAll = async () => {
    setProcessing(true)
    for (const s of suppliers.filter(s => s.canAutomate && !s.done)) {
      await automateOne(s)
    }
    setProcessing(false)
  }

  const canAutomate = suppliers.filter(s => s.canAutomate && !s.done)
  const alreadyAuto = suppliers.filter(s => s.alreadyAuto || s.done)
  const noHistory = suppliers.filter(s => !s.history && !s.alreadyAuto && !s.canAutomate)

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: "'DM Mono', monospace" }}>
      <style>{S}</style>
      <div className="wrap">
        <div className="header">
          <div className="logo">AdminAI</div>
          {view === 'analyze'
            ? <button className="back-btn" onClick={() => setView('divisions')}>← Administraties</button>
            : <a href="/" className="logout">← Uitloggen</a>
          }
        </div>

        {view === 'divisions' && (
          <>
            <div className="section-label">Mijn administraties</div>

            {divisions.length === 0 && (
              <div style={{ color: '#333', fontSize: 12, marginBottom: 24 }}>
                Nog geen administraties toegevoegd. Voeg een divisiecode toe om te beginnen.
              </div>
            )}

            {divisions.map(d => (
              <div key={d.code} className="div-card" onClick={() => analyze(d)}>
                <div>
                  <div className="div-name">{d.name}</div>
                  <div className="div-code">Divisiecode: {d.code}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="delete-btn" onClick={e => { e.stopPropagation(); deleteDivision(d.code) }}>✕</button>
                  <span style={{ fontSize: 11, color: '#444', letterSpacing: 1 }}>ANALYSEREN →</span>
                </div>
              </div>
            ))}

            <div className="section-label">Administratie toevoegen</div>
            <div className="add-form">
              <input
                className="input"
                placeholder="Divisiecode (bijv. 3993521)"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
              />
              <input
                className="input"
                placeholder="Naam (bijv. Fortuna Vivere B.V.)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <button className="btn" onClick={addDivision} disabled={adding || !newCode || !newName}>
                {adding ? <span className="spinner" /> : 'TOEVOEGEN →'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#333', marginTop: 12 }}>
              De divisiecode vind je in Exact Online in de URL achter ?_Division_=
            </div>
          </>
        )}

        {view === 'analyze' && (
          <>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>
              {selectedDiv?.name} — divisie {selectedDiv?.code}
            </div>

            {loading && <div className="loading"><span className="spinner-white" /> Leveranciers analyseren...</div>}
            {error && <div className="error-msg">Fout: {error}</div>}

            {!loading && !error && (
              <>
                <div className="stats">
                  <div className="stat-card"><div className="stat-num">{canAutomate.length}</div><div className="stat-label">Klaar voor automatisch boeken</div></div>
                  <div className="stat-card"><div className="stat-num">{alreadyAuto.length}</div><div className="stat-label">Al ingesteld</div></div>
                  <div className="stat-card"><div className="stat-num">{noHistory.length}</div><div className="stat-label">Onvoldoende historie</div></div>
                  <div className="stat-card"><div className="stat-num">{suppliers.length}</div><div className="stat-label">Totaal leveranciers</div></div>
                </div>

                {canAutomate.length > 0 && (
                  <button className="btn" onClick={automateAll} disabled={processing} style={{ marginBottom: 24 }}>
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
                          <div className="supplier-meta">{s.history?.transactions} boekingen — BTW: {s.history?.vatCodes[0] || 'geen'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {s.done && <span className="badge badge-green">✓ INGESTELD</span>}
                          {s.error && <span className="badge badge-red">FOUT</span>}
                          {!s.done && <button className="btn-small" onClick={() => automateOne(s)} disabled={s.processing}>{s.processing ? <span className="spinner" /> : 'INSTELLEN →'}</button>}
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

                {suppliers.length === 0 && <div className="loading">Geen leveranciers gevonden.</div>}
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
