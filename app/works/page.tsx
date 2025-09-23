import { Navigation } from "@/src/components/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Search, Filter, BookOpen, Star, Eye, Heart, Calendar, User } from "lucide-react";
import Link from "next/link";

export default function Works() {
  const featuredWorks = [
    {
      title: "The Bridge Between Worlds",
      author: "Maya Rodriguez",
      authorUsername: "maya_writes",
      type: "Novel",
      genre: "Literary Fiction",
      description: "A profound exploration of identity and belonging as two cultures collide in modern Barcelona. Rodriguez weaves a tale of love, loss, and self-discovery.",
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
      description: "A psychological thriller that will keep you guessing until the last page. Detective Sarah Chen must solve a case that hits too close to home.",
      publishedDate: "2024-01-20",
      pages: 289,
      rating: 4.5,
      reviews: 876,
      views: 12890,
      likes: 654,
      status: "Published",
      coverColor: "bg-gradient-to-br from-gray-700 to-black"
    },
    {
      title: "Digital Dreams",
      author: "David Kim",
      authorUsername: "david_scifi",
      type: "Novel",
      genre: "Science Fiction",
      description: "In 2089, the line between reality and virtual worlds has blurred. A young programmer discovers a conspiracy that threatens both worlds.",
      publishedDate: "2023-11-03",
      pages: 387,
      rating: 4.8,
      reviews: 2103,
      views: 23450,
      likes: 1567,
      status: "Published",
      coverColor: "bg-gradient-to-br from-cyan-500 to-blue-600"
    },
    {
      title: "Finding Home",
      author: "Sarah Williams",
      authorUsername: "sarah_ya",
      type: "Series",
      genre: "Young Adult",
      description: "A coming-of-age trilogy that follows Emma's journey from small-town dreamer to confident young woman finding her place in the world.",
      publishedDate: "2023-07-12",
      pages: 956,
      rating: 4.6,
      reviews: 3456,
      views: 34210,
      likes: 2890,
      status: "Complete",
      coverColor: "bg-gradient-to-br from-pink-500 to-orange-500"
    },
    {
      title: "Echoes of Tomorrow",
      author: "Maya Rodriguez",
      authorUsername: "maya_writes",
      type: "Novel",
      genre: "Literary Fiction",
      description: "Rodriguez's highly anticipated follow-up explores themes of climate change and human resilience through multiple interconnected narratives.",
      publishedDate: "2024-03-01",
      pages: 398,
      rating: 4.9,
      reviews: 567,
      views: 8920,
      likes: 743,
      status: "New Release",
      coverColor: "bg-gradient-to-br from-green-500 to-teal-600"
    },
    {
      title: "Voices in the Dark",
      author: "Amelia Foster",
      authorUsername: "amelia_theatre",
      type: "Play",
      genre: "Drama",
      description: "A powerful stage play examining social justice and human rights. Winner of the Young Playwright Award 2023.",
      publishedDate: "2023-10-15",
      pages: 89,
      rating: 4.4,
      reviews: 234,
      views: 4560,
      likes: 345,
      status: "Published",
      coverColor: "bg-gradient-to-br from-purple-600 to-indigo-700"
    }
  ];

  const newReleases = featuredWorks.filter(work =>
    new Date(work.publishedDate) > new Date('2024-01-01')
  );

  const popular = [...featuredWorks].sort((a, b) => b.views - a.views).slice(0, 4);
  const trending = [...featuredWorks].sort((a, b) => b.likes - a.likes).slice(0, 4);

  const genres = [
    "Literary Fiction", "Mystery & Thriller", "Romance", "Science Fiction",
    "Fantasy", "Poetry", "Non-Fiction", "Young Adult", "Historical Fiction",
    "Horror", "Drama", "Comedy"
  ];

  const WorkCard = ({ work }: { work: typeof featuredWorks[0] }) => (
    <Card className="card-bg card-shadow border-literary-border hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <div className={`w-16 h-20 sm:w-20 sm:h-24 rounded-lg ${work.coverColor} flex-shrink-0 flex items-center justify-center text-white font-bold text-lg`}>
            <BookOpen className="h-8 w-8" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="font-serif text-lg sm:text-xl font-semibold mb-1 truncate">
                  {work.title}
                </h3>
                <Link
                  href={`/profile/${work.authorUsername}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  by {work.author}
                </Link>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Badge variant={work.status === 'New Release' ? 'default' : 'secondary'}>
                  {work.status}
                </Badge>
                <Badge variant="outline">{work.type}</Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {work.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(work.publishedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short'
                })}
              </div>
              <div className="flex items-center">
                <BookOpen className="h-3 w-3 mr-1" />
                {work.pages} pages
              </div>
              <Badge variant="secondary" className="text-xs">
                {work.genre}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span>{work.rating}</span>
                  <span className="ml-1">({work.reviews})</span>
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>{work.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  <span>{work.likes}</span>
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">Literary Works</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore novels, short stories, poetry, and plays from our community of writers. Discover your next great read.
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
                      placeholder="Search works by title, author, or genre..."
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
                  <p className="text-sm font-medium mb-3">Browse by Genre</p>
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
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">15,672</span>
                </div>
                <p className="text-sm text-muted-foreground">Total Works</p>
              </CardContent>
            </Card>
            <Card className="card-bg border-literary-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">234</span>
                </div>
                <p className="text-sm text-muted-foreground">New This Week</p>
              </CardContent>
            </Card>
            <Card className="card-bg border-literary-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">2.1M</span>
                </div>
                <p className="text-sm text-muted-foreground">Total Reads</p>
              </CardContent>
            </Card>
            <Card className="card-bg border-literary-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">89.2K</span>
                </div>
                <p className="text-sm text-muted-foreground">Total Likes</p>
              </CardContent>
            </Card>
          </div>

          {/* Works Tabs */}
          <Tabs defaultValue="featured" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1">
              <TabsTrigger value="featured" className="p-3">
                <span className="text-sm">Featured</span>
              </TabsTrigger>
              <TabsTrigger value="new" className="p-3">
                <span className="text-sm">New Releases</span>
              </TabsTrigger>
              <TabsTrigger value="popular" className="p-3">
                <span className="text-sm">Popular</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="p-3">
                <span className="text-sm">Trending</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="featured" className="space-y-6">
              <div className="space-y-4">
                {featuredWorks.map((work, index) => (
                  <WorkCard key={index} work={work} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-6">
              <div className="space-y-4">
                {newReleases.map((work, index) => (
                  <WorkCard key={index} work={work} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="popular" className="space-y-6">
              <div className="space-y-4">
                {popular.map((work, index) => (
                  <WorkCard key={index} work={work} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trending" className="space-y-6">
              <div className="space-y-4">
                {trending.map((work, index) => (
                  <WorkCard key={index} work={work} />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Load More */}
          <div className="text-center pt-8">
            <Button variant="outline" size="lg">
              Load More Works
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}