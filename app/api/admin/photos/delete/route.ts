"use server"

import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"

export async function POST(req: Request) {
  try {
    const { path } = await req.json()
    if (!path || typeof path !== "string") {
      return NextResponse.json({ success: false, error: "Missing path" }, { status: 400 })
    }
    const supabase = createServiceClient()
    const { error } = await supabase.storage.from("photos").remove([path])
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 200 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "unknown" }, { status: 200 })
  }
}


