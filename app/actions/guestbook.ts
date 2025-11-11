"use server"

import { createServiceClient } from "@/utils/supabase/service"

type GuestbookPayload = {
  name: string
  message: string
}

export async function submitGuestbookEntry(payload: GuestbookPayload) {
  const supabase = createServiceClient()

  const { error } = await supabase.from("guestbook_entries").insert({
    name: payload.name,
    message: payload.message,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

