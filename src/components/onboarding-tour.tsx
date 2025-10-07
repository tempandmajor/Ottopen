'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'

export interface TourStep {
  target: string // CSS selector for the element to highlight
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

interface OnboardingTourProps {
  steps: TourStep[]
  tourKey: string // Unique key to track if tour has been completed
  onComplete?: () => void
  autoStart?: boolean
}

export function OnboardingTour({
  steps,
  tourKey,
  onComplete,
  autoStart = true,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    // Check if tour has been completed
    const completed = localStorage.getItem(`tour_completed_${tourKey}`)
    if (!completed && autoStart) {
      // Small delay to ensure DOM is ready
      setTimeout(() => setIsActive(true), 500)
    }
  }, [tourKey, autoStart])

  useEffect(() => {
    if (!isActive) return

    const updatePosition = () => {
      const step = steps[currentStep]
      const element = document.querySelector(step.target)
      if (element) {
        setTargetRect(element.getBoundingClientRect())
      }
    }

    updatePosition()

    // Update position on scroll and resize
    window.addEventListener('scroll', updatePosition)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isActive, currentStep, steps])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeTour = () => {
    localStorage.setItem(`tour_completed_${tourKey}`, 'true')
    setIsActive(false)
    onComplete?.()
  }

  const skipTour = () => {
    completeTour()
  }

  if (!isActive || !targetRect) return null

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  // Calculate tooltip position
  const getTooltipStyle = () => {
    const placement = step.placement || 'bottom'
    const offset = 16

    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      maxWidth: '320px',
    }

    switch (placement) {
      case 'top':
        style.left = targetRect.left + targetRect.width / 2
        style.top = targetRect.top - offset
        style.transform = 'translate(-50%, -100%)'
        break
      case 'bottom':
        style.left = targetRect.left + targetRect.width / 2
        style.top = targetRect.bottom + offset
        style.transform = 'translateX(-50%)'
        break
      case 'left':
        style.right = window.innerWidth - targetRect.left + offset
        style.top = targetRect.top + targetRect.height / 2
        style.transform = 'translateY(-50%)'
        break
      case 'right':
        style.left = targetRect.right + offset
        style.top = targetRect.top + targetRect.height / 2
        style.transform = 'translateY(-50%)'
        break
    }

    return style
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={skipTour} />

      {/* Highlight */}
      <div
        className="fixed border-2 border-primary rounded-lg pointer-events-none z-[9998]"
        style={{
          left: targetRect.left - 4,
          top: targetRect.top - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          boxShadow: '0 0 0 4px rgba(var(--primary-rgb, 139, 92, 246), 0.2)',
        }}
      />

      {/* Tooltip */}
      <Card className="card-bg card-shadow border-border" style={getTooltipStyle()}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={skipTour}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-muted rounded-full mb-4">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {currentStep === steps.length - 1 ? (
                  <>
                    Finish
                    <Check className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
