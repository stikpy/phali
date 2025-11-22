"use server"

import { NextResponse } from "next/server"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"
import { getMinioClient, getMinioPublicUrl } from "@/utils/minio"

export async function GET() {
  try {
    const s3 = getMinioClient()
    const Bucket = process.env.MINIO_BUCKET_NAME!
    const Prefix = "event/"
    const data = await s3.send(new ListObjectsV2Command({ Bucket, Prefix }))
    const contents = (data.Contents || [])
      .filter((o) => o.Key && !o.Key.endsWith("/"))
      .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0))
      .map((o) => ({
        name: o.Key!.replace(/^event\//, ""),
        key: o.Key!,
        url: getMinioPublicUrl(o.Key!),
        lastModified: o.LastModified?.toISOString() || null,
      }))
    return NextResponse.json({ items: contents })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "minio list failed" }, { status: 200 })
  }
}



