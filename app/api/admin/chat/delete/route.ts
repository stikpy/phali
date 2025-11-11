"use server"

import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"

export async function POST(req: Request) {
  try {
    const { id } = await req.json()
    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 })
    }
    const supabase = createServiceClient()
    const { error } = await supabase.from("chat_messages").delete().eq("id", id)
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 200 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "unknown" }, { status: 200 })
  }
}


