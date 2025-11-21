"use client"

import Link from "next/link"
import { useState } from "react"
import VisitClock from "@/components/visit-clock"
import { triggerWizz } from "@/lib/wizz"

const links = [
  { href: "/", label: "Accueil" },
  { href: "/programme", label: "Programme" },
  { href: "/artistes", label: "Artistes" },
  { href: "/infos", label: "Infos pratiques" },
  { href: "/photos", label: "Galerie" },
  { href: "/reliques", label: "Reliques" },
]

export default function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-white/10 shadow-[0_15px_30px_rgba(5,5,25,0.45)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="font-black tracking-[0.4em] text-xs uppercase y2k-glow">
            Y2K•40
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[0.75rem] font-mono uppercase tracking-[0.25em]">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-secondary transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <VisitClock inline />
            </div>
            <button className="skylog-button text-xs px-4 py-2 hidden sm:inline-flex" onClick={triggerWizz}>
              Wizz Flash
            </button>
            <button
              className="md:hidden skylog-button px-3 py-2 text-xs"
              onClick={() => setOpen((prev) => !prev)}
              aria-label="Ouvrir le menu"
            >
              Menu
            </button>
          </div>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-white/10 bg-background/90">
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block px-4 py-3 text-xs font-mono uppercase tracking-[0.3em] border-b border-white/5"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}

