"use server"

import { createServiceClient } from "@/utils/supabase/service"
import { logEvent } from "./log"
import { headers } from "next/headers"

export async function incrementView(): Promise<{ success: true; views: number } | { success: false; error: string }> {
  try {
    const supabase = createServiceClient()
    // Récupère une IP rudimentaire
    const h = headers()
    const xff = h.get("x-forwarded-for") || ""
    const ip = xff.split(",")[0]?.trim() || h.get("x-real-ip") || "127.0.0.1"
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    // RPC côté DB qui incrémente une seule fois par jour et par IP
    const { data, error } = await supabase.rpc("increment_site_views", {
      p_id: "global",
      p_ip: ip,
      p_day: today,
    })
    if (error) {
      await logEvent("error", "increment_site_views error", { error: error.message })
      return { success: false, error: error.message }
    }
    return { success: true, views: Number(data ?? 0) }
  } catch (e: any) {
    await logEvent("error", "incrementView exception", { error: e?.message || String(e) })
    return { success: false, error: e?.message || "unknown" }
  }
}


