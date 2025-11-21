"use server"

import { createServiceClient } from "@/utils/supabase/service"

export type PresenceStatus = "online" | "busy" | "away" | "offline"

export async function updatePresence(params: {
  sessionId: string
  nick: string
  status: PresenceStatus
}) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from("chat_presence")
    .upsert(
      {
        session_id: params.sessionId,
        nick: params.nick,
        status: params.status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    )
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}





