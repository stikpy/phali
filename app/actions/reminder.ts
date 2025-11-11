"use server"

import { createServiceClient } from "@/utils/supabase/service"

export async function getReminderEmails() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("rsvp_responses")
    .select("email")
    .eq("status", "unsure")
    .eq("reminder_opt_in", true)
    .not("email", "is", null)

  if (error) return { success: false, error: error.message, emails: [] as string[] }
  const emails = (data || []).map((r: any) => r.email as string).filter(Boolean)
  return { success: true, emails }
}

