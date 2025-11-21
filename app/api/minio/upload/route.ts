"use server"

import { NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getMinioClient, getMinioPublicUrl } from "@/utils/minio"
import { io } from "socket.io-client"

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ success: false, error: "missing file" }, { status: 400 })
    const ext = file.name.split(".").pop() || "png"
    const key = `event/${crypto.randomUUID()}.${ext}`
    const s3 = getMinioClient()
    const Bucket = process.env.MINIO_BUCKET_NAME!
    const Body = Buffer.from(await file.arrayBuffer())
    const ContentType = file.type || "application/octet-stream"
    await s3.send(new PutObjectCommand({ Bucket, Key: key, Body, ContentType, ACL: "public-read" as any }))
    const url = getMinioPublicUrl(key)
    // Broadcast realtime (Socket.IO) si configuré
    try {
      const serverUrl = process.env.NEXT_PUBLIC_REALTIME_SERVER_URL || process.env.REALTIME_SERVER_URL
      if (serverUrl) {
        const socket = io(serverUrl, { transports: ["websocket"], forceNew: true })
        await new Promise<void>((resolve) => socket.on("connect", () => resolve()))
        socket.emit("photo-uploaded", {
          name: key.replace(/^event\//, ""),
          url,
          size: Body.length,
          contentType: ContentType,
          lastModified: new Date().toISOString(),
        })
        socket.close()
      }
    } catch {}
    return NextResponse.json({ success: true, key, url })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "minio upload failed" }, { status: 200 })
  }
}


