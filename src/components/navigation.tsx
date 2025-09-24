"use client";

import { Button } from "@/src/components/ui/button";
import { ThemeToggle } from "@/src/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { PenTool, Users, BookOpen, MessageSquare, Home, Rss, User, Mail, Settings as SettingsIcon, LogOut, ChevronDown, HelpCircle, Shield, FileText, Search, Upload, Briefcase, Gift } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/auth-context";

export function Navigation() {
  const currentPath = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => currentPath === path;

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };
  
  return (
    <nav className="sticky top-0 z-50 border-b border-literary-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <PenTool className="h-5 w-5 sm:h-6 sm:w-6" />
              <h1 className="font-serif text-lg sm:text-xl font-semibold">Ottopen</h1>
            </Link>

            {/* Public navigation - always visible */}
            <div className="hidden md:flex items-center space-x-1">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
                asChild
                className="flex items-center space-x-2"
              >
                <Link href="/">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </Button>
              <Button
                variant={isActive("/works") ? "default" : "ghost"}
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

            {user ? (
              /* Authenticated user menu */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile?.avatar_url} alt={user.profile?.display_name || user.email} />
                      <AvatarFallback>
                        {(user.profile?.display_name || user.email)?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Discover Section */}
                  <DropdownMenuItem asChild>
                    <Link href="/feed" className="flex items-center">
                      <Rss className="mr-2 h-4 w-4" />
                      <span>Feed</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/search" className="flex items-center">
                      <Search className="mr-2 h-4 w-4" />
                      <span>Search</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/authors" className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Authors</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/works" className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span>Works</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Messages</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/submissions" className="flex items-center">
                      <Upload className="mr-2 h-4 w-4" />
                      <span>Submissions</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/opportunities" className="flex items-center">
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span>Opportunities</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Account Section */}
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user.profile?.username || user.id}`} className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Help & Support Section */}
                  <DropdownMenuItem asChild>
                    <Link href="/legal/support" className="flex items-center">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Help & Support</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/legal/community" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Community Guidelines</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/legal/terms" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Terms & Privacy</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Sign Out */}
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
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
  );
}