"use server"

import { pgQuery } from "@/utils/db"

type ChatPayload = {
  id: string
  author: string
  message: string
}

export async function sendChatMessage(payload: ChatPayload) {
  try {
    await pgQuery("insert into public.chat_messages (id, author, message) values ($1, $2, $3)", [
      payload.id,
      payload.author,
      payload.message,
    ])
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e?.message || "unknown" }
  }
}

