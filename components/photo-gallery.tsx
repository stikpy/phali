"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/client"
import { usePhotoRealtime } from "@/hooks/usePhotoRealtime"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type RemotePhoto = {
  name: string
  url: string
  thumb: string
}

interface PhotoGalleryProps {
  photos: string[] // conservé pour compat mais non utilisé depuis la persistance Supabase
  onUpload: (photos: string[]) => void // conservé pour compat, non appelé
  limit?: number
  showUpload?: boolean
}

export default function PhotoGallery({ photos, onUpload, limit, showUpload = true }: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [remotePhotos, setRemotePhotos] = useState<RemotePhoto[]>([])
  const [uploadBlocked, setUploadBlocked] = useState(false)
  const supabase = createClient()
  const realtime = usePhotoRealtime()

  useEffect(() => {
    // flags
    fetch("/api/flags")
      .then((r) => r.json())
      .then((j) => setUploadBlocked(!!j.uploadBlocked))
      .catch(() => {})
    const fetchPhotos = async () => {
      try {
        const r = await fetch("/api/minio/list")
        const json = await r.json()
        if (json?.items) {
          const items: RemotePhoto[] = json.items.map((it: any) => ({
            name: it.name,
            url: `/api/minio/proxy?key=event/${it.name}`,
            thumb: `/api/minio/proxy?key=event/${it.name}`,
          }))
          setRemotePhotos(items)
        }
      } catch {}
    }
    fetchPhotos()
  }, [])

  // Fallback polling si realtime indisponible (compatible HTTPS)
  useEffect(() => {
    let timer: any
    let cancelled = false
    const refresh = async () => {
      try {
        if (document.hidden) return
        const r = await fetch("/api/minio/list", { cache: "no-store" })
        const json = await r.json()
        const currentNames = new Set((json.items || []).map((it: any) => it.name))
        setRemotePhotos((prev) => {
          const prevNames = new Set(prev.map((p) => p.name))
          const added = (json.items || [])
            .filter((it: any) => !prevNames.has(it.name))
            .map((it: any) => ({
              name: it.name,
              url: `/api/minio/proxy?key=event/${it.name}`,
              thumb: `/api/minio/proxy?key=event/${it.name}`,
            }))
          const kept = prev.filter((p) => currentNames.has(p.name))
          return added.length ? [...added, ...kept] : kept
        })
      } catch {
        // ignore
      }
    }
    timer = setInterval(refresh, 7000)
    const onVis = () => !document.hidden && refresh()
    document.addEventListener("visibilitychange", onVis)
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  // Realtime (Socket.IO) si configuré
  useEffect(() => {
    // Ajout incrémental quand une nouvelle photo arrive
    if (realtime?.newPhotos && realtime.newPhotos.length > 0) {
      const added = realtime.newPhotos.map((p: any) => ({
        name: p.name,
        url: `/api/minio/proxy?key=event/${p.name}`,
        thumb: `/api/minio/proxy?key=event/${p.name}`,
      }))
      setRemotePhotos((prev) => {
        const seen = new Set(prev.map((x) => x.name))
        const merged = [...added.filter((a) => !seen.has(a.name)), ...prev]
        return merged
      })
      realtime.clearNewPhotos?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime.newPhotos])
  // Realtime: écoute INSERT/DELETE sur storage.objects (bucket photos)
  useEffect(() => {
    const ch = supabase
      .channel("photos-gallery")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "storage", table: "objects", filter: "bucket_id=eq.photos" },
        async (payload: any) => {
          const name: string = payload.new?.name || ""
          if (!name.startsWith("event/")) return
          const clean = name.slice("event/".length)
          const full = supabase.storage.from("photos").getPublicUrl(name).data.publicUrl
          const thumb = supabase.storage
            .from("photos")
            .getPublicUrl(name, { transform: { width: 640, quality: 70 } }).data.publicUrl
          setRemotePhotos((prev) => {
            if (prev.some((p) => p.name === clean)) return prev
            return [{ name: clean, url: full, thumb }, ...prev]
          })
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "storage", table: "objects", filter: "bucket_id=eq.photos" },
        (payload: any) => {
          const name: string = payload.old?.name || ""
          const clean = name.startsWith("event/") ? name.slice("event/".length) : name
          setRemotePhotos((prev) => prev.filter((p) => p.name !== clean))
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [])

  const uploadFiles = async (files: FileList) => {
    const uploaded: RemotePhoto[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append("file", file)
      const r = await fetch("/api/minio/upload", { method: "POST", body: fd })
      const json = await r.json()
      if (json?.success) {
        const name = (json.key as string).replace(/^event\//, "")
        const proxied = `/api/minio/proxy?key=event/${name}`
        uploaded.push({ name, url: proxied, thumb: proxied })
      }
    }
    if (uploaded.length) {
      setRemotePhotos((prev) => [...uploaded, ...prev])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      await uploadFiles(files)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files) {
      await uploadFiles(files)
    }
  }

  // N’affiche que les photos persistées (remotePhotos) pour éviter les doublons
  const items = typeof limit === "number" ? remotePhotos.slice(0, limit) : remotePhotos
  const limitedPhotos = items // compat nommage historique

  // Utilitaire: hash déterministe pour un layout stable
  const hashString = (s: string) => {
    let h = 2166136261
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return Math.abs(h)
  }

  return (
    <section className="bg-transparent p-4 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="skylog-widget secondary mb-6 transform rotate-1">
          <div className="skylog-widget-header">
            <span>[ GALERIE PHOTOS ]</span>
          </div>
          <div className="p-6 text-center">
            <h2 className="text-3xl font-black">LES PHOTOS DE LA SOIRÉE</h2>
          </div>
        </div>

        {/* Upload Zone */}
        {showUpload && uploadBlocked && (
          <div className="skylog-widget bg-card border border-white/15 y2k-neon-border mb-6">
            <div className="skylog-widget-header bg-gradient-to-r from-accent/80 to-primary/70">
              <span>[ Upload temporairement désactivé ]</span>
            </div>
            <div className="p-4 text-center text-sm font-mono text-foreground/80">
              L’administrateur a bloqué l’upload pour le moment.
            </div>
          </div>
        )}

        {showUpload && !uploadBlocked && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`skylog-widget border border-dashed border-white/20 p-10 text-center cursor-pointer mb-6 transition-all y2k-neon-border ${
              dragActive ? "bg-secondary/40" : "bg-card"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-5xl mb-3 animate-wiggle">📸</p>
            <p className="text-lg font-black">DRAG & DROP VOS PHOTOS</p>
            <p className="text-sm font-mono">ou cliquez ici</p>
          </div>
        )}

        {/* Photos Grid (Bento) */}
        {limitedPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 [grid-auto-rows:8.5rem] md:[grid-auto-rows:10.5rem]">
            {limitedPhotos.map((item, index) => {
              const photo = item.url
              // Motif bento aléatoire mais stable par photo
              const shapes = [
                { col: 3, row: 2 }, // horizontal large
                { col: 2, row: 2 },
                { col: 2, row: 1 }, // horizontal
                { col: 3, row: 1 }, // bandeau
                { col: 1, row: 2 }, // vertical
                { col: 1, row: 1 },
                { col: 4, row: 2 }, // très large
                { col: 2, row: 3 }, // haut
              ]
              let p = shapes[hashString(item.name) % shapes.length]
              if (index === 0) {
                p = { col: 4, row: 3 }
              }
              // Classes Tailwind enumerées (pas d'interpolation dynamique pour la purge)
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
              const key = `${p.col}x${p.row}`
              const desktopSpan = SPAN_CLASSES[key] || SPAN_CLASSES["1x1"]
              const mobileSpan =
                index === 0
                  ? "col-span-2 row-span-2"
                  : `${p.col >= 2 ? "col-span-2" : "col-span-1"} ${p.row >= 2 ? "row-span-2" : "row-span-1"}`
              const tileSpan = `${mobileSpan} ${desktopSpan}`
              return (
                <div
                  key={`${photo}-${index}`}
                  className={`relative group overflow-hidden rounded-xl border border-white/10 ${tileSpan} transition-transform hover:scale-[1.01] cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.35)]`}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  {/* Vignette MinIO: object-cover simple */}
                  <img src={photo || "/placeholder.svg"} alt={`Photo ${index + 1}`} className="block w-full h-full object-cover" loading="lazy" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2">
                      <button
                        className="skylog-button bg-secondary text-secondary-foreground text-[10px] px-2 py-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPhoto(photo)
                        }}
                      >
                        Voir
                      </button>
                      <a
                        href={photo}
                        download
                        className="skylog-button bg-accent text-foreground text-[10px] px-2 py-1"
                        aria-label="Télécharger la photo"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Télécharger
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="skylog-widget bg-card border border-white/15 y2k-neon-border">
            <div className="p-12 text-center space-y-2">
              <p className="text-2xl font-black">PAS ENCORE DE PHOTOS</p>
              <p className="text-sm font-mono text-foreground/70">Elles apparaîtront ici après la soirée !</p>
            </div>
          </div>
        )}

        {/* Modal d’aperçu */}
        <Dialog open={!!selectedPhoto} onOpenChange={(o) => !o && setSelectedPhoto(null)}>
          <DialogContent className="bg-transparent border-0 p-0 w-auto max-w-md sm:max-w-lg" showCloseButton>
            <div className="relative">
              <DialogTitle className="sr-only">Aperçu photo</DialogTitle>
              <img
                src={selectedPhoto || "/placeholder.svg"}
                alt="Full size"
                className="w-full h-auto max-h-[50vh] object-contain rounded-md"
              />
              {selectedPhoto && (
                <a
                  href={selectedPhoto}
                  download
                  className="absolute top-3 left-3 skylog-button bg-accent text-foreground text-xs"
                >
                  Télécharger
                </a>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
