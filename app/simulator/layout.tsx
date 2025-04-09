import type React from "react"
export const metadata = {
  title: "CarePlan Studio - LTC Policy Simulator",
  description: "Visualize the impact of long-term care insurance policies on retirement planning",
}

export default function SimulatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>
}

