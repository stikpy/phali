"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  src: string
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}

export default function AvatarCropper({ src, onCancel, onConfirm }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [dragging, setDragging] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [last, setLast] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
      // position initiale centrée + scale pour couvrir le cercle
      const base = 512 / Math.min(img.naturalWidth, img.naturalHeight)
      setScale(Math.max(1, base))
      setPos({ x: 0, y: 0 })
    }
  }, [src])

  const startDrag = (e: React.MouseEvent) => {
    setDragging(true)
    setLast({ x: e.clientX, y: e.clientY })
  }
  const onMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const dx = e.clientX - last.x
    const dy = e.clientY - last.y
    setLast({ x: e.clientX, y: e.clientY })
    setPos((p) => {
      const size = 512
      const renderW = imgSize.w * scale
      const renderH = imgSize.h * scale
      const maxOffsetX = Math.max(0, (renderW - size) / 2)
      const maxOffsetY = Math.max(0, (renderH - size) / 2)
      const nx = Math.max(-maxOffsetX, Math.min(maxOffsetX, p.x + dx))
      const ny = Math.max(-maxOffsetY, Math.min(maxOffsetY, p.y + dy))
      return { x: nx, y: ny }
    })
  }
  const endDrag = () => setDragging(false)

  const confirm = () => {
    // exporte un carré 512x512
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const img = imgRef.current
    if (!img) return
    // calcule le rendu en fonction du scale et du déplacement
    // on dessine l'image centrée puis on applique l'offset utilisateur
    const renderW = imgSize.w * scale
    const renderH = imgSize.h * scale
    const centerX = size / 2 - renderW / 2 + pos.x
    const centerY = size / 2 - renderH / 2 + pos.y
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, size, size)
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(img, centerX, centerY, renderW, renderH)
    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob)
    }, "image/png", 0.95)
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="skylog-widget bg-card border border-white/15 y2k-neon-border w-full max-w-xl">
        <div className="skylog-widget-header">
          <span>[ RECADRER L'AVATAR ]</span>
        </div>
        <div className="p-4">
          <div
            ref={containerRef}
            className="relative mx-auto"
            style={{ width: 320, height: 320 }}
            onMouseDown={startDrag}
            onMouseMove={onMove}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
          >
            <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-white/30 shadow-xl">
              <img
                ref={imgRef}
                src={src}
                alt="crop"
                draggable={false}
                style={{
                  width: imgSize.w ? imgSize.w * scale : "100%",
                  height: imgSize.h ? imgSize.h * scale : "100%",
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-black text-primary mb-2 uppercase">Zoom</label>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button className="skylog-button bg-secondary text-secondary-foreground" onClick={onCancel}>
              Annuler
            </button>
            <button className="skylog-button bg-primary" onClick={confirm}>
              Valider
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


