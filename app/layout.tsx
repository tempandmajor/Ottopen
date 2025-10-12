import { Inter, Playfair_Display } from 'next/font/google'
import { Providers } from './providers'
import { ScreenReaderAnnouncer } from '@/src/components/ScreenReaderAnnouncer'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import '@/src/index.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
})

export const metadata = {
  title: 'Ottopen - Scriptwriting Platform for Writers',
  description:
    'Professional scriptwriting platform with AI-powered tools, real-time collaboration, and marketplace for writers to create, collaborate, and sell their work.',
  keywords: [
    'scriptwriting',
    'screenplay',
    'AI writing tools',
    'writing collaboration',
    'script marketplace',
  ],
  authors: [{ name: 'Ottopen' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ScreenReaderAnnouncer />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
        >
          Skip to main content
        </a>
        <Providers>
          <main id="main-content">{children}</main>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
