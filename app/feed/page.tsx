import { Navigation } from "@/src/components/navigation";
import { PostCard } from "@/src/components/post-card";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { PenTool, Image, Smile, Filter } from "lucide-react";

export default function Feed() {
  const followingPosts = [
    {
      author: "Maya Rodriguez",
      time: "1h ago",
      content: "The coffee shop scene is finally coming together. Sometimes you need to step away from your desk and write in a different space to find the right voice for your characters.\n\n\"She ordered her usual - black coffee, no sugar, just like her mood that morning.\"\n\nWhat's your favorite writing spot?",
      type: "excerpt" as const,
      likes: 42,
      comments: 15,
      isLiked: true
    },
    {
      author: "James Chen",
      time: "3h ago",
      content: "Big news! My screenplay 'The Last Station' has been optioned by Meridian Studios. It's been a 3-year journey from first draft to this moment.\n\nTo all the writers out there struggling with rejections - keep going. Your story matters.",
      type: "announcement" as const,
      likes: 156,
      comments: 34
    },
    {
      author: "Elena Vasquez",
      time: "5h ago",
      content: "Working on character development today. I've been thinking about how our past shapes our present, and how that translates into storytelling.\n\nMy protagonist carries her grandmother's journal everywhere - it's become her compass through grief. What objects anchor your characters?",
      type: "discussion" as const,
      likes: 28,
      comments: 9
    },
    {
      author: "Amelia Foster",
      time: "8h ago",
      content: "Rehearsals for 'Voices in the Dark' are in full swing! Watching actors bring your words to life never gets old. There's magic in that moment when the script transforms into something living and breathing.\n\nThe energy in the rehearsal room today was electric. October 15th can't come soon enough!",
      type: "story" as const,
      likes: 73,
      comments: 18
    },
    {
      author: "Marcus Thompson",
      time: "12h ago",
      content: "\"In the end, we are all stories waiting to be told, and every story deserves a listener.\"\n\nThis line came to me during my morning walk. Sometimes inspiration strikes in the most ordinary moments. Now to figure out which character gets to say it...",
      type: "excerpt" as const,
      likes: 91,
      comments: 22,
      isLiked: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">Your Feed</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Latest updates from writers you follow</p>
          </div>

          {/* Create Post */}
          <Card className="card-bg card-shadow border-literary-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                  <AvatarFallback className="bg-literary-subtle text-foreground font-medium text-xs sm:text-sm">
                    You
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                  <Textarea
                    placeholder="Share your writing journey, an excerpt, or start a discussion..."
                    className="min-h-[80px] sm:min-h-[100px] resize-none border-literary-border text-sm sm:text-base"
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
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter Options */}
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs sm:text-sm text-muted-foreground">Following 47 writers</span>
            </div>
            <Button variant="outline" size="sm" className="self-start xs:self-auto text-xs sm:text-sm">
              Filter Posts
            </Button>
          </div>

          {/* Posts Feed */}
          <div className="space-y-3 sm:space-y-4">
            {followingPosts.map((post, index) => (
              <PostCard key={index} {...post} />
            ))}
          </div>

          {/* Load More */}
          <div className="text-center pt-6 sm:pt-8">
            <Button variant="outline" size="lg" className="w-full xs:w-auto">
              Load More Posts
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}