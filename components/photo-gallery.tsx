"use client"

import type React from "react"

import { useRef, useState } from "react"

interface PhotoGalleryProps {
  photos: string[]
  onUpload: (photos: string[]) => void
}

export default function PhotoGallery({ photos, onUpload }: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newPhotos = Array.from(files).map((file) => URL.createObjectURL(file))
      onUpload(newPhotos)
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files) {
      const newPhotos = Array.from(files).map((file) => URL.createObjectURL(file))
      onUpload(newPhotos)
    }
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

        {/* Photos Grid */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="skylog-widget border border-white/15 cursor-pointer overflow-hidden transform hover:scale-105 transition-transform y2k-polaroid y2k-hover-glow"
                onClick={() => setSelectedPhoto(photo)}
                style={{ transform: `rotate(${index % 3 ? 1 : -1}deg)` }}
              >
                <div className="skylog-widget-header bg-primary">
                  <span>[PHOTO {index + 1}]</span>
                </div>
                <div className="relative w-full aspect-square bg-black/30">
                  <img
                    src={photo || "/placeholder.svg"}
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
