"use server"

import { logEvent } from "./log"
import { headers } from "next/headers"
import { pgQuery } from "@/utils/db"

export async function incrementView(): Promise<{ success: true; views: number } | { success: false; error: string }> {
  try {
    const h = headers()
    const xff = h.get("x-forwarded-for") || ""
    const ip = xff.split(",")[0]?.trim() || h.get("x-real-ip") || "127.0.0.1"
    const today = new Date().toISOString().slice(0, 10)
    await pgQuery(
      "insert into public.site_metrics (id, day, ip) values ($1, $2::date, $3) on conflict do nothing",
      ["global", today, ip],
    )
    const { rows } = await pgQuery<{ count: string }>(
      "select count(*)::text as count from public.site_metrics where id = $1",
      ["global"],
    )
    const views = Number(rows?.[0]?.count ?? "0")
    return { success: true, views }
  } catch (e: any) {
    await logEvent("error", "incrementView exception", { error: e?.message || String(e) })
    return { success: false, error: e?.message || "unknown" }
  }
}

