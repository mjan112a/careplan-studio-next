"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle, X, ChevronRight, ChevronLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Define the tour steps
const tourSteps = [
  {
    target: "body",
    content:
      "Welcome to the LTC Event Simulator! This tour will guide you through the main features of the application.",
    placement: "center",
  },
  {
    target: "[data-tour='tabs']",
    content: "These tabs allow you to navigate between different sections of the application.",
    placement: "bottom",
  },
  {
    target: "[data-tour='person1-tab']",
    content:
      "Start by entering information for Person 1, including basic details, retirement plans, and LTC event scenarios.",
    placement: "bottom",
  },
  {
    target: "[data-tour='person2-tab']",
    content: "Then enter information for Person 2, if applicable.",
    placement: "bottom",
  },
  {
    target: "[data-tour='household-tab']",
    content: "View combined household projections to see the overall financial picture.",
    placement: "bottom",
  },
  {
    target: "[data-tour='analysis-tab']",
    content: "Compare scenarios with and without LTC insurance to understand the financial impact.",
    placement: "bottom",
  },
  {
    target: "[data-tour='ai-insights-tab']",
    content: "Get AI-powered insights and recommendations based on your inputs.",
    placement: "bottom",
  },
  {
    target: "[data-tour='report-tab']",
    content: "Generate comprehensive reports for clients that explain the benefits of LTC insurance.",
    placement: "bottom",
  },
  {
    target: "[data-tour='documentation-tab']",
    content: "Access detailed documentation and help resources.",
    placement: "bottom",
  },
  {
    target: "[data-tour='policy-toggle']",
    content: "Toggle this switch to use actual policy data from your insurance provider instead of estimates.",
    placement: "bottom",
  },
  {
    target: "body",
    content:
      "You're all set! Feel free to explore the application. You can restart this tour anytime by clicking the Help button.",
    placement: "center",
  },
]

interface CustomGuidedTourProps {
  run: boolean
  onComplete: () => void
  onSkip: () => void
}

export function CustomGuidedTour({ run, onComplete, onSkip }: CustomGuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Only render on client-side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Reset step when tour starts/stops
  useEffect(() => {
    if (run) {
      setCurrentStep(0)
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [run])

  // Position the tooltip and highlight based on the current step
  useEffect(() => {
    if (!run || !isMounted) return

    const step = tourSteps[currentStep]

    // For center placement, position in the middle of the screen
    if (step.placement === "center" || step.target === "body") {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight

      setHighlightPosition({ top: 0, left: 0, width: 0, height: 0 })

      // Position tooltip in the center of the screen
      if (tooltipRef.current) {
        const tooltipWidth = tooltipRef.current.offsetWidth
        const tooltipHeight = tooltipRef.current.offsetHeight

        setTooltipPosition({
          left: (windowWidth - tooltipWidth) / 2,
          top: (windowHeight - tooltipHeight) / 2,
        })
      }

      return
    }

    // For other placements, find the target element
    const targetElement = document.querySelector(step.target) as HTMLElement

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect()
      const scrollTop = window.scrollY
      const scrollLeft = window.scrollX

      // Set highlight position
      setHighlightPosition({
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft,
        width: rect.width,
        height: rect.height,
      })

      // Scroll to the element
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" })

      // Position tooltip based on placement
      if (tooltipRef.current) {
        const tooltipWidth = tooltipRef.current.offsetWidth
        const tooltipHeight = tooltipRef.current.offsetHeight

        let top = 0
        let left = 0

        switch (step.placement) {
          case "top":
            top = rect.top + scrollTop - tooltipHeight - 10
            left = rect.left + scrollLeft + (rect.width - tooltipWidth) / 2
            break
          case "bottom":
            top = rect.bottom + scrollTop + 10
            left = rect.left + scrollLeft + (rect.width - tooltipWidth) / 2
            break
          case "left":
            top = rect.top + scrollTop + (rect.height - tooltipHeight) / 2
            left = rect.left + scrollLeft - tooltipWidth - 10
            break
          case "right":
            top = rect.top + scrollTop + (rect.height - tooltipHeight) / 2
            left = rect.right + scrollLeft + 10
            break
          default:
            top = rect.bottom + scrollTop + 10
            left = rect.left + scrollLeft + (rect.width - tooltipWidth) / 2
        }

        // Ensure tooltip stays within viewport
        if (left < 10) left = 10
        if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10
        if (top < 10) top = 10
        if (top + tooltipHeight > window.innerHeight + scrollTop - 10)
          top = window.innerHeight + scrollTop - tooltipHeight - 10

        setTooltipPosition({ top, left })
      }
    }
  }, [currentStep, run, isMounted])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isMounted || !run || !isVisible) {
    return null
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]" onClick={onSkip} />

      {/* Highlight */}
      {tourSteps[currentStep].target !== "body" && (
        <div
          className="absolute border-2 border-sky-500 rounded-sm z-[9999] pointer-events-none"
          style={{
            top: `${highlightPosition.top}px`,
            left: `${highlightPosition.left}px`,
            width: `${highlightPosition.width}px`,
            height: `${highlightPosition.height}px`,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4 z-[10000] w-80"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        <button
          onClick={onSkip}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="mb-4">{tourSteps[currentStep].content}</p>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {tourSteps.length}
          </div>

          <div className="flex space-x-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}

            <Button size="sm" onClick={handleNext}>
              {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
              {currentStep !== tourSteps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

// Welcome Modal Component
interface WelcomeModalProps {
  open: boolean
  onStart: () => void
  onSkip: () => void
}

export function WelcomeModal({ open, onStart, onSkip }: WelcomeModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to the LTC Event Simulator</DialogTitle>
          <DialogDescription>
            This tool helps you visualize the financial impact of long-term care events and insurance.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Would you like to take a quick tour to learn how to use this application?
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onSkip}>
            Skip
          </Button>
          <Button onClick={onStart}>Start Tour</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Tour Button Component
interface TourButtonProps {
  onClick: () => void
}

export function TourButton({ onClick }: TourButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="flex items-center gap-1">
      <HelpCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Help</span>
    </Button>
  )
}
