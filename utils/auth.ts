import crypto from "crypto"

const COOKIE_NAME = "pp_auth"

export type SessionPayload = {
  userId: string
  name?: string | null
  email?: string | null
  iat: number
}

function getSecret(): string {
  const s = process.env.APP_SECRET || process.env.NEXTAUTH_SECRET || process.env.MINIO_SECRET_KEY
  if (!s) throw new Error("APP_SECRET manquant")
  return s
}

export function signSession(payload: Omit<SessionPayload, "iat">): string {
  const data: SessionPayload = { ...payload, iat: Math.floor(Date.now() / 1000) }
  const json = JSON.stringify(data)
  const b = Buffer.from(json).toString("base64url")
  const sig = crypto.createHmac("sha256", getSecret()).update(b).digest("base64url")
  return `${b}.${sig}`
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null
  const [b, sig] = token.split(".")
  if (!b || !sig) return null
  const expect = crypto.createHmac("sha256", getSecret()).update(b).digest("base64url")
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null
  try {
    const json = Buffer.from(b, "base64url").toString("utf8")
    return JSON.parse(json) as SessionPayload
  } catch {
    return null
  }
}

export function cookieName() {
  return COOKIE_NAME
}


