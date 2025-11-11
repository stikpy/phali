"use client"

import { createClient } from "@/utils/client"

let client: ReturnType<typeof createClient> | null = null
let channel: any | null = null

export function getSupabase() {
  if (!client) client = createClient()
  return client
}

export function ensureWizzChannel() {
  const supabase = getSupabase()
  if (!channel) {
    channel = supabase.channel("wizz-global", { config: { broadcast: { self: true } } })
    channel.subscribe()
  }
  return channel
}

export async function sendWizzBroadcast(payload: any) {
  const ch = ensureWizzChannel()
  try {
    await ch.send({ type: "broadcast", event: "wizz", payload })
  } catch {
    // noop
  }
}


