"use server"

import { NextResponse } from "next/server"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getMinioClient } from "@/utils/minio"

export async function POST(req: Request) {
  try {
    const { key } = await req.json()
    if (!key) return NextResponse.json({ success: false, error: "missing key" }, { status: 400 })
    const s3 = getMinioClient()
    const Bucket = process.env.MINIO_BUCKET_NAME!
    await s3.send(new DeleteObjectCommand({ Bucket, Key: key }))
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "minio remove failed" }, { status: 200 })
  }
}


