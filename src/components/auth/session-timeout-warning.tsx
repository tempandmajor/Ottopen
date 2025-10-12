'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog'

interface SessionTimeoutWarningProps {
  isOpen: boolean
  timeLeft: number
  onExtend: () => void
  onLogout: () => void
}

export function SessionTimeoutWarning({
  isOpen,
  timeLeft: initialTimeLeft,
  onExtend,
  onLogout,
}: SessionTimeoutWarningProps) {
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft)

  useEffect(() => {
    setTimeLeft(initialTimeLeft)
  }, [initialTimeLeft])

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1000
        if (newTime <= 0) {
          onLogout()
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, timeLeft, onLogout])

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in <strong>{formatTime(timeLeft)}</strong> due to inactivity.
            Would you like to extend your session?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onLogout}>Sign Out</AlertDialogCancel>
          <AlertDialogAction onClick={onExtend}>Stay Signed In</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
