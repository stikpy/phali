"use client"

import { useEffect, useMemo, useState } from "react"
import { io, Socket } from "socket.io-client"

export type RealtimePhoto = {
  name: string
  url: string
  size?: number
  contentType?: string
  lastModified?: string | Date
  etag?: string
}

export function usePhotoRealtime() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [photos, setPhotos] = useState<RealtimePhoto[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [newPhotos, setNewPhotos] = useState<RealtimePhoto[]>([])
  const serverUrl =
    process.env.NEXT_PUBLIC_REALTIME_SERVER_URL || process.env.REALTIME_SERVER_URL || ""

  useEffect(() => {
    if (!serverUrl) return
    const s = io(serverUrl, { transports: ["websocket", "polling"] })
    s.on("connect", () => {
      setIsConnected(true)
      s.emit("get-all-photos")
    })
    s.on("disconnect", () => setIsConnected(false))
    s.on("all-photos", (all: RealtimePhoto[]) => {
      setPhotos(all || [])
    })
    s.on("photo-uploaded", (p: RealtimePhoto) => {
      setPhotos((prev) => [p, ...prev])
      setNewPhotos((prev) => [p, ...prev])
    })
    s.on("new-photos", (batch: RealtimePhoto[]) => {
      setPhotos((prev) => [...(batch || []), ...prev])
      setNewPhotos((prev) => [...(batch || []), ...prev])
    })
    s.on("error", (e: any) => {
      // eslint-disable-next-line no-console
      console.error("[realtime] error", e)
    })
    setSocket(s)
    return () => {
      try {
        s.close()
      } catch {}
    }
  }, [serverUrl])

  return {
    socket,
    photos,
    isConnected,
    newPhotos,
    clearNewPhotos: () => setNewPhotos([]),
  }
}




