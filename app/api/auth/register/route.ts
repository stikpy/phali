"use server"

import { NextResponse } from "next/server"
import { pgQuery } from "@/utils/db"
import { hashPassword } from "@/utils/password"
import { cookies } from "next/headers"
import { cookieName, signSession } from "@/utils/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email: string = (body?.email || "").trim().toLowerCase()
    const phone: string | null = (body?.phone || "").trim() || null
    const name: string | null = (body?.name || "").trim() || null
    const password: string = body?.password || ""
    if (!email || !password) return NextResponse.json({ success: false, error: "email/password requis" }, { status: 200 })

    // Tables
    await pgQuery(
      `create table if not exists public.app_users (
        id uuid primary key default gen_random_uuid(),
        email text unique not null,
        name text,
        phone text,
        avatar_url text,
        created_at timestamp with time zone default now()
      )`,
    )
    await pgQuery(
      `create table if not exists public.auth_accounts (
        user_id uuid references public.app_users(id) on delete cascade,
        email text unique,
        phone text unique,
        password_hash text,
        primary key (user_id)
      )`,
    )
    // Upsert user
    const { rows } = await pgQuery<{ id: string }>(
      `insert into public.app_users (email, name, phone)
       values ($1,$2,$3)
       on conflict (email) do update set name = excluded.name, phone = excluded.phone
       returning id`,
      [email, name, phone],
    )
    const userId = rows?.[0]?.id
    const passwordHash = await hashPassword(password)
    await pgQuery(
      `insert into public.auth_accounts (user_id, email, phone, password_hash)
       values ($1,$2,$3,$4)
       on conflict (user_id) do update set email = excluded.email, phone = excluded.phone, password_hash = excluded.password_hash`,
      [userId, email, phone, passwordHash],
    )
    const token = signSession({ userId, name, email })
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




