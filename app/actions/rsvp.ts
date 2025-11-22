"use server"

import { pgQuery } from "@/utils/db"

type RsvpPayload = {
  name: string
  email: string
  guests: number
  message: string | null
  phone: string | null
  status: "present" | "absent" | "unsure"
  avatarUrl: string | null
  reminderOptIn?: boolean
}

export async function submitRsvp(payload: RsvpPayload) {
  try {
    // Extension pour UUID si absente
    await pgQuery(`create extension if not exists pgcrypto`)
    // S'assure que la colonne phone existe (migration souple)
    await pgQuery(
      `alter table if exists public.rsvp_responses
       add column if not exists phone text`,
    )
    // S'assure que la colonne id existe et possède un default UUID
    await pgQuery(
      `alter table if exists public.rsvp_responses
       add column if not exists id uuid primary key default gen_random_uuid()`,
    )
    await pgQuery(
      `alter table if exists public.rsvp_responses
       alter column id set default gen_random_uuid()`,
    )
    // S'assure qu'il existe une contrainte/index unique sur email (requis par ON CONFLICT(email))
    await pgQuery(
      `create unique index if not exists rsvp_responses_email_key
       on public.rsvp_responses(email)`,
    )
    await pgQuery(
      `insert into public.rsvp_responses
       (name, email, guests, message, phone, status, avatar_url, reminder_opt_in)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (email) do update set
         name = excluded.name,
         guests = excluded.guests,
         message = excluded.message,
         phone = excluded.phone,
         status = excluded.status,
         avatar_url = excluded.avatar_url,
         reminder_opt_in = excluded.reminder_opt_in`,
      [
        payload.name,
        payload.email,
        payload.guests,
        payload.message,
        payload.phone,
        payload.status,
        payload.avatarUrl,
        !!payload.reminderOptIn,
      ],
    )
    // Si la personne est "présente", envoyer un magic link Better Auth pour créer la session facilement.
    if (payload.status === "present" && payload.email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ? "https://" + process.env.NEXT_PUBLIC_SITE_URL : ""}/api/auth/sign-in/magic-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: payload.email,
            name: payload.name,
            callbackURL: "/",
          }),
        })
      } catch {}
    }
    return { success: true }
  } catch (e: any) {
    console.error("[submitRsvp] error:", e?.message)
    return { success: false, error: e?.message || "unknown" }
  }
}

