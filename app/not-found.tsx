import { Navigation } from "@/src/components/navigation";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="card-bg card-shadow border-literary-border">
            <CardContent className="p-8 sm:p-12">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h1 className="font-serif text-6xl sm:text-8xl font-bold text-literary-accent">
                    404
                  </h1>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold">
                    Page Not Found
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    The page you&apos;re looking for doesn&apos;t exist. It might have been moved,
                    deleted, or you entered the wrong URL.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/" className="flex items-center space-x-2">
                      <Home className="h-4 w-4" />
                      <span>Go Home</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                    <Link href="/feed" className="flex items-center space-x-2">
                      <Search className="h-4 w-4" />
                      <span>Explore Feed</span>
                    </Link>
                  </Button>
                </div>

                <div className="pt-4">
                  <p className="text-xs text-muted-foreground">
                    &ldquo;Not all those who wander are lost.&rdquo; — J.R.R. Tolkien
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}