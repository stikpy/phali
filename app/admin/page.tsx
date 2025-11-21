"use client"

import { useEffect, useMemo, useState } from "react"
import PageShell from "@/components/page-shell"
import { createClient } from "@/utils/client"

type RsvpRow = {
  id: string
  created_at: string
  name: string
  email: string
  phone?: string | null
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
  const [flags, setFlags] = useState<{ chatBlocked: boolean; uploadBlocked: boolean }>({
    chatBlocked: false,
    uploadBlocked: false,
  })
  const [wizzCount, setWizzCount] = useState<number>(0)

  const photoUrl = (name: string) => supabase.storage.from("photos").getPublicUrl(`event/${name}`).data.publicUrl
  const photoThumb = (name: string) =>
    supabase.storage.from("photos").getPublicUrl(`event/${name}`, { transform: { width: 200, quality: 60 } }).data
      .publicUrl
  const hashString = (s: string) => {
    let h = 2166136261
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return Math.abs(h)
  }

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
      try {
        const r = await fetch("/api/minio/list")
        const json = await r.json()
        const items = (json.items || []).map((it: any) => ({ name: it.name }))
        setPhotos(items)
      } catch {}
    })()
    // Load flags
    ;(async () => {
      try {
        const r = await fetch("/api/admin/flags")
        const j = await r.json()
        setFlags({ chatBlocked: !!j.chatBlocked, uploadBlocked: !!j.uploadBlocked })
      } catch {}
    })()
    // Load wizz count + subscribe realtime
    ;(async () => {
      const { count } = await supabase.from("wizz_events").select("*", { count: "exact", head: true })
      setWizzCount(count || 0)
    })()
    const wizzCh = supabase
      .channel("wizz-events")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wizz_events" }, () =>
        setWizzCount((c) => c + 1),
      )
      .subscribe()
    // Realtime photos
    const photosCh = supabase
      .channel("admin-photos")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "storage", table: "objects", filter: "bucket_id=eq.photos" },
        (p: any) => {
          const name: string = p.new?.name || ""
          if (!name.startsWith("event/")) return
          const clean = name.slice("event/".length)
          setPhotos((prev) => [{ name: clean }, ...prev.filter((x) => x.name !== clean)])
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "storage", table: "objects", filter: "bucket_id=eq.photos" },
        (p: any) => {
          const name: string = p.old?.name || ""
          const clean = name.startsWith("event/") ? name.slice("event/".length) : name
          setPhotos((prev) => prev.filter((x) => x.name !== clean))
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
      supabase.removeChannel(photosCh)
      supabase.removeChannel(wizzCh)
    }
  }, [supabase])

  const present = rsvp.filter((r) => r.status === "present")
  const unsure = rsvp.filter((r) => r.status === "unsure")
  const absent = rsvp.filter((r) => r.status === "absent")
  const totalGuests = rsvp.reduce((acc, r) => acc + (r.guests || 0), 0)

  return (
    <main className="min-h-screen crt-layer">
      <PageShell showSidebars={false}>
        <div className="space-y-6">
          <header className="skylog-widget secondary y2k-neon-border">
            <div className="skylog-widget-header">
              <span>[ ADMIN • DASHBOARD ]</span>
            </div>
            <div className="p-4 flex flex-wrap items-center gap-2">
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
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px] font-mono text-foreground/70">Wizz total:</span>
                <span className="font-black">{wizzCount}</span>
                <button
                  className={`skylog-button ${flags.chatBlocked ? "bg-accent text-foreground" : "bg-secondary"}`}
                  onClick={async () => {
                    await fetch("/api/admin/flags", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ chat: !flags.chatBlocked }),
                    })
                    setFlags((f) => ({ ...f, chatBlocked: !f.chatBlocked }))
                  }}
                >
                  {flags.chatBlocked ? "Débloquer chat" : "Bloquer chat"}
                </button>
                <button
                  className={`skylog-button ${flags.uploadBlocked ? "bg-accent text-foreground" : "bg-secondary"}`}
                  onClick={async () => {
                    await fetch("/api/admin/flags", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ upload: !flags.uploadBlocked }),
                    })
                    setFlags((f) => ({ ...f, uploadBlocked: !f.uploadBlocked }))
                  }}
                >
                  {flags.uploadBlocked ? "Débloquer upload" : "Bloquer upload"}
                </button>
              </div>
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
                        <th className="px-4 py-3 uppercase tracking-[0.3em] text-xs">Téléphone</th>
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
                          <td className="px-4 py-3 text-xs text-foreground/70">{row.phone || "-"}</td>
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
                <div className="p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 [grid-auto-rows:8.5rem] md:[grid-auto-rows:10.5rem]">
                    {photos.map((p, i) => {
                      const url = photoUrl(p.name)
                      const shapes = [
                        { col: 3, row: 2 },
                        { col: 2, row: 2 },
                        { col: 2, row: 1 },
                        { col: 3, row: 1 },
                        { col: 1, row: 2 },
                        { col: 1, row: 1 },
                        { col: 4, row: 2 },
                      ]
                      let s = shapes[hashString(p.name) % shapes.length]
                      if (i === 0) {
                        s = { col: 4, row: 3 }
                      }
                      // Tailwind classes énumérées
                      const SPAN_CLASSES: Record<string, string> = {
                        "1x1": "md:col-span-1 md:row-span-1",
                        "2x1": "md:col-span-2 md:row-span-1",
                        "3x1": "md:col-span-3 md:row-span-1",
                        "1x2": "md:col-span-1 md:row-span-2",
                        "2x2": "md:col-span-2 md:row-span-2",
                        "3x2": "md:col-span-3 md:row-span-2",
                        "2x3": "md:col-span-2 md:row-span-3",
                        "4x3": "md:col-span-4 md:row-span-3",
                        "4x2": "md:col-span-4 md:row-span-2",
                      }
                      const key = `${s.col}x${s.row}`
                      const desktopSpan = SPAN_CLASSES[key] || SPAN_CLASSES["1x1"]
                      const mobileSpan =
                        i === 0
                          ? "col-span-2 row-span-2"
                          : `${s.col >= 2 ? "col-span-2" : "col-span-1"} ${s.row >= 2 ? "row-span-2" : "row-span-1"}`
                      const tileSpan = `${mobileSpan} ${desktopSpan}`
                      const base = 160
                      const w = Math.min(1200, base * s.col)
                      const h = Math.min(1200, base * s.row)
                      const thumb = `/api/minio/list` ? (process.env.MINIO_ENDPOINT ? `${process.env.MINIO_ENDPOINT.replace(/\/$/,"")}/${process.env.MINIO_BUCKET_NAME}/event/${p.name}` : url) : url
                      return (
                        <div
                          key={`${p.name}-${i}`}
                          className={`relative group overflow-hidden rounded-lg border border-white/10 ${tileSpan}`}
                        >
                          <img
                            src={thumb}
                            alt=""
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 w-full h-full object-cover blur-sm scale-105 opacity-70"
                          />
                          <img src={thumb} alt={p.name} className="relative z-10 block w-full h-full object-contain" />
                          <div className="absolute inset-0 z-20 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <a href={url} download className="skylog-button bg-secondary text-xs">
                              Télécharger
                            </a>
                            <button
                              className="skylog-button bg-accent text-foreground text-xs"
                              onClick={async () => {
                                await fetch("/api/minio/remove", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ key: `event/${p.name}` }),
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
              </div>
            </section>
          )}
        </div>
      </PageShell>
    </main>
  )
}


