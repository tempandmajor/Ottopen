"use client";

import { Navigation } from "@/src/components/navigation";
import { PostCard } from "@/src/components/post-card";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { Textarea } from "@/src/components/ui/textarea";
import {
  MapPin,
  Calendar,
  Link as LinkIcon,
  MessageCircle,
  UserPlus,
  UserMinus,
  MoreHorizontal,
  PenTool,
  Image,
  Smile
} from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function Profile() {
  const params = useParams();
  const username = params.username;
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  // Mock profile data - would come from database
  const profile = {
    name: "Maya Rodriguez",
    username: "maya_writes",
    bio: "Award-winning novelist exploring themes of identity and belonging. Author of 'The Bridge Between Worlds' and upcoming 'Echoes of Tomorrow'. Currently working on my third novel.",
    location: "Barcelona, Spain",
    website: "mayarodriguez.com",
    joinDate: "March 2022",
    followers: 3420,
    following: 892,
    postsCount: 127,
    specialty: "Literary Fiction",
    verified: true,
    tags: ["Fiction", "Contemporary", "Literary", "Magical Realism"]
  };

  const userPosts = [
    {
      author: "Maya Rodriguez",
      time: "2h ago",
      content: "Just finished the first draft of chapter 12. There's something magical about those late-night writing sessions when the words just flow. The characters are finally telling me their secrets.\n\nWhat's your favorite time to write?",
      type: "discussion" as const,
      likes: 24,
      comments: 8,
      isLiked: true
    },
    {
      author: "Maya Rodriguez",
      time: "1d ago",
      content: "\"She walked through the market, the scent of cinnamon and cardamom wrapping around her like her grandmother's embrace. Some memories, she realized, lived not in the mind but in the senses.\"\n\nFrom chapter 8 of my work in progress. Sometimes a single sentence captures everything you're trying to say.",
      type: "excerpt" as const,
      likes: 67,
      comments: 15
    },
    {
      author: "Maya Rodriguez",
      time: "3d ago",
      content: "Exciting news! 'The Bridge Between Worlds' has been selected for the Barcelona Literary Festival's spotlight series. I'll be doing a reading next month alongside some incredible authors.\n\nGrateful for this community that continues to support and inspire.",
      type: "announcement" as const,
      likes: 156,
      comments: 34
    }
  ];

  const likedPosts = [
    {
      author: "James Chen",
      time: "4h ago",
      content: "\"FADE IN:\n\nEXT. COFFEE SHOP - MORNING\n\nThe rain drums against the window as SARAH stares at her laptop screen, cursor blinking mockingly at the blank page...\"\n\nWorking on a new short film script.",
      type: "excerpt" as const,
      likes: 31,
      comments: 12,
      isLiked: true
    }
  ];

  const resharedPosts = [
    {
      author: "Amelia Foster",
      time: "6h ago",
      content: "Thrilled to announce my new play 'Voices in the Dark' will premiere at the Riverside Theatre next month! It's been a two-year journey bringing this story to life.",
      type: "announcement" as const,
      likes: 67,
      comments: 23
    }
  ];

  const getPostsForTab = () => {
    switch (activeTab) {
      case "posts": return userPosts;
      case "likes": return likedPosts;
      case "reshares": return resharedPosts;
      default: return userPosts;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="card-bg card-shadow border-literary-border mb-8">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col space-y-6">
                {/* Mobile-first: Avatar and buttons on top */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                  <div className="flex flex-col items-center sm:items-start">
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 mb-4">
                      <AvatarFallback className="bg-literary-subtle text-foreground font-bold text-xl sm:text-2xl">
                        MR
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={() => setIsFollowing(!isFollowing)}
                        className="flex items-center space-x-2"
                      >
                        {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                        <span>{isFollowing ? "Following" : "Follow"}</span>
                      </Button>

                      <Button variant="outline" size="sm" className="flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4" />
                        <span className="hidden xs:inline">Message</span>
                      </Button>

                      <Button variant="ghost" size="sm" className="p-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 text-center sm:text-left">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold break-words">{profile.name}</h1>
                        {profile.verified && (
                          <Badge variant="secondary" className="text-xs self-center sm:self-auto">Verified</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-base sm:text-lg">@{profile.username}</p>
                      <p className="text-sm text-literary-accent font-medium mb-2">{profile.specialty}</p>
                    </div>

                    <p className="text-foreground leading-relaxed text-sm sm:text-base">{profile.bio}</p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span>{profile.location}</span>
                      </div>
                      <div className="flex items-center">
                        <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <a href={`https://${profile.website}`} className="text-primary hover:underline truncate max-w-[120px] sm:max-w-none">
                          {profile.website}
                        </a>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span>Joined {profile.joinDate}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 sm:gap-6 text-sm justify-center sm:justify-start">
                      <div className="text-center sm:text-left">
                        <span className="font-semibold text-foreground">{profile.following.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-1">Following</span>
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="font-semibold text-foreground">{profile.followers.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-1">Followers</span>
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="font-semibold text-foreground">{profile.postsCount}</span>
                        <span className="text-muted-foreground ml-1">Posts</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      {profile.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Post Section */}
          <Card className="card-bg card-shadow border-literary-border mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                  <AvatarFallback className="bg-literary-subtle text-foreground font-medium text-xs sm:text-sm">
                    You
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                  <Textarea
                    placeholder="Share your latest work, thoughts, or connect with the community..."
                    className="min-h-[60px] sm:min-h-[80px] resize-none border-literary-border text-sm sm:text-base"
                  />

                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
                    <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs sm:h-8 sm:text-sm whitespace-nowrap">
                        <Image className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span>Image</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs sm:h-8 sm:text-sm whitespace-nowrap">
                        <PenTool className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span>Excerpt</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs sm:h-8 sm:text-sm whitespace-nowrap">
                        <Smile className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span>Mood</span>
                      </Button>
                    </div>

                    <Button size="sm" className="font-medium self-end xs:self-auto">
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger value="posts" className="flex flex-col xs:flex-row xs:items-center xs:space-x-2 p-2 sm:p-3">
                <span className="text-xs sm:text-sm">Posts</span>
                <Badge variant="secondary" className="text-xs mt-1 xs:mt-0">
                  {userPosts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="likes" className="flex flex-col xs:flex-row xs:items-center xs:space-x-2 p-2 sm:p-3">
                <span className="text-xs sm:text-sm">Liked</span>
                <Badge variant="secondary" className="text-xs mt-1 xs:mt-0">
                  {likedPosts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="reshares" className="flex flex-col xs:flex-row xs:items-center xs:space-x-2 p-2 sm:p-3">
                <span className="text-xs sm:text-sm">Reshared</span>
                <Badge variant="secondary" className="text-xs mt-1 xs:mt-0">
                  {resharedPosts.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              {getPostsForTab().map((post, index) => (
                <PostCard key={index} {...post} />
              ))}
            </TabsContent>

            <TabsContent value="likes" className="space-y-4">
              {getPostsForTab().map((post, index) => (
                <PostCard key={index} {...post} />
              ))}
            </TabsContent>

            <TabsContent value="reshares" className="space-y-4">
              {getPostsForTab().map((post, index) => (
                <PostCard key={index} {...post} />
              ))}
            </TabsContent>
          </Tabs>

          {/* Load More */}
          <div className="text-center pt-8">
            <Button variant="outline" size="lg">
              Load More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}