"use client"

let wizzAudio: HTMLAudioElement | null = null

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
}

