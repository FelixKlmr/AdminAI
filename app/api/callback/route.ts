// app/api/callback/route.ts
import { exchangeCode } from '@/lib/exact'
import { saveTokens } from '@/lib/tokens'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    redirect(`/?error=${error || 'no_code'}`)
  }

  try {
    const tokens = await exchangeCode(code!)
    saveTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in)
    redirect('/dashboard')
  } catch (e: any) {
    redirect(`/?error=${encodeURIComponent(e.message)}`)
  }
}
