'use client'

import { Navigation } from '@/src/components/navigation'
import { ProtectedRoute } from '@/src/components/auth/protected-route'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Lock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function PrivacyPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center space-x-3 mb-6">
              <Lock className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Privacy & Data Rights</h1>
                <p className="text-muted-foreground">Manage your data and privacy preferences</p>
              </div>
            </div>
            <Card className="p-8">
              <p className="text-center text-muted-foreground">
                Privacy controls coming soon. Contact support for data requests.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
