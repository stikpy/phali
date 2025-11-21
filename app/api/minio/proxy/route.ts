"use server"

import { NextResponse } from "next/server"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getMinioClient } from "@/utils/minio"
import type { Readable } from "stream"

function nodeReadableToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    stream.on("end", () => resolve(Buffer.concat(chunks)))
    stream.on("error", reject)
  })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get("key")
    if (!key) {
      return NextResponse.json({ error: "missing key" }, { status: 400 })
    }
    const s3 = getMinioClient()
    const Bucket = process.env.MINIO_BUCKET_NAME!
    const obj = await s3.send(new GetObjectCommand({ Bucket, Key: key }))
    const contentType = (obj.ContentType as string) || "application/octet-stream"
    const buf = await nodeReadableToBuffer(obj.Body as Readable)
    return new Response(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable",
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "minio proxy failed" }, { status: 200 })
  }
}


