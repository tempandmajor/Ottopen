import { Navigation } from "@/src/components/navigation";
import { AuthorCard } from "@/src/components/author-card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent } from "@/src/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Search, Filter, TrendingUp, Users, Star, BookOpen } from "lucide-react";

export default function Authors() {
  const featuredAuthors = [
    {
      name: "Maya Rodriguez",
      specialty: "Literary Fiction",
      location: "Barcelona, Spain",
      works: 12,
      followers: 3420,
      bio: "Award-winning novelist exploring themes of identity and belonging. Author of 'The Bridge Between Worlds' and upcoming 'Echoes of Tomorrow'.",
      tags: ["Fiction", "Contemporary", "Literary", "Magical Realism"]
    },
    {
      name: "James Chen",
      specialty: "Screenwriter",
      location: "Los Angeles, CA",
      works: 8,
      followers: 1890,
      bio: "Emmy-nominated screenwriter for drama series. Currently developing new projects for streaming platforms.",
      tags: ["Screenplay", "Drama", "Thriller", "Television"]
    },
    {
      name: "Amelia Foster",
      specialty: "Playwright",
      location: "London, UK",
      works: 15,
      followers: 2650,
      bio: "Theatre creator with a passion for contemporary social issues. Winner of the Young Playwright Award 2023.",
      tags: ["Theatre", "Social Drama", "Contemporary"]
    },
    {
      name: "Marcus Thompson",
      specialty: "Mystery & Thriller",
      location: "Toronto, Canada",
      works: 6,
      followers: 4120,
      bio: "Bestselling mystery author known for psychological thrillers. His latest novel 'Shadows of Truth' topped charts for 8 weeks.",
      tags: ["Mystery", "Thriller", "Psychological", "Crime"]
    },
    {
      name: "Elena Vasquez",
      specialty: "Poetry",
      location: "Mexico City, Mexico",
      works: 23,
      followers: 1560,
      bio: "Contemporary poet whose work explores themes of migration, identity, and cultural heritage. Published in major literary magazines.",
      tags: ["Poetry", "Contemporary", "Cultural", "Identity"]
    },
    {
      name: "David Kim",
      specialty: "Science Fiction",
      location: "Seoul, South Korea",
      works: 9,
      followers: 3890,
      bio: "Science fiction author focusing on AI and future societies. His debut novel 'Digital Dreams' won the Nebula Award.",
      tags: ["Sci-Fi", "AI", "Future", "Technology"]
    },
    {
      name: "Sarah Williams",
      specialty: "Young Adult",
      location: "Melbourne, Australia",
      works: 14,
      followers: 5670,
      bio: "YA author whose coming-of-age stories resonate with teens worldwide. Her 'Finding Home' series has sold over 2 million copies.",
      tags: ["YA", "Coming-of-age", "Teen", "Romance"]
    },
    {
      name: "Ahmed Hassan",
      specialty: "Historical Fiction",
      location: "Cairo, Egypt",
      works: 7,
      followers: 2340,
      bio: "Historical fiction writer specializing in Middle Eastern narratives. His research-based novels bring ancient stories to modern readers.",
      tags: ["Historical", "Middle East", "Ancient", "Cultural"]
    }
  ];

  const newAuthors = featuredAuthors.slice(4);
  const trendingAuthors = [featuredAuthors[0], featuredAuthors[3], featuredAuthors[6]];
  const mostFollowed = [...featuredAuthors].sort((a, b) => b.followers - a.followers).slice(0, 3);

  const genres = [
    "Literary Fiction", "Mystery & Thriller", "Romance", "Science Fiction",
    "Fantasy", "Poetry", "Non-Fiction", "Young Adult", "Historical Fiction",
    "Horror", "Screenwriting", "Playwriting"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">Discover Authors</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with writers from around the world. Find your next favorite author or discover new voices in literature.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8">
            <Card className="card-bg card-shadow border-literary-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search authors by name, specialty, or location..."
                      className="pl-10 border-literary-border"
                    />
                  </div>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </Button>
                </div>

                {/* Genre Tags */}
                <div className="mt-4 pt-4 border-t border-literary-border">
                  <p className="text-sm font-medium mb-3">Popular Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <Badge
                        key={genre}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="card-bg border-literary-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">2,847</span>
                </div>
                <p className="text-sm text-muted-foreground">Active Authors</p>
              </CardContent>
            </Card>
            <Card className="card-bg border-literary-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">15,672</span>
                </div>
                <p className="text-sm text-muted-foreground">Published Works</p>
              </CardContent>
            </Card>
            <Card className="card-bg border-literary-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">892</span>
                </div>
                <p className="text-sm text-muted-foreground">New This Month</p>
              </CardContent>
            </Card>
            <Card className="card-bg border-literary-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">47</span>
                </div>
                <p className="text-sm text-muted-foreground">Award Winners</p>
              </CardContent>
            </Card>
          </div>

          {/* Author Tabs */}
          <Tabs defaultValue="featured" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1">
              <TabsTrigger value="featured" className="p-3">
                <span className="text-sm">Featured</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="p-3">
                <span className="text-sm">Trending</span>
              </TabsTrigger>
              <TabsTrigger value="new" className="p-3">
                <span className="text-sm">New</span>
              </TabsTrigger>
              <TabsTrigger value="popular" className="p-3">
                <span className="text-sm">Most Followed</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="featured" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {featuredAuthors.map((author, index) => (
                  <AuthorCard key={index} {...author} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trending" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {trendingAuthors.map((author, index) => (
                  <AuthorCard key={index} {...author} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {newAuthors.map((author, index) => (
                  <AuthorCard key={index} {...author} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="popular" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mostFollowed.map((author, index) => (
                  <AuthorCard key={index} {...author} />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Load More */}
          <div className="text-center pt-8">
            <Button variant="outline" size="lg">
              Load More Authors
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}