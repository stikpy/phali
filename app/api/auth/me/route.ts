"use server"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { cookieName, verifySession } from "@/utils/auth"
import { pgQuery } from "@/utils/db"

export async function GET() {
  try {
    const token = cookies().get(cookieName())?.value
    const session = verifySession(token)
    if (!session) return NextResponse.json({ authenticated: false })
    const { rows } = await pgQuery<{ id: string; email: string; name: string | null }>(
      "select id, email, name from public.app_users where id = $1",
      [session.userId],
    )
    if (!rows?.length) return NextResponse.json({ authenticated: false })
    return NextResponse.json({ authenticated: true, user: rows[0] })
  } catch (e: any) {
    return NextResponse.json({ authenticated: false, error: e?.message || "unknown" }, { status: 200 })
  }
}


