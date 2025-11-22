"use server"

import { NextResponse } from "next/server"
import { pgQuery } from "@/utils/db"
import { cookies } from "next/headers"
import { cookieName, signSession } from "@/utils/auth"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get("token") || ""
    if (!token) return NextResponse.json({ success: false, error: "token manquant" })
    const { rows } = await pgQuery<{ user_id: string; email: string | null; name: string | null; expires_at: string; consumed_at: string | null }>(
      `select t.user_id, u.email, u.name, t.expires_at, t.consumed_at
       from public.auth_tokens t
       join public.app_users u on u.id = t.user_id
       where t.token = $1 and t.type='magic'`,
      [token],
    )
    if (!rows?.length) return NextResponse.json({ success: false, error: "token invalide" })
    const row = rows[0]
    if (row.consumed_at) return NextResponse.json({ success: false, error: "token déjà utilisé" })
    if (new Date(row.expires_at).getTime() < Date.now()) return NextResponse.json({ success: false, error: "token expiré" })
    // consume
    await pgQuery("update public.auth_tokens set consumed_at = now() where token=$1", [token])
    const jwt = signSession({ userId: row.user_id, name: row.name, email: row.email || undefined })
    cookies().set(cookieName(), jwt, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 60,
    })
    return NextResponse.redirect(new URL("/", req.url))
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "unknown" }, { status: 200 })
  }
}


