import { NextResponse } from 'next/server'
import { getTokens } from '@/lib/tokens'

export async function GET() {
  const { accessToken } = getTokens()
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const division = process.env.EXACT_DIVISION
  const BASE = 'https://start.exactonline.nl/api/v1'

  // Haal alle leveranciers op zonder $select zodat we alle velden zien
  const res = await fetch(`${BASE}/${division}/crm/Accounts?$filter=IsSupplier eq true&$top=3`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  const data = await res.json()
  const accounts = data?.d || []

  // Filter alle velden die "auto", "book", "purchase", "invoice" bevatten (case insensitive)
  const relevantFields: Record<string, any>[] = []
  for (const acc of accounts) {
    const filtered: Record<string, any> = { Name: acc.Name, ID: acc.ID }
    for (const key of Object.keys(acc)) {
      const lower = key.toLowerCase()
      if (lower.includes('auto') || lower.includes('book') || lower.includes('purchase') || lower.includes('invoice') || lower.includes('gl')) {
        filtered[key] = acc[key]
      }
    }
    relevantFields.push(filtered)
  }

  return NextResponse.json(relevantFields, { status: 200 })
}
