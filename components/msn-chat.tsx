"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { triggerWizz } from "@/lib/wizz"
import { createClient } from "@/utils/client"
import { sendWizzBroadcast } from "@/lib/wizz-realtime"
import { sendChatMessage } from "@/app/actions/chat"
import { logEvent } from "@/app/actions/log"
import { updatePresence } from "@/app/actions/presence"
import { io, type Socket } from "socket.io-client"

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
  const [authenticated, setAuthenticated] = useState<boolean>(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!open) return
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight })
  }, [open, messages])

  useEffect(() => {
    // auth
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setAuthenticated(!!j.authenticated))
      .catch(() => setAuthenticated(false))

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

    // load history + (legacy) subscribe realtime
    if (!subscribedRef.current) {
      subscribedRef.current = true
      const load = async () => {
        try {
          const r = await fetch("/api/chat/list", { cache: "no-store" })
          const j = await r.json()
          const data = (j?.messages || []) as Array<{
            id: string
            author: string
            message: string
            created_at: string
          }>
          const mapped = data.map((d) => ({
            id: d.id,
            from: d.author,
            text: d.message,
            at: new Date(d.created_at).getTime(),
          }))
          setMessages(mapped)
          mapped.forEach((m) => seenIdsRef.current.add(m.id))
        } catch {}
      }
      load()
      // Tant que le realtime n'est pas migré, petit polling pour nouveaux messages
      const poll = setInterval(load, 5000)
      // Socket.IO realtime (si configuré et authentifié)
      const serverUrl =
        (typeof window !== "undefined" && (window as any).NEXT_PUBLIC_REALTIME_SERVER_URL) ||
        process.env.NEXT_PUBLIC_REALTIME_SERVER_URL ||
        process.env.REALTIME_SERVER_URL
      if (serverUrl && authenticated) {
        try {
          const s = io(serverUrl as string, { transports: ["websocket", "polling"] })
          socketRef.current = s
          s.on("connect", () => {
            s.emit("chat:get")
          })
          s.on("chat:message", (m: { id: string; from: string; text: string; at: number }) => {
            if (!m?.id || seenIdsRef.current.has(m.id)) return
            seenIdsRef.current.add(m.id)
            setMessages((prev) => [...prev, m])
          })
        } catch {}
      }
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
        clearInterval(poll)
        try {
          socketRef.current?.close()
        } catch {}
        if (presenceRef.current) supabase.removeChannel(presenceRef.current)
        subscribedRef.current = false
      }
    }
  }, [])

  const send = () => {
    if (!input.trim() || chatBlocked || !authenticated) return
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
    // broadcast realtime (Socket.IO)
    try {
      socketRef.current?.emit("chat:message", { id, from: author, text, at: Date.now() })
    } catch {}
  }

  const wizz = () => {
    const now = Date.now()
    if (now - lastWizzRef.current < 8000 || !authenticated) return
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
          {authenticated ? (
            <>
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
            </>
          ) : (
            <div className="px-3 py-6 text-center text-sm font-mono text-foreground/80">
              Connectez‑vous via le formulaire pour voir et écrire dans le chat.
            </div>
          )}
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
                placeholder={
                  chatBlocked ? "Chat bloqué par l’admin" : authenticated ? "Tape ton message..." : "Connecte‑toi pour écrire"
                }
                disabled={chatBlocked || !authenticated}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
              <button
                className="skylog-button bg-primary h-9 px-4 disabled:opacity-60 flex-shrink-0 whitespace-nowrap min-w-[92px] w-full sm:w-auto mt-2 sm:mt-0"
                onClick={send}
                disabled={chatBlocked || !authenticated}
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

