// app/api/proposals/route.ts
import { getProposals } from '@/lib/exact'
import { getTokens } from '@/lib/tokens'
import { NextResponse } from 'next/server'

export async function GET() {
  const { accessToken } = getTokens()
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const proposals = await getProposals(accessToken)
    return NextResponse.json({ proposals })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
