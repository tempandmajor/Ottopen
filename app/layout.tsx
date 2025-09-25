import { Inter, Playfair_Display } from 'next/font/google'
import { Providers } from './providers'
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
  title: 'Ottopen',
  description: 'A sophisticated platform for literary enthusiasts',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
