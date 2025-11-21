"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { triggerWizz } from "@/lib/wizz"
import { createClient } from "@/utils/client"
import { sendWizzBroadcast } from "@/lib/wizz-realtime"
import { sendChatMessage } from "@/app/actions/chat"
import { logEvent } from "@/app/actions/log"
import { updatePresence } from "@/app/actions/presence"

type ChatMsg = { id: string; from: string; text: string; at: number }

export default function MSNChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState("")
  const [chatBlocked, setChatBlocked] = useState(false)
  const [nick, setNick] = useState("")
  const [editingNick, setEditingNick] = useState(false)
  const [status, setStatus] = useState<"online" | "busy" | "away" | "offline">("online")
  const supabase = useMemo(() => createClient(), [])
  const containerRef = useRef<HTMLDivElement>(null)
  const subscribedRef = useRef(false)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const sessionIdRef = useRef<string>("")
  const lastWizzRef = useRef<number>(0)
  const presenceRef = useRef<any>(null)
  const [onlineCount, setOnlineCount] = useState<number>(1)

  useEffect(() => {
    if (!open) return
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight })
  }, [open, messages])

  useEffect(() => {
    // flags
    fetch("/api/flags")
      .then((r) => r.json())
      .then((j) => setChatBlocked(!!j.chatBlocked))
      .catch(() => {})

    // ouvrir par défaut uniquement sur desktop (>= 1024px)
    try {
      if (window.innerWidth >= 1024) setOpen(true)
    } catch {}

    // hydratation du pseudo: lecture synchrone des sources, puis set unique
    const readCookie = (name: string) =>
      document.cookie
        .split("; ")
        .find((row) => row.startsWith(name + "="))
        ?.split("=")[1]

    let initial = ""
    try {
      initial = sessionStorage.getItem("y2k-chat-nick") || ""
    } catch {}
    if (!initial) {
      const c = readCookie("y2k_chat_nick")
      if (c) initial = decodeURIComponent(c)
    }
    if (!initial) {
      try {
        initial = localStorage.getItem("y2k-chat-nick") || ""
      } catch {}
    }
    if (!initial) {
      initial = `Invité-${Math.random().toString(36).slice(2, 6)}`
    }
    setNick(initial)
    try {
      sessionStorage.setItem("y2k-chat-nick", initial)
      document.cookie = `y2k_chat_nick=${encodeURIComponent(initial)}; path=/`
      localStorage.setItem("y2k-chat-nick", initial)
    } catch {}

    // status
    try {
      const s = (sessionStorage.getItem("y2k-chat-status") as any) || "online"
      setStatus(s)
    } catch {}

    // session id
    try {
      const existing = localStorage.getItem("y2k-chat-session")
      sessionIdRef.current = existing || crypto.randomUUID()
      localStorage.setItem("y2k-chat-session", sessionIdRef.current)
    } catch {
      sessionIdRef.current = crypto.randomUUID()
    }

    // load history + subscribe realtime
    if (!subscribedRef.current) {
      subscribedRef.current = true
      const load = async () => {
        const { data } = await supabase
          .from("chat_messages")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(50)
        if (data) {
          const mapped = data.map((d: any) => ({
            id: d.id as string,
            from: d.author as string,
            text: d.message as string,
            at: new Date(d.created_at as string).getTime(),
          }))
          setMessages(mapped)
          mapped.forEach((m) => seenIdsRef.current.add(m.id))
        }
      }
      load()
      const channel = supabase
        .channel("chat-messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages" },
          (payload) => {
            const id = (payload.new as any).id as string
            if (seenIdsRef.current.has(id)) return
            seenIdsRef.current.add(id)
            setMessages((prev) => [
              ...prev,
              {
                id,
                from: (payload.new as any).author as string,
                text: (payload.new as any).message as string,
                at: new Date((payload.new as any).created_at as string).getTime(),
              },
            ])
          },
        )
        .subscribe()
      // Presence realtime pour compteur "en ligne"
      const pres = supabase.channel("chat-presence", { config: { presence: { key: sessionIdRef.current } } })
      pres
        .on("presence", { event: "sync" }, () => {
          try {
            const state = pres.presenceState() as Record<string, any[]>
            let c = 0
            Object.values(state).forEach((arr) => (c += (arr as any[]).length))
            setOnlineCount(Math.max(1, c))
          } catch {}
        })
        .subscribe((s) => {
          if (s === "SUBSCRIBED") {
            pres.track({ nick, online_at: new Date().toISOString() })
          }
        })
      presenceRef.current = pres
      return () => {
        supabase.removeChannel(channel)
        if (presenceRef.current) supabase.removeChannel(presenceRef.current)
        subscribedRef.current = false
      }
    }
  }, [])

  const send = () => {
    if (!input.trim() || chatBlocked) return
    const author = nick.trim() || "Anonyme"
    // persist nick into cookie and localStorage
    try {
      // Cookie de session (expire à la fermeture du navigateur) + sessionStorage
      document.cookie = `y2k_chat_nick=${encodeURIComponent(author)}; path=/`
      sessionStorage.setItem("y2k-chat-nick", author)
      localStorage.setItem("y2k-chat-nick", author)
    } catch {}
    // optimistic with deterministic id
    const id = crypto.randomUUID()
    const text = input.trim()
    setInput("")
    seenIdsRef.current.add(id)
    setMessages((prev) => [...prev, { id, from: author, text, at: Date.now() }])
    // persist
    void sendChatMessage({ id, author, message: text }).catch(async (e: any) => {
      console.error("[chat] send failed:", e?.message || e)
      await logEvent("error", "chat send failed", { error: e?.message || String(e) })
    })
  }

  const wizz = () => {
    const now = Date.now()
    if (now - lastWizzRef.current < 8000) return
    lastWizzRef.current = now
    void sendWizzBroadcast({ at: Date.now(), from: nick || "Anonyme" })
    void fetch("/api/wizz", { method: "POST" }).catch(() => {})
    triggerWizz()
  }

  // Emoticônes façon MSN
  const EMOTES_LIST = [
    { code: ":-)", emoji: "🙂" },
    { code: ":D", emoji: "😄" },
    { code: ";-)", emoji: "😉" },
    { code: ":-P", emoji: "😛" },
    { code: ":-(", emoji: "🙁" },
    { code: ":'(", emoji: "😢" },
    { code: ":-*", emoji: "😘" },
    { code: "<3", emoji: "❤️" },
    { code: "xD", emoji: "😆" },
  ]
  const renderEmotes = (t: string) => {
    let out = t
    EMOTES_LIST.forEach(({ code, emoji }) => {
      const re = new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
      out = out.replace(re, emoji)
    })
    return out
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {!open && (
        <button className="skylog-button bg-secondary text-secondary-foreground" onClick={() => setOpen(true)}>
          Ouvrir MSN
        </button>
      )}
      {open && (
        <div className="skylog-widget bg-card border border-white/15 y2k-neon-border w-96">
          <div className="skylog-widget-header">
            <span className="inline-flex items-center gap-2">
              <img src="/images/msn.png" alt="MSN" className="h-4 w-4 rounded-sm" />
              <span>[ MSN CHAT ]</span>
            </span>
            <div className="flex items-center gap-2">
              <button className="skylog-button bg-accent text-foreground" onClick={wizz}>
                Wizz!
              </button>
              <button className="skylog-button bg-primary" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
          </div>
          <div className="px-3 pt-3 pb-0">
            {!editingNick ? (
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-mono text-foreground/70">
                  Pseudo: <span className="font-bold">{nick || "Anonyme"}</span>
                </div>
                <button className="skylog-button bg-secondary text-secondary-foreground text-[10px]" onClick={() => setEditingNick(true)}>
                  Changer
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  className="flex-1 px-2 py-1 border border-white/20 bg-background/70 text-foreground font-mono text-xs"
                  placeholder="Ton pseudo"
                />
                <button
                  className="skylog-button bg-primary text-[10px]"
                  onClick={() => {
                    try {
                      localStorage.setItem("y2k-chat-nick", nick.trim() || "Anonyme")
                    } catch {}
                    setEditingNick(false)
                  }}
                >
                  OK
                </button>
              </div>
            )}
          </div>
          <div className="px-3 pt-2 text-[11px] font-mono text-foreground/70">
            En ligne: <span className="font-bold">{onlineCount}</span>
          </div>
          <div ref={containerRef} className="p-3 h-56 overflow-auto bg-background/60">
            {messages.map((m) => (
              <div key={m.id} className="mb-2">
                <div className="text-xs font-bold">{m.from}</div>
                <div className="font-mono text-sm">{renderEmotes(m.text)}</div>
                <div className="text-[10px] font-mono text-foreground/60">
                  {new Date(m.at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    aria-label="Ouvrir les emojis"
                    className="skylog-button bg-background/60 text-base h-9 w-10 flex items-center justify-center"
                  >
                    🙂
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    side="top"
                    align="start"
                    sideOffset={10}
                    className="z-[2000] min-w-[220px] bg-card border border-white/15 y2k-neon-border p-2 grid grid-cols-4 gap-2 rounded-md shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out"
                  >
                    {EMOTES_LIST.map((e) => (
                      <DropdownMenu.Item
                        key={e.code}
                        onSelect={(ev) => {
                          ev.preventDefault()
                          setInput((prev) => (prev ? `${prev} ${e.code}` : e.code))
                        }}
                        className="skylog-button bg-background/40 text-xs cursor-pointer px-2 py-1"
                      >
                        {e.emoji} <span className="text-foreground/60 font-mono ml-1">{e.code}</span>
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 min-w-0 h-9 px-2 border border-white/20 bg-background/70 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--neon-2)] disabled:opacity-60"
                placeholder={chatBlocked ? "Chat bloqué par l’admin" : "Tape ton message..."}
                disabled={chatBlocked}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button
                className="skylog-button bg-primary h-9 px-4 disabled:opacity-60 flex-shrink-0 whitespace-nowrap min-w-[92px] w-full sm:w-auto mt-2 sm:mt-0"
                onClick={send}
                disabled={chatBlocked}
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

