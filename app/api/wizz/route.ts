"use server"

import { NextResponse } from "next/server"
import { pgQuery } from "@/utils/db"

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null
    const ua = req.headers.get("user-agent") || null
    await pgQuery("insert into public.wizz_events (ip, user_agent) values ($1, $2)", [ip, ua])
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "unknown" }, { status: 200 })
  }
}


