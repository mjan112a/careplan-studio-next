"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface MobileFriendlyTooltipProps {
  title: string
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function MobileFriendlyTooltip({ title, isOpen, onClose, children }: MobileFriendlyTooltipProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  if (!isOpen) return null

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
        <div className="w-full max-w-md animate-in slide-in-from-bottom">
          <Card>
            <CardHeader className="p-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">{title}</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-3 max-h-[60vh] overflow-y-auto">{children}</CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Desktop version - return a standard tooltip
  return (
    <div className="fixed left-4 top-20 z-50 bg-white p-2 border rounded shadow-lg text-xs max-w-md">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-bold text-sm">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-3 w-3" />
        </Button>
      </div>
      {children}
    </div>
  )
}
