"use server"

import { NextResponse } from "next/server"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getMinioClient } from "@/utils/minio"
import { io } from "socket.io-client"

export async function POST(req: Request) {
  try {
    const { key } = await req.json()
    if (!key) return NextResponse.json({ success: false, error: "missing key" }, { status: 400 })
    const s3 = getMinioClient()
    const Bucket = process.env.MINIO_BUCKET_NAME!
    await s3.send(new DeleteObjectCommand({ Bucket, Key: key }))
    // Broadcast removal
    try {
      const serverUrl = process.env.NEXT_PUBLIC_REALTIME_SERVER_URL || process.env.REALTIME_SERVER_URL
      if (serverUrl) {
        const socket = io(serverUrl, { transports: ["websocket"], forceNew: true })
        await new Promise<void>((resolve) => socket.on("connect", () => resolve()))
        socket.emit("photo-removed", { name: key.replace(/^event\//, ""), key })
        socket.close()
      }
    } catch {}
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "minio remove failed" }, { status: 200 })
  }
}


