'use client'

import { Button } from '@/src/components/ui/button'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Separator } from '@/src/components/ui/separator'
import {
  PenTool,
  Users,
  BookOpen,
  MessageSquare,
  Home,
  Rss,
  User,
  Mail,
  Settings as SettingsIcon,
  Search,
  Upload,
  Briefcase,
  Gift,
  Clapperboard,
  HelpCircle,
  Shield,
  FileText,
  Menu,
  X,
  UserCircle,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/src/contexts/auth-context'
import { cn } from '@/src/lib/utils'
import { useState } from 'react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  requireAuth?: boolean
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const navigationSections: NavSection[] = [
  {
    items: [
      { name: 'Home', href: '/', icon: Home },
      { name: 'Feed', href: '/feed', icon: Rss, requireAuth: true },
    ],
  },
  {
    title: 'Discover',
    items: [
      { name: 'Search', href: '/search', icon: Search, requireAuth: true },
      { name: 'Works', href: '/works', icon: BookOpen },
      { name: 'Authors', href: '/authors', icon: UserCircle, requireAuth: true },
      { name: 'Book Clubs', href: '/clubs', icon: Users, requireAuth: true },
    ],
  },
  {
    title: 'Create',
    items: [
      { name: 'AI Editor', href: '/editor', icon: PenTool, requireAuth: true },
      { name: 'Script Editor', href: '/scripts', icon: Clapperboard, requireAuth: true },
    ],
  },
  {
    title: 'Professional',
    items: [
      { name: 'Submissions', href: '/submissions', icon: Upload, requireAuth: true },
      { name: 'Opportunities', href: '/opportunities', icon: Briefcase, requireAuth: true },
      {
        name: 'Earn Rewards',
        href: '/referrals',
        icon: Gift,
        badge: 'New',
        requireAuth: true,
      },
    ],
  },
  {
    title: 'Account',
    items: [
      { name: 'Messages', href: '/messages', icon: Mail, requireAuth: true },
      { name: 'Profile', href: '/profile', icon: User, requireAuth: true },
      { name: 'Settings', href: '/settings', icon: SettingsIcon, requireAuth: true },
    ],
  },
  {
    title: 'Support',
    items: [
      { name: 'Help & Support', href: '/legal/support', icon: HelpCircle },
      { name: 'Community Guidelines', href: '/legal/community', icon: Shield },
      { name: 'Terms & Privacy', href: '/legal/terms', icon: FileText },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    // Handle profile special case
    if (path === '/profile' && user) {
      return pathname.startsWith(`/profile/${user.profile?.username || user.id}`)
    }
    return pathname.startsWith(path)
  }

  const shouldShowItem = (item: NavItem) => {
    // Show all items if user is authenticated
    if (user) return true
    // Show items that don't require auth
    return !item.requireAuth
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4 mt-14 lg:mt-16">
        <nav className="space-y-6">
          {navigationSections.map((section, sectionIndex) => {
            const visibleItems = section.items.filter(shouldShowItem)
            if (visibleItems.length === 0) return null

            return (
              <div key={sectionIndex}>
                {section.title && (
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {visibleItems.map(item => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    const href =
                      item.href === '/profile' && user
                        ? `/profile/${user.profile?.username || user.id}`
                        : item.href

                    return (
                      <Button
                        key={item.name}
                        variant={active ? 'secondary' : 'ghost'}
                        className={cn('w-full justify-start', active && 'bg-secondary font-medium')}
                        asChild
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href={href}>
                          <Icon className="mr-3 h-4 w-4" />
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="ml-auto rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </Button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-3 left-4 z-50"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar */}
          <aside className="fixed left-0 top-0 z-50 h-full w-64 border-r bg-background lg:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Desktop sidebar - always visible on large screens */}
      <aside className="hidden lg:block lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-screen lg:w-64 lg:border-r lg:bg-background">
        <SidebarContent />
      </aside>
    </>
  )
}
