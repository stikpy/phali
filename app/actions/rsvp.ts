"use server"

import { createServiceClient } from "@/utils/supabase/service"

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
  const supabase = createServiceClient()

  const { error } = await supabase
    .from("rsvp_responses")
    .upsert(
      {
        name: payload.name,
        email: payload.email,
        guests: payload.guests,
        message: payload.message,
        phone: payload.phone,
        status: payload.status,
        avatar_url: payload.avatarUrl,
        reminder_opt_in: !!payload.reminderOptIn,
      },
      { onConflict: "email" },
    )

  if (error) {
    console.error("[submitRsvp] upsert error:", error.message)
    return { success: false, error: error.message }
  }

  console.log("[submitRsvp] stored", {
    email: payload.email,
    status: payload.status,
    avatarUrl: payload.avatarUrl,
  })
  return { success: true }
}

