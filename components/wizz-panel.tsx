"use client"

import { useEffect, useState } from "react"
import { triggerWizz } from "@/lib/wizz"
import { sendWizzBroadcast } from "@/lib/wizz-realtime"

export default function WizzPanel() {
  const [status, setStatus] = useState<"idle" | "sent">("idle")
  const [lastSent, setLastSent] = useState<number | null>(null)

  useEffect(() => {
    if (status !== "sent") return
    const timer = setTimeout(() => setStatus("idle"), 2500)
    return () => clearTimeout(timer)
  }, [status])

  const handleClick = () => {
    // anti‑spam: 8s de cooldown local
    if (lastSent && Date.now() - lastSent < 8000) return
    // broadcast vers tous les clients (canal persistant)
    void sendWizzBroadcast({ at: Date.now() })
    // log table (best‑effort)
    void fetch("/api/wizz", { method: "POST" }).catch(() => {})
    // feedback local immédiat
    triggerWizz()
    setStatus("sent")
    setLastSent(Date.now())
  }

  return (
    <div className="skylog-widget bg-card border border-white/15 y2k-neon-border">
      <div className="skylog-widget-header bg-gradient-to-r from-primary/80 via-secondary/70 to-primary/80">
        <span>[ WIZZ CENTER ]</span>
        <span className="text-[10px] uppercase tracking-[0.4em] text-foreground/80">MSN live</span>
      </div>
      <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-foreground/70">Statut</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-secondary animate-pulse" />
            <span className="font-mono text-sm text-foreground/80">En ligne</span>
          </div>
          {lastSent && (
            <p className="mt-2 text-[11px] font-mono text-foreground/60">
              Dernier wizz: {new Date(lastSent).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={handleClick}
          className="skylog-button text-sm px-6 py-3 bg-primary text-primary-foreground"
        >
          Envoyer un Wizz
        </button>
      </div>
      <div className="px-6 pb-4">
        <div
          className={`y2k-marquee ${status === "sent" ? "opacity-100" : "opacity-40"} transition-opacity duration-300`}
        >
          <span>
            {status === "sent"
              ? ">>> WIZZ EXPÉDIÉ ! TOUT LE MONDE TREMBLE. <<<"
              : lastSent
              ? `Dernier wizz: ${new Date(lastSent).toLocaleTimeString()}`
              : "Aucun wizz envoyé pour le moment."}
          </span>
        </div>
      </div>
    </div>
  )
}

