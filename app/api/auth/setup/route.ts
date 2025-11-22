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
        phone_number text unique,
        phone_number_verified boolean not null default false,
        email_verified boolean not null default false,
        "emailVerified" boolean not null default false,
        image text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        "createdAt" timestamptz not null default now(),
        "updatedAt" timestamptz not null default now()
      )
    `)
    // S'assure des colonnes phone_number*
    await pgQuery(`alter table "user" add column if not exists phone_number text`)
    await pgQuery(`alter table "user" add column if not exists phone_number_verified boolean not null default false`)
    await pgQuery(`alter table "user" add column if not exists "emailVerified" boolean not null default false`)
    await pgQuery(`alter table "user" add column if not exists "createdAt" timestamptz not null default now()`)
    await pgQuery(`alter table "user" add column if not exists "updatedAt" timestamptz not null default now()`)

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
        user_id uuid references "user"(id) on delete cascade,
        "userId" uuid references "user"(id) on delete cascade
      )
    `)
    await pgQuery(`create index if not exists session_user_id_idx on "session"(user_id)`)
    await pgQuery(`alter table "session" add column if not exists "userId" uuid references "user"(id) on delete cascade`)
    await pgQuery(`create index if not exists "session_userId_idx" on "session"("userId")`)
    // Backfill camelCase from snake_case
    await pgQuery(`update "session" set "userId" = user_id where "userId" is null and user_id is not null`)

    // account table (email/password & providers)
    await pgQuery(`
      create table if not exists "account" (
        id uuid primary key default gen_random_uuid(),
        account_id text not null,
        provider_id text not null,
        user_id uuid references "user"(id) on delete cascade,
        "userId" uuid references "user"(id) on delete cascade,
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
    await pgQuery(`alter table "account" add column if not exists "userId" uuid references "user"(id) on delete cascade`)
    await pgQuery(`create index if not exists "account_userId_idx" on "account"("userId")`)
    // Backfill camelCase from snake_case
    await pgQuery(`update "account" set "userId" = user_id where "userId" is null and user_id is not null`)

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
          -- Ajoute expiresAt (camelCase) attendu par certains adapters
          if not exists (
            select 1 from information_schema.columns
            where table_schema = 'public' and table_name = 'verification' and column_name = 'expiresAt'
          ) then
            alter table public.verification add column "expiresAt" timestamptz;
          end if;
        end
        $$;
      `)
    } catch {}

    // site_metrics: ajoute colonne day si manquante (pour VisitClock)
    try {
      await pgQuery(`
        alter table if exists public.site_metrics
        add column if not exists day date
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


