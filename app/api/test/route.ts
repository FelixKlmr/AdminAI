import { NextResponse } from 'next/server'
import { getTokens } from '@/lib/tokens'

export async function GET() {
  const { accessToken } = getTokens()
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const BASE = 'https://start.exactonline.nl/api/v1'

  const results: Record<string, any> = {}

  // Probeer divisies op te halen via verschillende routes
  const endpoints = [
    `/current/Divisions?$select=Code,Description,HID`,
    `/current/Me?$expand=Divisions&$select=CurrentDivision,FullName`,
    // Probeer de DivisionCustomer GUID van de Me response
    `/crm/Accounts(guid'90b0d50e-5c39-4967-981f-76cd95b85957')?$select=ID,Name,Code`,
    // Divisies via accountant
    `/accountancy/Divisions?$select=Code,Description`,
  ]

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${BASE}${ep}`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      })
      const text = await res.text()
      results[ep] = res.status + ' ' + text.slice(0, 400)
    } catch (e: any) {
      results[ep] = e.message
    }
  }

  return NextResponse.json(results)
}
