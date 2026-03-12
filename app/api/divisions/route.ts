import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const COOKIE = 'adminai_divisions'

export async function GET() {
  const cookieStore = cookies()
  const raw = cookieStore.get(COOKIE)?.value
  const divisions = raw ? JSON.parse(raw) : []
  return NextResponse.json({ divisions })
}

export async function POST(req: Request) {
  const { code, name } = await req.json()
  if (!code || !name) return NextResponse.json({ error: 'Code en naam zijn verplicht' }, { status: 400 })

  const cookieStore = cookies()
  const raw = cookieStore.get(COOKIE)?.value
  const divisions = raw ? JSON.parse(raw) : []

  if (!divisions.find((d: any) => d.code === code)) {
    divisions.push({ code, name })
  }

  cookieStore.set(COOKIE, JSON.stringify(divisions), { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  return NextResponse.json({ divisions })
}

export async function DELETE(req: Request) {
  const { code } = await req.json()
  const cookieStore = cookies()
  const raw = cookieStore.get(COOKIE)?.value
  const divisions = raw ? JSON.parse(raw) : []
  const updated = divisions.filter((d: any) => d.code !== code)
  cookieStore.set(COOKIE, JSON.stringify(updated), { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  return NextResponse.json({ divisions: updated })
}
