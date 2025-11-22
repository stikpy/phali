"use server"

import { pgQuery } from "@/utils/db"
import { cookies } from "next/headers"
import { cookieName, signSession } from "@/utils/auth"

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
    // Création utilisateur minimaliste si absent (table app_users)
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
    const { rows } = await pgQuery<{ id: string }>(
      `insert into public.app_users (email, name, phone, avatar_url)
       values ($1,$2,$3,$4)
       on conflict (email) do update set
         name = excluded.name,
         phone = excluded.phone,
         avatar_url = excluded.avatar_url
       returning id`,
      [payload.email, payload.name, payload.phone, payload.avatarUrl],
    )
    const userId = rows?.[0]?.id
    if (userId) {
      const token = signSession({ userId, name: payload.name, email: payload.email })
      cookies().set(cookieName(), token, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 60, // 60 jours
      })
    }
    return { success: true }
  } catch (e: any) {
    console.error("[submitRsvp] error:", e?.message)
    return { success: false, error: e?.message || "unknown" }
  }
}

