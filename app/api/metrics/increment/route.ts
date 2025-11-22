import { NextResponse } from "next/server"
import { pgQuery } from "@/utils/db"
import { logEvent } from "@/app/actions/log"

export async function POST(req: Request) {
  try {
    const xff = req.headers.get("x-forwarded-for") || ""
    const ip = xff.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1"
    const today = new Date().toISOString().slice(0, 10)
    // Insert unique view by (id, day, ip); ignore duplicates
    await pgQuery(
      "insert into public.site_metrics (id, day, ip) values ($1, $2::date, $3) on conflict do nothing",
      ["global", today, ip],
    )
    const { rows } = await pgQuery<{ count: string }>(
      "select count(*)::text as count from public.site_metrics where id = $1",
      ["global"],
    )
    const views = Number(rows?.[0]?.count ?? "0")
    return NextResponse.json({ success: true, views }, { status: 200 })
  } catch (e: any) {
    await logEvent("error", "incrementView exception (route)", { error: e?.message || String(e) })
    return NextResponse.json({ success: false, error: e?.message || "unknown" }, { status: 200 })
  }
}


