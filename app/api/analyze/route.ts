import { NextResponse } from 'next/server'
import { getTokens } from '@/lib/tokens'

export async function GET(req: Request) {
  const { accessToken } = getTokens()
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const url = new URL(req.url)
  const division = url.searchParams.get('division') || process.env.EXACT_DIVISION
  const BASE = 'https://start.exactonline.nl/api/v1'

  try {
    const accRes = await fetch(`${BASE}/${division}/crm/Accounts?$filter=IsSupplier eq true&$top=250&$select=ID,Name,GLAccountPurchase,PurchaseVATCode,PaymentConditionPurchase,AutomaticProcessProposedEntry`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    const accRaw = await accRes.text()
    const accData = JSON.parse(accRaw)

    let suppliers: any[] = []
    if (Array.isArray(accData?.d)) suppliers = accData.d
    else if (Array.isArray(accData?.d?.results)) suppliers = accData.d.results
    else return NextResponse.json({ error: 'Onverwacht formaat: ' + accRaw.slice(0, 300) }, { status: 500 })

    let lines: any[] = []
    try {
      const txRes = await fetch(`${BASE}/${division}/sync/Financial/TransactionLines?$top=1000&$select=ID,Account,GLAccount,VATCode,AmountDC,Date,Type`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      })
      const txData = await txRes.json()
      if (Array.isArray(txData?.d)) lines = txData.d
      else if (Array.isArray(txData?.d?.results)) lines = txData.d.results
    } catch { /* geen historie */ }

    const bySupplier: Record<string, { glAccounts: Set<string>, vatCodes: Set<string>, count: number }> = {}
    for (const line of lines) {
      if (!line.Account || !line.GLAccount) continue
      if (!bySupplier[line.Account]) {
        bySupplier[line.Account] = { glAccounts: new Set(), vatCodes: new Set(), count: 0 }
      }
      bySupplier[line.Account].glAccounts.add(line.GLAccount)
      if (line.VATCode) bySupplier[line.Account].vatCodes.add(line.VATCode)
      bySupplier[line.Account].count++
    }

    const results = suppliers.map((s: any) => {
      const history = bySupplier[s.ID]
      const isConsistent = history && history.glAccounts.size === 1 && history.count >= 2
      const alreadyAuto = s.AutomaticProcessProposedEntry === 1
      return {
        id: s.ID,
        name: s.Name,
        currentGLAccount: s.GLAccountPurchase,
        currentVATCode: s.PurchaseVATCode,
        currentPaymentCondition: s.PaymentConditionPurchase,
        alreadyAuto,
        history: history ? {
          transactions: history.count,
          glAccounts: [...history.glAccounts],
          vatCodes: [...history.vatCodes],
          consistent: isConsistent,
        } : null,
        canAutomate: isConsistent && !alreadyAuto,
      }
    })

    return NextResponse.json({ suppliers: results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
