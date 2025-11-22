import { Pool } from "pg"

let pool: Pool | null = null

export function getPgPool() {
  if (pool) return pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL manquant")
  }
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    max: 5,
    idleTimeoutMillis: 30_000,
  })
  return pool
}

export async function pgQuery<T = any>(text: string, params?: any[]) {
  const p = getPgPool()
  const res = await p.query<T>(text, params)
  return res
}


