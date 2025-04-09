import type React from "react"
export const metadata = {
  title: "Contact Us - CarePlan Studio",
  description: "Schedule a demo or get in touch with our team",
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>
}

