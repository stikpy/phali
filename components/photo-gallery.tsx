"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/client"

type RemotePhoto = {
  name: string
  url: string
  thumb: string
}

interface PhotoGalleryProps {
  photos: string[]
  onUpload: (photos: string[]) => void
  limit?: number
  showUpload?: boolean
}

export default function PhotoGallery({ photos, onUpload, limit, showUpload = true }: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [remotePhotos, setRemotePhotos] = useState<RemotePhoto[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        // Liste d'abord les fichiers dans le dossier "event"
        const { data, error } = await supabase.storage.from("photos").list("event", {
          limit: 1000,
          sortBy: { column: "created_at", order: "desc" },
        })
        if (error) {
          // fallback: tenter la racine si le dossier n'existe pas encore
          const fallback = await supabase.storage.from("photos").list(undefined, {
            limit: 1000,
            sortBy: { column: "created_at", order: "desc" },
          })
          if (fallback.error) return
          const fallbackUrls: RemotePhoto[] =
            (fallback.data as any)?.flatMap((obj: any) => {
              // ignore les "dossiers" pour éviter 404
              if (obj.id === undefined && obj.metadata === null) return []
              const url = supabase.storage.from("photos").getPublicUrl(obj.name).data.publicUrl
              const thumb =
                supabase.storage
                  .from("photos")
                  .getPublicUrl(obj.name, { transform: { width: 480, quality: 70 } }).data.publicUrl
              return [{ name: obj.name, url, thumb }]
            }) ?? []
          setRemotePhotos(fallbackUrls)
          return
        }
        const urls: RemotePhoto[] =
          data?.map((obj) => {
            const full = supabase.storage.from("photos").getPublicUrl(`event/${obj.name}`).data.publicUrl
            const thumb =
              supabase.storage
                .from("photos")
                .getPublicUrl(`event/${obj.name}`, { transform: { width: 640, quality: 70 } }).data.publicUrl
            return { name: obj.name, url: full, thumb }
          }) ?? []
        setRemotePhotos(urls)
      } catch {}
    }
    fetchPhotos()
  }, [])

  const uploadFiles = async (files: FileList) => {
    const uploaded: RemotePhoto[] = []
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() || "png"
      const path = `event/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from("photos").upload(path, file, { upsert: false })
      if (upErr) continue
      const { data } = supabase.storage.from("photos").getPublicUrl(path)
      const thumb = supabase.storage.from("photos").getPublicUrl(path, { transform: { width: 640, quality: 70 } }).data
        .publicUrl
      uploaded.push({ name: path.replace(/^event\\//, ""), url: data.publicUrl, thumb })
    }
    if (uploaded.length) {
      setRemotePhotos((prev) => [...uploaded, ...prev])
      onUpload(uploaded.map((u) => u.url))
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

  const allPhotos = [...remotePhotos.map((p) => p.url), ...photos]
  const allThumbs = new Map(remotePhotos.map((p) => [p.url, p.thumb] as const))
  const limitedPhotos = typeof limit === "number" ? allPhotos.slice(0, limit) : allPhotos

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
        {showUpload && (
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

        {/* Photos Grid */}
        {limitedPhotos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {limitedPhotos.map((photo, index) => (
              <div
                key={`${photo}-${index}`}
                className="skylog-widget border border-white/15 overflow-hidden transform hover:scale-105 transition-transform y2k-polaroid y2k-hover-glow"
                style={{ transform: `rotate(${index % 3 ? 1 : -1}deg)` }}
              >
                <div className="skylog-widget-header bg-primary flex items-center justify-between">
                  <span>[PHOTO {index + 1}]</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="skylog-button bg-secondary text-secondary-foreground text-[11px]"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      Voir
                    </button>
                    <a
                      href={photo}
                      download
                      className="skylog-button bg-accent text-foreground text-[11px]"
                      aria-label="Télécharger la photo"
                    >
                      Télécharger
                    </a>
                  </div>
                </div>
                <div className="relative w-full aspect-square bg-black/30 cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                  <img
                    src={allThumbs.get(photo) || photo || "/placeholder.svg"}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="skylog-widget bg-card border border-white/15 y2k-neon-border">
            <div className="p-12 text-center space-y-2">
              <p className="text-2xl font-black">PAS ENCORE DE PHOTOS</p>
              <p className="text-sm font-mono text-foreground/70">Elles apparaîtront ici après la soirée !</p>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 y2k-scanlines"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="skylog-widget max-w-4xl w-full border border-white/15 bg-card" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedPhoto || "/placeholder.svg"}
                alt="Full size"
                className="w-full h-auto max-h-96 object-contain"
              />
              <a
                href={selectedPhoto}
                download
                className="absolute -top-6 left-0 skylog-button bg-accent text-foreground text-xs"
              >
                Télécharger
              </a>
              <button
                className="absolute -top-6 -right-6 text-4xl font-black text-accent cursor-pointer hover:animate-bounce-flash"
                onClick={() => setSelectedPhoto(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
