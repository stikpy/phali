"use server"

import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"

export async function POST(req: Request) {
  try {
    const supabase = createServiceClient()
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null
    const ua = req.headers.get("user-agent") || null
    const { error } = await supabase.from("wizz_events").insert({
      ip,
      user_agent: ua,
    } as any)
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 200 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "unknown" }, { status: 200 })
  }
}


