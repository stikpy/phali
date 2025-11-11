"use client"

let wizzAudio: HTMLAudioElement | null = null
let primed = false

export function triggerWizz() {
  document.body.classList.add("y2k-shake")
  setTimeout(() => document.body.classList.remove("y2k-shake"), 400)

  try {
    if (!wizzAudio) {
      wizzAudio = new Audio("/sounds/msn-wizz.mp3")
      wizzAudio.preload = "auto"
    }
    wizzAudio.currentTime = 0
    void wizzAudio.play()
  } catch {
    // fallback silencieux si lecture impossible
  }
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      // vibreur si dispo (mobile)
      ;(navigator as any).vibrate?.(200)
    }
  } catch {}
}

// Appeler une fois au montage pour lever la restriction autoplay sur certains navigateurs
export function enableWizzAutoplay() {
  if (primed) return
  const prime = async () => {
    try {
      if (!wizzAudio) {
        wizzAudio = new Audio("/sounds/msn-wizz.mp3")
        wizzAudio.preload = "auto"
      }
      wizzAudio.muted = true
      await wizzAudio.play().catch(() => {})
      wizzAudio.pause()
      wizzAudio.currentTime = 0
      wizzAudio.muted = false
      primed = true
    } catch {
      // ignore
    } finally {
      window.removeEventListener("pointerdown", prime, { capture: true } as any)
      window.removeEventListener("keydown", prime, { capture: true } as any)
    }
  }
  // Attend une première interaction utilisateur
  if (typeof window !== "undefined") {
    window.addEventListener("pointerdown", prime, { once: true, capture: true })
    window.addEventListener("keydown", prime, { once: true, capture: true })
  }
}

