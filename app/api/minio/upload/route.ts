"use server"

import { NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getMinioClient, getMinioPublicUrl } from "@/utils/minio"

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
    return NextResponse.json({ success: true, key, url: getMinioPublicUrl(key) })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "minio upload failed" }, { status: 200 })
  }
}


