// lib/tokens.ts
// Simple token management via cookies (works serverless/Vercel)

import { cookies } from 'next/headers'

export function saveTokens(accessToken: string, refreshToken: string, expiresIn: number) {
  const cookieStore = cookies()
  const expires = new Date(Date.now() + expiresIn * 1000)
  cookieStore.set('exact_access_token', accessToken, { expires, httpOnly: true, secure: true, sameSite: 'lax' })
  cookieStore.set('exact_refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 })
}

export function getTokens() {
  const cookieStore = cookies()
  return {
    accessToken: cookieStore.get('exact_access_token')?.value,
    refreshToken: cookieStore.get('exact_refresh_token')?.value,
  }
}

export function clearTokens() {
  const cookieStore = cookies()
  cookieStore.delete('exact_access_token')
  cookieStore.delete('exact_refresh_token')
}
