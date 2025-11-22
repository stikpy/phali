"use server"

import { NextResponse } from "next/server"
import { pgQuery } from "@/utils/db"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json()
    const email = (identifier || "").toLowerCase().trim()
    if (!email) return NextResponse.json({ success: false, error: "email requis" })
    // ensure tables
    await pgQuery(
      `create table if not exists public.auth_tokens (
        token text primary key,
        user_id uuid not null,
        type text not null,
        expires_at timestamp with time zone not null,
        consumed_at timestamp with time zone
      )`,
    )
    const { rows } = await pgQuery<{ id: string }>("select id from public.app_users where email=$1 limit 1", [email])
    if (!rows?.length) return NextResponse.json({ success: false, error: "utilisateur introuvable" })
    const token = crypto.randomBytes(24).toString("base64url")
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    await pgQuery(
      "insert into public.auth_tokens (token, user_id, type, expires_at) values ($1,$2,'magic',$3)",
      [token, rows[0].id, expires],
    )
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || ""
    const link = `${baseUrl ? `https://${baseUrl}` : ""}/api/auth/magic/verify?token=${token}`
    // TODO: envoyer via SMTP; pour l'instant, renvoyer le lien (dev)
    return NextResponse.json({ success: true, link })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "unknown" }, { status: 200 })
  }
}


