"use server"

import { createServiceClient } from "@/utils/supabase/service"

type LogLevel = "info" | "warn" | "error"

export async function logEvent(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  try {
    const supabase = createServiceClient()
    await supabase.from("app_logs").insert({
      level,
      message,
      meta: meta ?? null,
    })
  } catch (e) {
    // Dernier filet de sécurité: log console serveur
    console.error("[app_logs] insert failed:", e)
  }
}


