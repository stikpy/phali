"use client"

import { useEffect, useMemo, useState } from "react"
import PageShell from "@/components/page-shell"
import { createClient } from "@/utils/client"

type RsvpRow = {
  id: string
  created_at: string
  name: string
  email: string
  guests: number
  status: "present" | "unsure" | "absent"
  avatar_url: string | null
  message: string | null
}

type ChatRow = {
  id: string
  created_at: string
  author: string
  message: string
}

type PhotoObj = {
  name: string
  created_at?: string
}

export default function AdminDashboard() {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<"rsvp" | "chat" | "photos">("rsvp")

  // RSVP
  const [rsvp, setRsvp] = useState<RsvpRow[]>([])
  // Chat
  const [chat, setChat] = useState<ChatRow[]>([])
  // Photos
  const [photos, setPhotos] = useState<PhotoObj[]>([])

  const photoUrl = (name: string) => supabase.storage.from("photos").getPublicUrl(`event/${name}`).data.publicUrl
  const photoThumb = (name: string) =>
    supabase.storage.from("photos").getPublicUrl(`event/${name}`, { transform: { width: 200, quality: 60 } }).data
      .publicUrl

  useEffect(() => {
    // Load RSVP
    ;(async () => {
      const { data } = await supabase.from("rsvp_responses").select("*").order("created_at", { ascending: false })
      setRsvp((data as unknown as RsvpRow[]) || [])
    })()
    // Chat list + realtime
    ;(async () => {
      const { data } = await supabase.from("chat_messages").select("*").order("created_at", { ascending: false })
      setChat((data as unknown as ChatRow[]) || [])
    })()
    const ch = supabase
      .channel("chat-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (p) => {
        setChat((prev) => [p.new as ChatRow, ...prev])
      })
      .subscribe()
    // Photos
    ;(async () => {
      const { data } = await supabase.storage.from("photos").list("event", {
        limit: 1000,
        sortBy: { column: "created_at", order: "desc" },
      })
      setPhotos((data as PhotoObj[]) || [])
    })()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [supabase])

  const present = rsvp.filter((r) => r.status === "present")
  const unsure = rsvp.filter((r) => r.status === "unsure")
  const absent = rsvp.filter((r) => r.status === "absent")
  const totalGuests = rsvp.reduce((acc, r) => acc + (r.guests || 0), 0)

  return (
    <main className="min-h-screen crt-layer">
      <PageShell>
        <div className="space-y-6">
          <header className="skylog-widget secondary y2k-neon-border">
            <div className="skylog-widget-header">
              <span>[ ADMIN • DASHBOARD ]</span>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              <button
                className={`skylog-button ${tab === "rsvp" ? "bg-primary" : "bg-secondary"}`}
                onClick={() => setTab("rsvp")}
              >
                RSVP
              </button>
              <button
                className={`skylog-button ${tab === "chat" ? "bg-primary" : "bg-secondary"}`}
                onClick={() => setTab("chat")}
              >
                Chat
              </button>
              <button
                className={`skylog-button ${tab === "photos" ? "bg-primary" : "bg-secondary"}`}
                onClick={() => setTab("photos")}
              >
                Photos
              </button>
            </div>
          </header>

          {tab === "rsvp" && (
            <section className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="skylog-widget y2k-neon-border">
                  <div className="skylog-widget-header">Présents</div>
                  <div className="p-4 text-3xl font-black">{present.length}</div>
                </div>
                <div className="skylog-widget y2k-neon-border">
                  <div className="skylog-widget-header">Indécis</div>
                  <div className="p-4 text-3xl font-black">{unsure.length}</div>
                </div>
                <div className="skylog-widget y2k-neon-border">
                  <div className="skylog-widget-header">Absents</div>
                  <div className="p-4 text-3xl font-black">{absent.length}</div>
                </div>
                <div className="skylog-widget y2k-neon-border">
                  <div className="skylog-widget-header">Invités total</div>
                  <div className="p-4 text-3xl font-black">{totalGuests}</div>
                </div>
              </div>

              <div className="skylog-widget bg-card border border-white/15 y2k-neon-border overflow-hidden">
                <div className="skylog-widget-header bg-gradient-to-r from-primary/80 to-secondary/70">
                  <span>{rsvp.length} réponses</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10 text-left text-sm font-mono">
                    <thead className="bg-background/60">
                      <tr>
                        <th className="px-4 py-3 uppercase tracking-[0.3em] text-xs">Date</th>
                        <th className="px-4 py-3 uppercase tracking-[0.3em] text-xs">Nom</th>
                        <th className="px-4 py-3 uppercase tracking-[0.3em] text-xs">Email</th>
                        <th className="px-4 py-3 uppercase tracking-[0.3em] text-xs">Invités</th>
                        <th className="px-4 py-3 uppercase tracking-[0.3em] text-xs">Statut</th>
                        <th className="px-4 py-3 uppercase tracking-[0.3em] text-xs">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {rsvp.map((row) => (
                        <tr key={row.id} className="hover:bg-background/40 transition-colors">
                          <td className="px-4 py-3 text-xs text-foreground/70">
                            {new Date(row.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs">{row.name}</td>
                          <td className="px-4 py-3 text-xs text-foreground/70">{row.email}</td>
                          <td className="px-4 py-3 text-xs">{row.guests}</td>
                          <td className="px-4 py-3 text-xs">{row.status}</td>
                          <td className="px-4 py-3 text-xs text-foreground/60">{row.message || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {tab === "chat" && (
            <section className="skylog-widget bg-card border border-white/15 y2k-neon-border">
              <div className="skylog-widget-header">Messages</div>
              <div className="p-3 space-y-2 max-h-[60vh] overflow-auto">
                {chat.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-3 border-b border-white/10 pb-2">
                    <div className="text-sm font-mono whitespace-pre-wrap">
                      <div className="text-foreground/60 text-[11px]">
                        {new Date(m.created_at).toLocaleString()} — {m.author}
                      </div>
                      <div>{m.message}</div>
                    </div>
                    <button
                      className="skylog-button bg-accent text-foreground text-xs"
                      onClick={async () => {
                        await fetch("/api/admin/chat/delete", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: m.id }),
                        })
                        setChat((prev) => prev.filter((x) => x.id !== m.id))
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "photos" && (
            <section className="space-y-3">
              <div className="skylog-widget bg-card border border-white/15 y2k-neon-border">
                <div className="skylog-widget-header">Photos (bucket: photos/event)</div>
                <div className="p-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {photos.map((p) => {
                    const url = photoUrl(p.name)
                    return (
                      <div key={p.name} className="relative group">
                        <img src={photoThumb(p.name)} alt={p.name} className="w-full h-24 object-cover rounded-md border border-white/15" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <a href={url} download className="skylog-button bg-secondary text-xs">
                            Télécharger
                          </a>
                          <button
                            className="skylog-button bg-accent text-foreground text-xs"
                            onClick={async () => {
                              await fetch("/api/admin/photos/delete", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ path: `event/${p.name}` }),
                              })
                              setPhotos((prev) => prev.filter((x) => x.name !== p.name))
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          )}
        </div>
      </PageShell>
    </main>
  )
}


