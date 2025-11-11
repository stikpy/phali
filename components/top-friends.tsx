"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/utils/client"

type Attendee = {
  id: string
  created_at: string
  name: string
  email: string
  guests: number
  status: "present" | "absent" | "unsure" | null
  avatar_url: string | null
}

const statusLabel: Record<string, string> = {
  present: "Présent",
  absent: "Absent",
  unsure: "Indécis",
}

const defaultAvatars = [
  "/avatars/default/avatar-1.svg",
  "/avatars/default/avatar-2.svg",
  "/avatars/default/avatar-3.svg",
  "/avatars/default/avatar-4.svg",
  "/avatars/default/avatar-5.svg",
  "/avatars/default/avatar-6.svg",
  "/avatars/default/avatar-7.svg",
  "/avatars/default/avatar-8.svg",
  "/avatars/default/avatar-9.svg",
  "/avatars/default/avatar-10.svg",
]

function pickDefaultAvatar(seed: string) {
  const s = seed || Math.random().toString(36)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const idx = h % defaultAvatars.length
  return defaultAvatars[idx]
}

export default function TopFriends() {
  const [people, setPeople] = useState<Attendee[]>([])
  const [filter, setFilter] = useState<"all" | "present" | "absent" | "unsure">("all")

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data } = await supabase.from("rsvp_responses").select("*").order("created_at", { ascending: false })
      if (data) setPeople(data as unknown as Attendee[])
    }
    load()
    const channel = supabase
      .channel("rsvp-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rsvp_responses" },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filtered = useMemo(() => {
    if (filter === "all") return people
    return people.filter((p) => (p.status || "unsure") === filter)
  }, [people, filter])

  return (
    <section className="bg-background p-4 pb-12">
      <div className="max-w-5xl mx-auto">
        <div className="skylog-widget secondary mb-6 transform rotate-1">
          <div className="skylog-widget-header">
            <span>[ INVITÉS ]</span>
          </div>
          <div className="p-6 text-center">
            <h2 className="text-3xl font-black">Présences</h2>
          </div>
        </div>

        <div className="skylog-widget bg-card border border-white/15 y2k-neon-border mb-6">
          <div className="skylog-widget-header">
            <span>[ FILTRES ]</span>
          </div>
          <div className="p-3 flex gap-2 flex-wrap">
            {[
              { key: "all", label: "Tous" },
              { key: "present", label: "Présents" },
              { key: "unsure", label: "Indécis" },
              { key: "absent", label: "Absents" },
            ].map((tab: any) => (
              <button
                key={tab.key}
                className={`skylog-button ${filter === tab.key ? "bg-secondary text-secondary-foreground" : "bg-primary"}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p, idx) => (
            <div
              key={p.id}
              className="skylog-widget bg-card border border-white/15 y2k-hover-glow"
              style={{ transform: `rotate(${idx % 2 ? 1 : -1}deg)` }}
            >
              <div className="skylog-widget-header bg-gradient-to-r from-primary/80 to-secondary/80 text-card-foreground">
                <span>[ {p.name} ]</span>
              </div>
              <div className="p-4 flex flex-col items-center">
                <img
                  src={p.avatar_url || pickDefaultAvatar(p.email || p.name)}
                  alt={p.name}
                  onError={(e) => {
                    const fallback = pickDefaultAvatar(p.email || p.name)
                    if (e.currentTarget.src !== location.origin + fallback) {
                      e.currentTarget.src = fallback
                    }
                  }}
                  className="w-24 h-24 rounded-full border-2 border-white/30 object-cover mb-3 shadow-xl"
                />
                <div className="text-[11px] font-mono text-foreground/70 mb-2">
                  {statusLabel[p.status || "unsure"]}
                </div>
                <div className="text-[10px] font-mono text-foreground/50">{p.guests} invité(s)</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full skylog-widget bg-card border border-white/15">
              <div className="p-8 text-center">
                <p className="text-sm font-mono">Aucun invité pour ce filtre.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

