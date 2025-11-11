"use server"

import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase.storage.from("photos").list("flags", { limit: 10 })
  const names = (data || []).map((d) => d.name)
  return NextResponse.json({
    chatBlocked: names.includes("chat_blocked"),
    uploadBlocked: names.includes("upload_blocked"),
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const chat: boolean | undefined = body?.chat
    const upload: boolean | undefined = body?.upload
    const supabase = createServiceClient()

    const ops: Promise<any>[] = []
    const ensureFlag = async (name: string, val: boolean | undefined) => {
      if (typeof val !== "boolean") return
      if (val) {
        // create empty object
        const blob = new Blob([], { type: "text/plain" })
        ops.push(supabase.storage.from("photos").upload(`flags/${name}`, blob, { upsert: true }))
      } else {
        ops.push(supabase.storage.from("photos").remove([`flags/${name}`]))
      }
    }

    await ensureFlag("chat_blocked", chat)
    await ensureFlag("upload_blocked", upload)
    await Promise.allSettled(ops)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "unknown" }, { status: 200 })
  }
}


