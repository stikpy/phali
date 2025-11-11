"use client"

import { useEffect, useState } from "react"
import { logEvent } from "@/app/actions/log"

type VisitClockProps = {
  inline?: boolean
}

export default function VisitClock({ inline = false }: VisitClockProps) {
  const [visits, setVisits] = useState(0)
  const [now, setNow] = useState<Date | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Incrémente côté serveur et garde un miroir local
    const run = async () => {
      try {
        const r = await fetch("/api/metrics/increment", { method: "POST" })
        const json = await r.json()
        if (json.success) {
          setVisits(json.views as number)
          console.log("[views] total =", json.views)
        } else {
          console.warn("[views] increment failed:", json.error)
          setVisits((v) => v || 1)
          await logEvent("warn", "incrementView failed (route)", { error: json.error })
        }
      } catch (e: any) {
        console.error("[views] exception:", e?.message || e)
        await logEvent("error", "incrementView exception (route)", { error: e?.message || String(e) })
        setVisits((v) => v || 1)
      }
    }
    run()
  }, [])

  useEffect(() => {
    setHydrated(true)
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const pad = (n: number) => String(n).padStart(2, "0")
  const time =
    hydrated && now
      ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      : "--:--:--"
  const date =
    hydrated && now
      ? `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`
      : "--/--/----"

  if (inline) {
    return (
      <div className="flex items-center gap-3 text-[11px] font-mono">
        <span className="uppercase tracking-[0.25em] text-foreground/70">Visites</span>
        <span className="font-bold">{visits}</span>
        <span className="w-px h-3 bg-white/20" />
        <span className="uppercase tracking-[0.25em] text-foreground/70">Heure</span>
        <span className="font-black led">{time}</span>
      </div>
    )
  }

  return (
    <div className="skylog-widget bg-card border border-white/15 y2k-neon-border max-w-full md:max-w-sm">
      <div className="skylog-widget-header bg-gradient-to-r from-secondary/80 via-primary/70 to-accent/70 text-card-foreground">
        <span>[ COMPTEUR + HORLOGE ]</span>
      </div>
      <div className="p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase">Visites</div>
          <div className="text-2xl font-black led">{visits}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-black uppercase">Heure</div>
          <div className="text-2xl font-black led">{time}</div>
          <div className="text-xs font-mono">{date}</div>
        </div>
      </div>
    </div>
  )
}

