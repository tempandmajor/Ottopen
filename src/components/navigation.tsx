"use client";

import { Button } from "@/src/components/ui/button";
import { ThemeToggle } from "@/src/components/theme-toggle";
import { PenTool, Users, BookOpen, MessageSquare, Home, Rss, User, Mail, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const currentPath = usePathname();

  const isActive = (path: string) => currentPath === path;
  
  return (
    <nav className="sticky top-0 z-50 border-b border-literary-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <PenTool className="h-5 w-5 sm:h-6 sm:w-6" />
              <h1 className="font-serif text-lg sm:text-xl font-semibold">Ottopen</h1>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              <Button 
                variant={isActive("/") ? "default" : "ghost"} 
                size="sm" 
                asChild
                className="flex items-center space-x-2"
              >
                <Link href="/">
                  <Home className="h-4 w-4" />
                  <span>Discover</span>
                </Link>
              </Button>
              <Button 
                variant={isActive("/feed") ? "default" : "ghost"} 
                size="sm" 
                asChild
                className="flex items-center space-x-2"
              >
                <Link href="/feed">
                  <Rss className="h-4 w-4" />
                  <span>Feed</span>
                </Link>
              </Button>
              <Button 
                variant={isActive("/messages") ? "default" : "ghost"} 
                size="sm" 
                asChild
                className="flex items-center space-x-2"
              >
                <Link href="/messages">
                  <Mail className="h-4 w-4" />
                  <span>Messages</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Authors</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Works</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="p-2"
            >
              <Link href="/profile/your-username">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Profile</span>
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="p-2"
            >
              <Link href="/settings">
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Settings</span>
              </Link>
            </Button>
            <div className="hidden sm:flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
              <Button size="sm" className="font-medium">
                Join Network
              </Button>
            </div>
            <div className="sm:hidden">
              <Button variant="outline" size="sm" className="text-xs px-2">
                Join
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}