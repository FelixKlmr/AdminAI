import { NextResponse } from 'next/server'
import { getTokens } from '@/lib/tokens'

export async function GET() {
  const { accessToken } = getTokens()
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const division = process.env.EXACT_DIVISION
  const BASE = 'https://start.exactonline.nl/api/v1'

  try {
    // Haal alle leveranciers op
    const accRes = await fetch(`${BASE}/${division}/crm/Accounts?$filter=IsSupplier eq true&$top=250&$select=ID,Name,GLAccountPurchase,PurchaseVATCode,PaymentConditionPurchase,AutomaticProcessProposedEntry`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    const accData = await accRes.json()
    const suppliers = accData?.d || []

    // Haal transactieregels op — vang fouten op
    let lines: any[] = []
    try {
      const txRes = await fetch(`${BASE}/${division}/sync/Financial/TransactionLines?$top=1000&$select=ID,Account,GLAccount,VATCode,AmountDC,Date,Type`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      })
      const txData = await txRes.json()
      lines = txData?.d || []
    } catch {
      // Geen transactiehistorie beschikbaar, ga verder zonder
    }

    // Groepeer transacties per leverancier
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

    // Bepaal welke leveranciers consistent zijn
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
