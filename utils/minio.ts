import { S3Client } from "@aws-sdk/client-s3"

export function getMinioClient() {
  const endpoint = process.env.MINIO_ENDPOINT
  const accessKeyId = process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_SECRET_KEY
  const region = process.env.MINIO_REGION || "us-east-1"
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("MinIO configuration is missing in env")
  }
  const forcePathStyle = true
  const useSsl = String(process.env.MINIO_USE_SSL || "false") === "true"
  const url = new URL(endpoint)
  return new S3Client({
    region,
    endpoint: `${useSsl ? "https" : "http"}://${url.hostname}:${url.port}`,
    forcePathStyle,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

export function getMinioPublicUrl(key: string) {
  const endpoint = process.env.MINIO_ENDPOINT!
  const bucket = process.env.MINIO_BUCKET_NAME!
  return `${endpoint.replace(/\/$/, "")}/${bucket}/${key.replace(/^\/+/, "")}`
}


