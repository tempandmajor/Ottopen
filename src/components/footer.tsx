import Link from 'next/link'
import { PenTool } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-literary-border bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <PenTool className="h-5 w-5" />
              <span className="font-serif text-lg font-semibold">Ottopen</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Where stories connect. A literary social network for authors, screenwriters, and
              playwrights.
            </p>
          </div>

          {/* Explore */}
          <div className="space-y-4">
            <h3 className="font-semibold">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/works"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Discover Works
                </Link>
              </li>
              <li>
                <Link
                  href="/authors"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Find Authors
                </Link>
              </li>
              <li>
                <Link
                  href="/feed"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Community Feed
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h3 className="font-semibold">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/messages"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Messages
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/community"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/support"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/legal/terms"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/support"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Support Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/community"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-literary-border">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-muted-foreground">© 2024 Ottopen. All rights reserved.</p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <Link href="/legal/terms" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <Link href="/legal/privacy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="/legal/support" className="hover:text-primary transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
