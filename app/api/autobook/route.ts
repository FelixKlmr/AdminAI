import { NextResponse } from 'next/server'
import { getTokens } from '@/lib/tokens'

export async function POST(req: Request) {
  const { accessToken } = getTokens()
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const division = process.env.EXACT_DIVISION
  const BASE = 'https://start.exactonline.nl/api/v1'

  const { supplierID, glAccount, vatCode, paymentCondition } = await req.json()

  const body: Record<string, any> = {
    AutomaticProcessProposedEntry: 1,
  }
  if (glAccount) body.GLAccountPurchase = glAccount
  if (vatCode) body.PurchaseVATCode = vatCode
  if (paymentCondition) body.PaymentConditionPurchase = paymentCondition

  const res = await fetch(`${BASE}/${division}/crm/Accounts(guid'${supplierID}')`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text }, { status: res.status })
  }

  return NextResponse.json({ success: true })
}
