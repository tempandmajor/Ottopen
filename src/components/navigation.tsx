'use client'

import { Button } from '@/src/components/ui/button'
import { ThemeToggle } from '@/src/components/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import {
  PenTool,
  Users,
  BookOpen,
  Home,
  Rss,
  User,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  Bell,
  DollarSign,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/auth-context'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User as ProfileUser } from '@/src/lib/supabase'

interface NavigationProps {
  serverUser?: (SupabaseUser & { profile?: ProfileUser }) | null
}

export function Navigation({ serverUser }: NavigationProps = {}) {
  const currentPath = usePathname()
  const router = useRouter()
  const { user: clientUser, loading, signOut } = useAuth()

  // Use server user as fallback if client user isn't loaded yet
  const user = clientUser || serverUser

  const isActive = (path: string) => currentPath === path

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-literary-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <PenTool className="h-5 w-5 sm:h-6 sm:w-6" />
              <h1 className="font-serif text-lg sm:text-xl font-semibold">Ottopen</h1>
            </Link>

            {/* Public navigation - always visible */}
            <div className="hidden md:flex items-center space-x-1">
              <Button
                variant={isActive('/works') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="flex items-center space-x-2"
              >
                <Link href="/works">
                  <BookOpen className="h-4 w-4" />
                  <span>Discover</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />

            {user && (
              <>
                {/* Notification Bell */}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="relative"
                  title="Notifications"
                >
                  <Link href="/notifications">
                    <Bell className="h-5 w-5" />
                  </Link>
                </Button>

                {/* Referral/Earn Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="relative flex items-center space-x-2"
                  title="Earn cash rewards by referring friends"
                >
                  <Link href="/referrals">
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Earn</span>
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  </Link>
                </Button>
              </>
            )}

            {loading ? (
              /* Loading state - show sign in buttons to prevent empty header */
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  <span className="opacity-50">Sign In</span>
                </Button>
                <Button size="sm" className="font-medium" disabled>
                  <span className="opacity-50">Join Network</span>
                </Button>
              </div>
            ) : user ? (
              /* Authenticated user menu */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 p-2"
                    data-testid="user-avatar-button"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.profile?.avatar_url}
                        alt={user.profile?.display_name || user.email}
                      />
                      <AvatarFallback>
                        {(user.profile?.display_name || user.email)?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.profile?.display_name || user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/profile/${user.profile?.username || user.id}`}
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Unauthenticated user buttons */
              <>
                <div className="hidden sm:flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button size="sm" className="font-medium" asChild>
                    <Link href="/auth/signup">Join Network</Link>
                  </Button>
                </div>
                <div className="sm:hidden">
                  <Button variant="outline" size="sm" className="text-xs px-2" asChild>
                    <Link href="/auth/signup">Join</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
