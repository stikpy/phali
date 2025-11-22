import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { pgQuery } from "@/utils/db"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { password } = await req.json()
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ ok: false, error: "Mot de passe trop court (≥ 8 caractères)" }, { status: 400 })
    }
    const { data: session } = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: "Non authentifié" }, { status: 401 })
    }
    const userId = String(session.user.id)
    const email = String(session.user.email || "")
    if (!email) {
      return NextResponse.json({ ok: false, error: "Email manquant sur le profil" }, { status: 400 })
    }
    const hash = await bcrypt.hash(password, 10)

    // Assure colonnes et ligne account pour provider email
    await pgQuery(`create table if not exists "account" (
      id text primary key,
      account_id text,
      provider_id text,
      user_id text,
      "userId" text,
      access_token text,
      refresh_token text,
      id_token text,
      access_token_expires_at timestamptz,
      refresh_token_expires_at timestamptz,
      scope text,
      password text,
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      "createdAt" timestamptz default now(),
      "updatedAt" timestamptz default now()
    )`)

    // Upsert
    await pgQuery(
      `
      insert into "account" (
        id, account_id, "accountId", provider_id, "providerId",
        user_id, "userId", password, created_at, "createdAt", updated_at, "updatedAt"
      )
      values ($1,$2,$2,$3,$3,$4,$4,$5, now(), now(), now(), now())
      on conflict (id) do update set
        account_id = excluded.account_id,
        "accountId" = excluded."accountId",
        provider_id = excluded.provider_id,
        "providerId" = excluded."providerId",
        user_id = excluded.user_id,
        "userId" = excluded."userId",
        password = excluded.password,
        updated_at = now(),
        "updatedAt" = now()
    `,
      // id stable pour le provider "credential"
      [`credential:${userId}`, email, "credential", userId, hash],
    )

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unknown" }, { status: 500 })
  }
}



