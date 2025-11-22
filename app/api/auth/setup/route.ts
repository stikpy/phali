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
        account_id text,
        provider_id text,
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
    // Assouplir contraintes héritées (account_id/provider_id peuvent être NULL pour 'credential')
    await pgQuery(`alter table if exists "account" alter column account_id drop not null`)
    await pgQuery(`alter table if exists "account" alter column provider_id drop not null`)

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

    // Harmonisation des types Better Auth → utiliser des ids en text (évite erreurs uuid)
    try {
      // 1) Supprimer FKs qui bloquent les changements de types
      await pgQuery(`
        do $$
        declare
          r record;
        begin
          for r in
            select tc.constraint_name, tc.table_schema, tc.table_name
            from information_schema.table_constraints tc
            join information_schema.key_column_usage kcu
              on tc.constraint_name = kcu.constraint_name
            join information_schema.constraint_column_usage ccu
              on ccu.constraint_name = tc.constraint_name
            where tc.constraint_type = 'FOREIGN KEY'
              and ccu.table_name = 'user'
              and tc.table_name in ('session','account')
          loop
            execute format('alter table %I.%I drop constraint if exists %I', r.table_schema, r.table_name, r.constraint_name);
          end loop;
        end $$;
      `)
      // 2) Convertir les PK en text
      await pgQuery(`alter table if exists "user" alter column id drop default`)
      await pgQuery(`alter table if exists "user" alter column id type text using id::text`)
      await pgQuery(`alter table if exists "session" alter column id drop default`)
      await pgQuery(`alter table if exists "session" alter column id type text using id::text`)
      await pgQuery(`alter table if exists "account" alter column id drop default`)
      await pgQuery(`alter table if exists "account" alter column id type text using id::text`)
      await pgQuery(`alter table if exists "verification" alter column id drop default`)
      await pgQuery(`alter table if exists "verification" alter column id type text using id::text`)
      // 3) Convertir les colonnes de liaison en text
      await pgQuery(`alter table if exists "session" alter column user_id type text using user_id::text`)
      await pgQuery(`alter table if exists "session" alter column "userId" type text using "userId"::text`)
      await pgQuery(`alter table if exists "account" alter column user_id type text using user_id::text`)
      await pgQuery(`alter table if exists "account" alter column "userId" type text using "userId"::text`)
      // 4) (Optionnel) recréer des index
      await pgQuery(`create index if not exists session_user_id_text_idx on "session"(user_id)`)
      await pgQuery(`create index if not exists account_user_id_text_idx on "account"(user_id)`)
    } catch {}

    // Colonnes camelCase attendues par Better Auth sur account
    try {
      await pgQuery(`alter table if exists "account" add column if not exists "accountId" text`)
      await pgQuery(`alter table if exists "account" add column if not exists "providerId" text`)
      await pgQuery(`alter table if exists "account" add column if not exists "createdAt" timestamptz not null default now()`)
      await pgQuery(`alter table if exists "account" add column if not exists "updatedAt" timestamptz not null default now()`)
      await pgQuery(`alter table if exists "account" add column if not exists "accessToken" text`)
      await pgQuery(`alter table if exists "account" add column if not exists "refreshToken" text`)
      await pgQuery(`alter table if exists "account" add column if not exists "idToken" text`)
      await pgQuery(`alter table if exists "account" add column if not exists "accessTokenExpiresAt" timestamptz`)
      await pgQuery(`alter table if exists "account" add column if not exists "refreshTokenExpiresAt" timestamptz`)
      await pgQuery(`alter table if exists "account" add column if not exists "scope" text`)
      await pgQuery(`update "account" set "accountId" = account_id where "accountId" is null and account_id is not null`)
      await pgQuery(`update "account" set "providerId" = provider_id where "providerId" is null and provider_id is not null`)
      await pgQuery(`update "account" set "createdAt" = created_at where created_at is not null`)
      await pgQuery(`update "account" set "updatedAt" = updated_at where updated_at is not null`)
      await pgQuery(`update "account" set "accessToken" = access_token where access_token is not null`)
      await pgQuery(`update "account" set "refreshToken" = refresh_token where refresh_token is not null`)
      await pgQuery(`update "account" set "idToken" = id_token where id_token is not null`)
      await pgQuery(`update "account" set "accessTokenExpiresAt" = access_token_expires_at where access_token_expires_at is not null`)
      await pgQuery(`update "account" set "refreshTokenExpiresAt" = refresh_token_expires_at where refresh_token_expires_at is not null`)
      await pgQuery(`update "account" set "scope" = scope where scope is not null`)
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unknown" }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}


