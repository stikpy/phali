"use server"

import { NextResponse } from "next/server"
import { pgQuery } from "@/utils/db"

export async function GET() {
  try {
    const { rows } = await pgQuery<{
      id: string
      author: string
      message: string
      created_at: string
    }>(
      `select id, author, message, created_at
       from public.chat_messages
       order by created_at asc
       limit 50`,
    )
    return NextResponse.json({ success: true, messages: rows ?? [] })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "unknown" }, { status: 200 })
  }
}




