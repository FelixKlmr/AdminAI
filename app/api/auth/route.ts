// app/api/auth/route.ts
import { getAuthUrl } from '@/lib/exact'
import { redirect } from 'next/navigation'

export async function GET() {
  const url = getAuthUrl()
  redirect(url)
}
