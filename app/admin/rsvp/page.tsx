"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/client"
import { getReminderEmails } from "@/app/actions/reminder"
import PageShell from "@/components/page-shell"

type RsvpEntry = {
  id: string
  created_at: string
  name: string
  email: string
  guests: number
  dietary: string | null
  message: string | null
}

export default function AdminRsvpPage() {
  const [entries, setEntries] = useState<RsvpEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [mailtoHref, setMailtoHref] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      const { data, error } = await supabase.from("rsvp_responses").select("*").order("created_at", { ascending: false })
      if (!error && data) {
        setEntries(data as unknown as RsvpEntry[])
      }
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel("rsvp-responses")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rsvp_responses" },
        (payload) => {
          setEntries((prev) => [payload.new as RsvpEntry, ...prev])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <main className="min-h-screen crt-layer">
      <PageShell>
        <section className="space-y-8">
          <header className="skylog-widget secondary y2k-neon-border">
            <div className="skylog-widget-header">
              <span>[ ADMIN • RSVP ]</span>
            </div>
            <div className="p-6 text-center space-y-2">
              <h1 className="text-3xl font-black tracking-[0.3em] uppercase">Suivi des confirmations</h1>
              <p className="text-sm font-mono text-foreground/70">
                Consultation en direct des réponses enregistrées via Supabase.
              </p>
            </div>
          </header>

          <div className="skylog-widget bg-card border border-white/15 y2k-neon-border">
            <div className="skylog-widget-header bg-gradient-to-r from-accent/80 to-primary/70">
              <span>[ ACTIONS ]</span>
            </div>
            <div className="p-4 flex flex-wrap gap-3 items-center">
              <button
                className="skylog-button bg-primary hover:bg-secondary"
                onClick={async () => {
                  const res = await getReminderEmails()
                  if (!res.success) return
                  const emails = res.emails
                  const subject = encodeURIComponent("Rappel – Soirée Influence Année 2000")
                  const body = encodeURIComponent(
                    "Hello ! On espère te voir à la soirée. Peux-tu confirmer ta présence ?\n\nRSVP: https://ton-domaine/rsvp",
                  )
                  const bcc = encodeURIComponent(emails.join(","))
                  setMailtoHref(`mailto:?bcc=${bcc}&subject=${subject}&body=${body}`)
                  try {
                    await navigator.clipboard.writeText(emails.join(","))
                    setCopied(true)
                    setTimeout(() => setCopied(false), 3000)
                  } catch {}
                }}
              >
                Envoyer un rappel (email)
              </button>
              {mailtoHref && (
                <a href={mailtoHref} className="skylog-button bg-secondary text-secondary-foreground">
                  Ouvrir dans mon client mail
                </a>
              )}
              {copied && <span className="text-[11px] font-mono text-foreground/70">Emails copiés dans le presse‑papiers</span>}
            </div>
          </div>

          <div className="skylog-widget bg-card border border-white/15 y2k-neon-border overflow-hidden">
            <div className="skylog-widget-header bg-gradient-to-r from-primary/80 to-secondary/70">
              <span>{entries.length} RSVP</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm font-mono">
                <thead className="bg-background/60">
                  <tr>
                    <th className="px-4 py-3 uppercase tracking-[0.3em] text-xs">Date</th>
                    <th className="px-4 py-3 uppercase tracking-[0.3em] text-xs">Nom</th>
                    <th className="px-4 py-3 uppercase tracking-[0.3em] text-xs">Email</th>
                    <th className="px-4 py-3 uppercase tracking-[0.3em] text-xs">Invités</th>
                    <th className="px-4 py-3 uppercase tracking-[0.3em] text-xs">Régime</th>
                    <th className="px-4 py-3 uppercase tracking-[0.3em] text-xs">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-foreground/60">
                        Chargement...
                      </td>
                    </tr>
                  ) : entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-foreground/60">
                        Aucune réponse pour le moment.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-background/40 transition-colors">
                        <td className="px-4 py-3 text-xs text-foreground/70">
                          {new Date(entry.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs">{entry.name}</td>
                        <td className="px-4 py-3 text-xs text-foreground/70">{entry.email}</td>
                        <td className="px-4 py-3 text-xs">{entry.guests}</td>
                        <td className="px-4 py-3 text-xs text-foreground/60">{entry.dietary || "-"}</td>
                        <td className="px-4 py-3 text-xs text-foreground/60">{entry.message || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </PageShell>
    </main>
  )
}

