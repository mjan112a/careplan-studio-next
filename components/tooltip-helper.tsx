"use client"

import { Info } from "lucide-react"
import { useState } from "react"

interface TooltipProps {
  content: string
  position?: "top" | "bottom" | "left" | "right"
}

export default function Tooltip({ content, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  }

  return (
    <div className="relative inline-block">
      <div
        className="text-gray-500 cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <Info size={16} />
      </div>

      {isVisible && (
        <div
          className={`absolute z-10 w-64 p-2 bg-black text-white text-sm rounded shadow-lg ${positionClasses[position]}`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-black transform rotate-45 ${
              position === "top"
                ? "top-full -mt-1 left-1/2 -ml-1"
                : position === "bottom"
                  ? "bottom-full -mb-1 left-1/2 -ml-1"
                  : position === "left"
                    ? "left-full -ml-1 top-1/2 -mt-1"
                    : "right-full -mr-1 top-1/2 -mt-1"
            }`}
          />
        </div>
      )}
    </div>
  )
}

