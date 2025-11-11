"use client"

import { useEffect, useMemo, useRef } from "react"
import { createClient } from "@/utils/client"
import { triggerWizz } from "@/lib/wizz"

export default function WizzListener() {
  const supabase = useMemo(() => createClient(), [])
  const lastRef = useRef(0)

  useEffect(() => {
    const ch = supabase.channel("wizz-global")
    ch.on("broadcast", { event: "wizz" }, (payload) => {
      const now = Date.now()
      // anti‑spam: ignore si < 8s depuis le dernier wizz reçu
      if (now - lastRef.current < 8000) return
      lastRef.current = now
      triggerWizz()
    })
    ch.subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [supabase])

  return null
}


