import { NextResponse } from 'next/server'
import { getTokens } from '@/lib/tokens'

export async function GET() {
  const { accessToken } = getTokens()
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const BASE = 'https://start.exactonline.nl/api/v1'

  const endpoints = [
    `/current/Me?$select=CurrentDivision,DivisionCustomer,DivisionCustomerCode,FullName`,
    `/hrm/Divisions?$select=Code,Description,HID`,
    `/system/Divisions?$select=Code,Description,HID`,
  ]

  const results: Record<string, any> = {}
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
