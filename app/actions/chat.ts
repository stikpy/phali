"use server"

import { createServiceClient } from "@/utils/supabase/service"

type ChatPayload = {
  id: string
  author: string
  message: string
}

export async function sendChatMessage(payload: ChatPayload) {
  const supabase = createServiceClient()

  const { error } = await supabase.from("chat_messages").insert({
    id: payload.id,
    author: payload.author,
    message: payload.message,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

