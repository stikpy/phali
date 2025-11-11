"use client"

import { useEffect, useState, useTransition } from "react"
import { createClient } from "@/utils/client"
import { submitGuestbookEntry } from "@/app/actions/guestbook"

type GuestbookEntry = {
  id: string
  created_at: string
  name: string
  message: string
}

export default function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      const { data } = await supabase
        .from("guestbook_entries")
        .select("*")
        .order("created_at", { ascending: false })
      if (data) setEntries(data as GuestbookEntry[])
    }

    load()

    const channel = supabase
      .channel("guestbook-entries")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guestbook_entries" },
        (payload) => setEntries((prev) => [payload.new as GuestbookEntry, ...prev]),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const total = entries.length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return

    setErrorMessage(null)

    startTransition(async () => {
      const result = await submitGuestbookEntry({
        name: name.trim(),
        message: message.trim(),
      })

      if (!result.success) {
        setErrorMessage(result.error ?? "Impossible d'ajouter ce message.")
        return
      }

      setName("")
      setMessage("")
    })
  }

  return (
    <section className="bg-background p-4 pb-12">
      <div className="max-w-3xl mx-auto">
        <div className="skylog-widget primary mb-6 transform -rotate-1">
          <div className="skylog-widget-header bg-gradient-to-r from-primary via-secondary to-accent">
            <span>[ LIVRE D'OR ]</span>
            <span className="text-xs">{total} entrées</span>
          </div>
          <div className="p-6 text-center">
            <h2 className="text-3xl font-black text-white y2k-glow">LAISSE UN MOT 💬</h2>
          </div>
        </div>

        <div className="skylog-widget bg-card border border-white/15 mb-6 y2k-neon-border">
          <div className="skylog-widget-header bg-gradient-to-r from-secondary/80 to-primary/70">
            <span>[NOUVELLE ENTRÉE]</span>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-3">
            <div>
              <label className="block text-xs font-black text-primary mb-2 uppercase">Pseudo *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-white/20 bg-background/60 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--neon-1)]"
                placeholder="Skyblogger_2004"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-primary mb-2 uppercase">Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-white/20 bg-background/60 text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--neon-2)]"
                rows={3}
                placeholder="Jtm trop 💖, c’était iconique !"
                required
              />
            </div>
            {errorMessage && (
              <p className="text-xs font-mono text-red-400">{errorMessage}</p>
            )}
            <button
              className="skylog-button bg-primary hover:bg-secondary disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isPending}
            >
              {isPending ? "Publication..." : "PUBLIER"}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {entries.map((entry) => (
            <article key={entry.id} className="skylog-widget bg-card border border-white/15 y2k-neon-border">
              <div className="skylog-widget-header">
                <span>[ {entry.name} ]</span>
                <span className="text-[10px]">{new Date(entry.created_at).toLocaleString()}</span>
              </div>
              <div className="p-4">
                <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{entry.message}</p>
              </div>
            </article>
          ))}
          {entries.length === 0 && (
            <div className="skylog-widget bg-card border border-white/15">
              <div className="p-8 text-center">
                <p className="text-sm font-mono">Aucune entrée. Sois le premier à écrire !</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

