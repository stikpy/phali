"use server"

import { pgQuery } from "@/utils/db"

type GuestbookPayload = {
  name: string
  message: string
}

export async function submitGuestbookEntry(payload: GuestbookPayload) {
  try {
    await pgQuery("insert into public.guestbook_entries (name, message) values ($1, $2)", [
      payload.name,
      payload.message,
    ])
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e?.message || "unknown" }
  }
}

