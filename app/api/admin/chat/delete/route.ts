"use server"

import { NextResponse } from "next/server"
import { pgQuery } from "@/utils/db"

export async function POST(req: Request) {
  try {
    const { id } = await req.json()
    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 })
    }
    await pgQuery("delete from public.chat_messages where id = $1", [id])
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "unknown" }, { status: 200 })
  }
}


