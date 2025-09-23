"use client";

import { Navigation } from "@/src/components/navigation";
import { AuthorCard } from "@/src/components/author-card";
import { PostCard } from "@/src/components/post-card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Search, Filter, Users, BookOpen, MessageCircle, Star, Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Mock search results
  const searchResults = {
    authors: [
      {
        name: "Maya Rodriguez",
        specialty: "Literary Fiction",
        location: "Barcelona, Spain",
        works: 12,
        followers: 3420,
        bio: "Award-winning novelist exploring themes of identity and belonging.",
        tags: ["Fiction", "Contemporary", "Literary", "Magical Realism"]
      },
      {
        name: "Marcus Thompson",
        specialty: "Mystery & Thriller",
        location: "Toronto, Canada",
        works: 6,
        followers: 4120,
        bio: "Bestselling mystery author known for psychological thrillers.",
        tags: ["Mystery", "Thriller", "Psychological", "Crime"]
      }
    ],
    works: [
      {
        title: "The Bridge Between Worlds",
        author: "Maya Rodriguez",
        authorUsername: "maya_writes",
        type: "Novel",
        genre: "Literary Fiction",
        description: "A profound exploration of identity and belonging as two cultures collide in modern Barcelona.",
        publishedDate: "2023-09-15",
        pages: 342,
        rating: 4.7,
        reviews: 1249,
        views: 15420,
        likes: 892,
        status: "Published",
        coverColor: "bg-gradient-to-br from-blue-500 to-purple-600"
      },
      {
        title: "Shadows of Truth",
        author: "Marcus Thompson",
        authorUsername: "marcus_fiction",
        type: "Novel",
        genre: "Mystery & Thriller",
        description: "A psychological thriller that will keep you guessing until the last page.",
        publishedDate: "2024-01-20",
        pages: 289,
        rating: 4.5,
        reviews: 876,
        views: 12890,
        likes: 654,
        status: "Published",
        coverColor: "bg-gradient-to-br from-gray-700 to-black"
      }
    ],
    posts: [
      {
        author: "Maya Rodriguez",
        time: "2h ago",
        content: "Just finished the first draft of chapter 12. There's something magical about those late-night writing sessions when the words just flow.",
        type: "discussion" as const,
        likes: 24,
        comments: 8
      },
      {
        author: "Marcus Thompson",
        time: "1d ago",
        content: "Working on a new psychological thriller. The challenge is making readers question what's real and what's imagination.",
        type: "discussion" as const,
        likes: 67,
        comments: 15
      }
    ]
  };

  const totalResults = searchResults.authors.length + searchResults.works.length + searchResults.posts.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would trigger the search
    console.log("Searching for:", searchQuery);
  };

  const WorkCard = ({ work }: { work: typeof searchResults.works[0] }) => (
    <Card className="card-bg card-shadow border-literary-border hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <div className={`w-16 h-20 rounded-lg ${work.coverColor} flex-shrink-0 flex items-center justify-center text-white font-bold text-lg`}>
            <BookOpen className="h-8 w-8" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-semibold mb-1 truncate">
                  {work.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  by {work.author}
                </p>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Badge variant="secondary">{work.type}</Badge>
                <Badge variant="outline">{work.genre}</Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {work.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span>{work.rating}</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>{work.pages} pages</span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Read
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-4">
              {searchQuery ? `Search Results for &quot;${searchQuery}&quot;` : "Search Ottopen"}
            </h1>

            {/* Search Form */}
            <Card className="card-bg card-shadow border-literary-border">
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for authors, works, posts, or topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-literary-border"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">
                      Search
                    </Button>
                    <Button variant="outline" type="button">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {searchQuery && (
            <>
              {/* Results Summary */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground">
                  Found {totalResults} results for &quot;{searchQuery}&quot;
                </p>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Last updated 2 hours ago</span>
                </div>
              </div>

              {/* Search Results Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                  <TabsTrigger value="all" className="p-3">
                    <span className="text-sm">All ({totalResults})</span>
                  </TabsTrigger>
                  <TabsTrigger value="authors" className="p-3">
                    <span className="text-sm">Authors ({searchResults.authors.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="works" className="p-3">
                    <span className="text-sm">Works ({searchResults.works.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="posts" className="p-3">
                    <span className="text-sm">Posts ({searchResults.posts.length})</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-8">
                  {/* Authors Section */}
                  {searchResults.authors.length > 0 && (
                    <section>
                      <div className="flex items-center space-x-2 mb-4">
                        <Users className="h-5 w-5" />
                        <h2 className="font-serif text-xl font-semibold">Authors</h2>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {searchResults.authors.map((author, index) => (
                          <AuthorCard key={index} {...author} />
                        ))}
                      </div>
                    </section>
                  )}

                  <Separator />

                  {/* Works Section */}
                  {searchResults.works.length > 0 && (
                    <section>
                      <div className="flex items-center space-x-2 mb-4">
                        <BookOpen className="h-5 w-5" />
                        <h2 className="font-serif text-xl font-semibold">Works</h2>
                      </div>
                      <div className="space-y-4">
                        {searchResults.works.map((work, index) => (
                          <WorkCard key={index} work={work} />
                        ))}
                      </div>
                    </section>
                  )}

                  <Separator />

                  {/* Posts Section */}
                  {searchResults.posts.length > 0 && (
                    <section>
                      <div className="flex items-center space-x-2 mb-4">
                        <MessageCircle className="h-5 w-5" />
                        <h2 className="font-serif text-xl font-semibold">Posts</h2>
                      </div>
                      <div className="space-y-4">
                        {searchResults.posts.map((post, index) => (
                          <PostCard key={index} {...post} />
                        ))}
                      </div>
                    </section>
                  )}
                </TabsContent>

                <TabsContent value="authors" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {searchResults.authors.map((author, index) => (
                      <AuthorCard key={index} {...author} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="works" className="space-y-6">
                  <div className="space-y-4">
                    {searchResults.works.map((work, index) => (
                      <WorkCard key={index} work={work} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="posts" className="space-y-6">
                  <div className="space-y-4">
                    {searchResults.posts.map((post, index) => (
                      <PostCard key={index} {...post} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Load More */}
              <div className="text-center pt-8">
                <Button variant="outline" size="lg">
                  Load More Results
                </Button>
              </div>
            </>
          )}

          {!searchQuery && (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-serif text-2xl font-semibold mb-2">Discover the Literary World</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Search for your favorite authors, discover new works, or find discussions on topics you love.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}