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
import { Bell, LogOut, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/auth-context'
import { Badge } from '@/src/components/ui/badge'

export function Navigation() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-literary-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:ml-64">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between lg:h-16">
          {/* Left side - empty on desktop (sidebar handles branding), spacer on mobile */}
          <div className="lg:hidden w-10" />

          {/* Right side - actions */}
          <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
            <ThemeToggle />

            {loading ? (
              /* Loading state */
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              </div>
            ) : user ? (
              /* Authenticated user - notification bell + avatar menu */
              <>
                {/* Notification bell */}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="relative"
                  title="Notifications"
                >
                  <Link href="/notifications">
                    <Bell className="h-5 w-5" />
                    {/* Badge for unread notifications - will be dynamic later */}
                    {/* Uncomment when you have actual notification count */}
                    {/* <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                      3
                    </Badge> */}
                  </Link>
                </Button>

                {/* User avatar dropdown */}
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
                      <ChevronDown className="h-4 w-4 hidden sm:block" />
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
                        View Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
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
