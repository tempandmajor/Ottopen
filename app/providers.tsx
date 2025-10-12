'use client'

import { TooltipProvider } from '@/src/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { AuthProvider } from '@/src/contexts/auth-context'
import { Toaster as HotToaster } from 'react-hot-toast'
import { ErrorBoundary } from '@/src/components/error-boundary'
import { AppLayout } from '@/src/components/app-layout'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <TooltipProvider>
              <AppLayout>{children}</AppLayout>
              <HotToaster
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
