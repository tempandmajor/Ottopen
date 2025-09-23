"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { MapPin, Book, Users } from "lucide-react";
import Link from "next/link";

interface AuthorCardProps {
  name: string;
  specialty: string;
  location: string;
  works: number;
  followers: number;
  bio: string;
  avatar?: string;
  tags: string[];
}

export function AuthorCard({ 
  name, 
  specialty, 
  location, 
  works, 
  followers, 
  bio, 
  avatar, 
  tags 
}: AuthorCardProps) {
  const initials = name.split(' ').map(n => n[0]).join('');

  return (
    <Card className="card-bg card-shadow hover:shadow-lg transition-all duration-300 border-literary-border">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-literary-subtle text-foreground font-medium text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 mb-2">
              <Link 
                href={`/profile/${name.toLowerCase().replace(' ', '_')}`}
                className="font-serif text-base sm:text-lg font-semibold hover:underline break-words"
              >
                {name}
              </Link>
              <Button variant="outline" size="sm" className="self-start xs:self-auto text-xs sm:text-sm">
                Follow
              </Button>
            </div>
            
            <p className="text-xs sm:text-sm text-literary-accent font-medium mb-2">{specialty}</p>
            
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-3">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
              {bio}
            </p>
            
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <Book className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span>{works} works</span>
              </div>
              <div className="flex items-center">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span>{followers.toLocaleString()} followers</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}