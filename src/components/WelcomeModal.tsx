'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { CheckCircle2, Sparkles, Users, Briefcase, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WelcomeModalProps {
  userName?: string
  userEmail?: string
}

export function WelcomeModal({ userName, userEmail }: WelcomeModalProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const router = useRouter()

  useEffect(() => {
    // Check if user has seen welcome modal
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    const isNewUser = localStorage.getItem('isNewUser') === 'true'

    if (!hasSeenWelcome && isNewUser) {
      // Show modal after brief delay for better UX
      setTimeout(() => setOpen(true), 500)
    }
  }, [])

  const handleClose = () => {
    setOpen(false)
    localStorage.setItem('hasSeenWelcome', 'true')
    localStorage.removeItem('isNewUser')
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      handleClose()
    }
  }

  const handleSkip = () => {
    handleClose()
  }

  const handleGetStarted = (path: string) => {
    handleClose()
    router.push(path)
  }

  const steps = [
    {
      title: 'Welcome to Ottopen! 🎬',
      description: userName
        ? `Hi ${userName}! Let's get you started on your scriptwriting journey.`
        : "Let's get you started on your scriptwriting journey.",
      icon: <Sparkles className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Ottopen is your complete platform for writing, collaborating, and selling scripts.
          </p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">AI-Powered Writing Tools</p>
                <p className="text-sm text-muted-foreground">
                  Get help with brainstorming, dialogue, structure analysis, and more
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Real-Time Collaboration</p>
                <p className="text-sm text-muted-foreground">
                  Work with other writers, share feedback, and build together
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Opportunities Marketplace</p>
                <p className="text-sm text-muted-foreground">
                  Find writing gigs, connect with producers, and sell your work
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Create Your First Script',
      description: 'Start writing with our powerful editor and AI assistance.',
      icon: <Sparkles className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-semibold mb-2">Quick Start:</h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">1.</span>
                Click &ldquo;New Script&rdquo; from your dashboard
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">2.</span>
                Choose your format (screenplay, stage play, or book)
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">3.</span>
                Use AI tools to brainstorm ideas and structure your story
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">4.</span>
                Start writing with industry-standard formatting
              </li>
            </ol>
          </div>
          <Button onClick={() => handleGetStarted('/scripts')} className="w-full" size="lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Create Your First Script
          </Button>
        </div>
      ),
    },
    {
      title: 'Join the Community',
      description: 'Connect with writers, join book clubs, and find opportunities.',
      icon: <Users className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <div className="grid gap-3">
            <Button
              onClick={() => handleGetStarted('/clubs')}
              variant="outline"
              className="justify-start h-auto p-4"
            >
              <Users className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-semibold">Book Clubs</p>
                <p className="text-sm text-muted-foreground">
                  Join writing groups, get feedback, participate in sprints
                </p>
              </div>
            </Button>

            <Button
              onClick={() => handleGetStarted('/opportunities')}
              variant="outline"
              className="justify-start h-auto p-4"
            >
              <Briefcase className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-semibold">Find Opportunities</p>
                <p className="text-sm text-muted-foreground">
                  Browse writing gigs, pitch to producers, sell your scripts
                </p>
              </div>
            </Button>

            <Button
              onClick={() => handleGetStarted('/feed')}
              variant="outline"
              className="justify-start h-auto p-4"
            >
              <Sparkles className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-semibold">Explore Feed</p>
                <p className="text-sm text-muted-foreground">
                  Discover scripts, follow writers, engage with the community
                </p>
              </div>
            </Button>
          </div>
        </div>
      ),
    },
  ]

  const currentStep = steps[step - 1]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label="Close welcome modal"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-4 pt-6">
            {currentStep.icon}
            <DialogTitle className="text-2xl">{currentStep.title}</DialogTitle>
            <p className="text-muted-foreground">{currentStep.description}</p>
          </div>
        </DialogHeader>

        <div className="py-6">{currentStep.content}</div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index + 1 === step ? 'bg-primary' : 'bg-muted'
                }`}
                aria-label={`Step ${index + 1}${index + 1 === step ? ' (current)' : ''}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step < 3 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            )}
            <Button onClick={handleNext}>{step === 3 ? 'Get Started' : 'Next'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
