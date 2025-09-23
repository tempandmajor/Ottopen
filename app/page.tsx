import { Navigation } from "@/src/components/navigation";
import { AuthorCard } from "@/src/components/author-card";
import { PostCard } from "@/src/components/post-card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Search, TrendingUp, Star, BookOpen } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const featuredAuthors = [
    {
      name: "Maya Rodriguez",
      specialty: "Literary Fiction",
      location: "Barcelona, Spain",
      works: 12,
      followers: 3420,
      bio: "Award-winning novelist exploring themes of identity and belonging. Author of 'The Bridge Between Worlds' and upcoming 'Echoes of Tomorrow'.",
      tags: ["Fiction", "Contemporary", "Literary"]
    },
    {
      name: "James Chen",
      specialty: "Screenwriter",
      location: "Los Angeles, CA",
      works: 8,
      followers: 1890,
      bio: "Emmy-nominated screenwriter for drama series. Currently developing new projects for streaming platforms.",
      tags: ["Screenplay", "Drama", "Thriller"]
    },
    {
      name: "Amelia Foster",
      specialty: "Playwright",
      location: "London, UK",
      works: 15,
      followers: 2650,
      bio: "Theatre creator with a passion for contemporary social issues. Winner of the Young Playwright Award 2023.",
      tags: ["Theatre", "Social Drama", "Contemporary"]
    }
  ];

  const recentPosts = [
    {
      author: "Maya Rodriguez",
      time: "2h ago",
      content: "Just finished the first draft of chapter 12. There's something magical about those late-night writing sessions when the words just flow. The characters are finally telling me their secrets.\n\nWhat's your favorite time to write?",
      type: "discussion" as const,
      likes: 24,
      comments: 8
    },
    {
      author: "James Chen",
      time: "4h ago",
      content: "\"FADE IN:\n\nEXT. COFFEE SHOP - MORNING\n\nThe rain drums against the window as SARAH stares at her laptop screen, cursor blinking mockingly at the blank page...\"\n\nWorking on a new short film script. Sometimes the simplest scenes carry the most weight.",
      type: "excerpt" as const,
      likes: 31,
      comments: 12
    },
    {
      author: "Amelia Foster",
      time: "6h ago",
      content: "Thrilled to announce my new play 'Voices in the Dark' will premiere at the Riverside Theatre next month! It's been a two-year journey bringing this story to life.\n\nPremiere night: October 15th. Who's in London and wants to join?",
      type: "announcement" as const,
      likes: 67,
      comments: 23
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="hero-bg py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="font-sans text-5xl lg:text-6xl font-bold leading-tight">
                  Where <span className="italic">Stories</span> Connect
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Join a community of authors, screenwriters, and playwrights. Share your work,
                  discover new voices, and build meaningful connections in the literary world.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="font-medium">
                  Start Writing
                </Button>
                <Button variant="outline" size="lg">
                  Explore Community
                </Button>
              </div>

              <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>2.4k+ Active Writers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>12k+ Stories Shared</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>500+ Published</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <Image
                src="/hero-writers.jpg"
                alt="Writers and creators collaborating"
                width={600}
                height={400}
                className="rounded-2xl literary-shadow w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 px-4 border-b border-literary-border">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search authors, works, or discussions..."
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Feed */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold">Discover Writers</h2>
                <Button variant="outline" size="sm">
                  Filter
                </Button>
              </div>

              <div className="space-y-4">
                {recentPosts.map((post, index) => (
                  <PostCard key={index} {...post} />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-xl font-semibold mb-4">Featured Authors</h3>
                <div className="space-y-4">
                  {featuredAuthors.map((author, index) => (
                    <AuthorCard key={index} {...author} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}