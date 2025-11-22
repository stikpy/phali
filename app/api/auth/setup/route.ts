import { NextResponse } from "next/server"
import { pgQuery } from "@/utils/db"

export async function POST() {
  try {
    // Extensions
    await pgQuery(`create extension if not exists pgcrypto`)

    // user table
    await pgQuery(`
      create table if not exists "user" (
        id uuid primary key default gen_random_uuid(),
        name text,
        email text not null unique,
        email_verified boolean not null default false,
        image text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `)

    // session table
    await pgQuery(`
      create table if not exists "session" (
        id uuid primary key default gen_random_uuid(),
        token text not null unique,
        expires_at timestamptz not null,
        ip_address text,
        user_agent text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        user_id uuid not null references "user"(id) on delete cascade
      )
    `)
    await pgQuery(`create index if not exists session_user_id_idx on "session"(user_id)`)

    // account table (email/password & providers)
    await pgQuery(`
      create table if not exists "account" (
        id uuid primary key default gen_random_uuid(),
        account_id text not null,
        provider_id text not null,
        user_id uuid not null references "user"(id) on delete cascade,
        access_token text,
        refresh_token text,
        id_token text,
        access_token_expires_at timestamptz,
        refresh_token_expires_at timestamptz,
        scope text,
        password text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `)
    await pgQuery(`create index if not exists account_user_id_idx on "account"(user_id)`)

    // verification table (magic link / email verify)
    await pgQuery(`
      create table if not exists "verification" (
        id uuid primary key default gen_random_uuid(),
        identifier text not null,
        token text not null,
        expires_at timestamptz not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `)
    await pgQuery(`create index if not exists verification_identifier_idx on "verification"(identifier)`)
    // Ancienne colonne "value" -> "token" si nécessaire (évite conflit avec alias Prisma)
    try {
      await pgQuery(`
        do $$
        begin
          if exists (
            select 1 from information_schema.columns
            where table_schema = 'public' and table_name = 'verification' and column_name = 'value'
          ) and not exists (
            select 1 from information_schema.columns
            where table_schema = 'public' and table_name = 'verification' and column_name = 'token'
          ) then
            alter table public.verification rename column "value" to token;
          end if;
        end
        $$;
      `)
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unknown" }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}


