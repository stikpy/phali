"use server"

import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"

export async function GET() {
  try {
    const supabase = createServiceClient()
    // Use existing public bucket "photos" for flags
    const { data, error } = await supabase.storage.from("photos").list("flags", { limit: 10 })
    if (error && error.message?.toLowerCase().includes("not found")) {
      return NextResponse.json({ chatBlocked: false, uploadBlocked: false })
    }
    const names = (data || []).map((d) => d.name)
    const chatBlocked = names.includes("chat_blocked")
    const uploadBlocked = names.includes("upload_blocked")
    return NextResponse.json({ chatBlocked, uploadBlocked })
  } catch (e: any) {
    return NextResponse.json({ chatBlocked: false, uploadBlocked: false, error: e?.message || "unknown" })
  }
}


