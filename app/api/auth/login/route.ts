"use server"

import { NextResponse } from "next/server"
import { pgQuery } from "@/utils/db"
import { verifyPassword } from "@/utils/password"
import { cookies } from "next/headers"
import { cookieName, signSession } from "@/utils/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const identifier: string = (body?.identifier || "").trim().toLowerCase()
    const password: string = body?.password || ""
    if (!identifier || !password) return NextResponse.json({ success: false, error: "identifiants requis" })
    const { rows } = await pgQuery<{ user_id: string; email: string | null; name: string | null; password_hash: string }>(
      `select a.user_id, u.email, u.name, a.password_hash
       from public.auth_accounts a
       join public.app_users u on u.id = a.user_id
       where a.email = $1 or a.phone = $1
       limit 1`,
      [identifier],
    )
    if (!rows?.length) return NextResponse.json({ success: false, error: "compte introuvable" })
    const ok = await verifyPassword(password, rows[0].password_hash)
    if (!ok) return NextResponse.json({ success: false, error: "mot de passe invalide" })
    const token = signSession({ userId: rows[0].user_id, name: rows[0].name, email: rows[0].email || undefined })
    cookies().set(cookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 60,
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "unknown" }, { status: 200 })
  }
}



