"use client";

import { Navigation } from "@/src/components/navigation";
import { PostCard } from "@/src/components/post-card";
import { AuthorCard } from "@/src/components/author-card";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Progress } from "@/src/components/ui/progress";
import {
  BookOpen,
  Users,
  Heart,
  MessageCircle,
  TrendingUp,
  Star,
  PenTool,
  Calendar,
  Target,
  Award,
  Eye
} from "lucide-react";

export default function Dashboard() {
  // Mock user data
  const currentUser = {
    name: "Maya Rodriguez",
    username: "maya_writes",
    specialty: "Literary Fiction",
    joinDate: "March 2022",
    streak: 45,
    wordsWrittenThisWeek: 3420,
    weeklyGoal: 5000
  };

  // Mock statistics
  const stats = {
    totalWorks: 12,
    totalFollowers: 3420,
    totalLikes: 15680,
    totalViews: 89450,
    wordsThisMonth: 12890,
    postsThisMonth: 23
  };

  // Mock recent activity
  const recentActivity = [
    {
      author: "James Chen",
      time: "2h ago",
      content: "Thanks for the feedback on my latest chapter! Your insights about character development really helped me see the story from a new perspective.",
      type: "discussion" as const,
      likes: 12,
      comments: 3
    },
    {
      author: "Amelia Foster",
      time: "5h ago",
      content: "Loved your latest excerpt! The way you describe Barcelona makes me feel like I'm walking through the streets myself. Can't wait to read the full novel.",
      type: "discussion" as const,
      likes: 28,
      comments: 7
    }
  ];

  // Mock suggested authors
  const suggestedAuthors = [
    {
      name: "Elena Vasquez",
      specialty: "Poetry",
      location: "Mexico City, Mexico",
      works: 23,
      followers: 1560,
      bio: "Contemporary poet exploring themes of migration and identity.",
      tags: ["Poetry", "Contemporary", "Cultural"]
    },
    {
      name: "David Kim",
      specialty: "Science Fiction",
      location: "Seoul, South Korea",
      works: 9,
      followers: 3890,
      bio: "Sci-fi author focusing on AI and future societies.",
      tags: ["Sci-Fi", "AI", "Future"]
    }
  ];

  // Mock writing goals
  const writingGoals = [
    {
      title: "Weekly Writing Goal",
      current: currentUser.wordsWrittenThisWeek,
      target: currentUser.weeklyGoal,
      unit: "words"
    },
    {
      title: "Monthly Posts",
      current: stats.postsThisMonth,
      target: 30,
      unit: "posts"
    },
    {
      title: "Reading Goal",
      current: 18,
      target: 24,
      unit: "books"
    }
  ];

  const progressPercentage = (currentUser.wordsWrittenThisWeek / currentUser.weeklyGoal) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-2">
              Welcome back, {currentUser.name}! ✨
            </h1>
            <p className="text-muted-foreground">
              Ready to continue your literary journey? Here&apos;s what&apos;s happening in your world.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="card-bg border-literary-border">
                  <CardContent className="p-4 text-center">
                    <BookOpen className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stats.totalWorks}</div>
                    <p className="text-xs text-muted-foreground">Works</p>
                  </CardContent>
                </Card>
                <Card className="card-bg border-literary-border">
                  <CardContent className="p-4 text-center">
                    <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stats.totalFollowers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </CardContent>
                </Card>
                <Card className="card-bg border-literary-border">
                  <CardContent className="p-4 text-center">
                    <Heart className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">{(stats.totalLikes / 1000).toFixed(1)}K</div>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </CardContent>
                </Card>
                <Card className="card-bg border-literary-border">
                  <CardContent className="p-4 text-center">
                    <Eye className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">{(stats.totalViews / 1000).toFixed(0)}K</div>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </CardContent>
                </Card>
              </div>

              {/* Writing Progress */}
              <Card className="card-bg card-shadow border-literary-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Writing Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Weekly Goal</span>
                      <span className="text-sm text-muted-foreground">
                        {currentUser.wordsWrittenThisWeek} / {currentUser.weeklyGoal} words
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentUser.weeklyGoal - currentUser.wordsWrittenThisWeek} words to go
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-literary-border">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{currentUser.streak}</div>
                      <p className="text-xs text-muted-foreground">Day Streak</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{stats.wordsThisMonth.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Words This Month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="card-bg card-shadow border-literary-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <PostCard key={index} {...activity} />
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View All Activity
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Writing Goals */}
              <Card className="card-bg card-shadow border-literary-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Award className="h-5 w-5" />
                    <span>Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {writingGoals.map((goal, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{goal.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {goal.current}/{goal.target} {goal.unit}
                        </span>
                      </div>
                      <Progress value={(goal.current / goal.target) * 100} className="h-1.5" />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Update Goals
                  </Button>
                </CardContent>
              </Card>

              {/* Suggested Authors */}
              <Card className="card-bg card-shadow border-literary-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Users className="h-5 w-5" />
                    <span>Discover Authors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {suggestedAuthors.map((author, index) => (
                      <AuthorCard key={index} {...author} />
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Explore More Authors
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="card-bg card-shadow border-literary-border">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start">
                    <PenTool className="h-4 w-4 mr-2" />
                    Start Writing
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Works
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Find Authors
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Writing Events
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}