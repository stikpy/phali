import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import MSNChat from "@/components/msn-chat"
import Y2KControls from "@/components/y2k-controls"

export const metadata: Metadata = {
  title: "🎉 40 ans - Influence Année 2000 | Anniversaire",
  description:
    "Célébrez les 40 ans avec une soirée thématique Y2K ! Carton d'invitation numérique, galerie photos et RSVP en ligne.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground pt-16">
        <SiteHeader />
        <div className="min-h-[calc(100vh-220px)]">{children}</div>
        <SiteFooter />
        <MSNChat />
        <Y2KControls />
        <Analytics />
      </body>
    </html>
  )
}
