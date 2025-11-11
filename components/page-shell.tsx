import FakeAds from "@/components/fake-ads"
import type { ReactNode } from "react"

export default function PageShell({ children, showSidebars = true }: { children: ReactNode; showSidebars?: boolean }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col xl:flex-row gap-6">
        {showSidebars && <FakeAds />}
        <div className="flex-1">{children}</div>
        {showSidebars && <FakeAds />}
      </div>
    </div>
  )
}

