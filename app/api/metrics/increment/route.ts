import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import { logEvent } from "@/app/actions/log"

export async function POST(req: Request) {
  try {
    const supabase = createServiceClient()
    const xff = req.headers.get("x-forwarded-for") || ""
    const ip = xff.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1"
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase.rpc("increment_site_views", {
      p_id: "global",
      p_ip: ip,
      p_day: today,
    })
    if (error) {
      await logEvent("error", "increment_site_views error (route)", { error: error.message })
      return NextResponse.json({ success: false, error: error.message }, { status: 200 })
    }
    return NextResponse.json({ success: true, views: Number(data ?? 0) }, { status: 200 })
  } catch (e: any) {
    await logEvent("error", "incrementView exception (route)", { error: e?.message || String(e) })
    return NextResponse.json({ success: false, error: e?.message || "unknown" }, { status: 200 })
  }
}


