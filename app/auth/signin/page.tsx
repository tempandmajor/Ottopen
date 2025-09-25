"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { PenTool, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/src/contexts/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

// Component to handle search params with Suspense
function SearchParamsHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'confirm-email') {
      toast('Please check your email and click the confirmation link before signing in.', {
        duration: 5000,
        icon: '📧',
      });
    }
  }, [searchParams]);

  return null;
}

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('=== SIGNIN PROCESS START ===');
    console.log('Email:', email);

    try {
      console.log('Calling signIn from auth context...');
      const { error } = await signIn(email, password);

      console.log('SignIn result:', { error });

      if (error) {
        console.log('SignIn failed with error:', error);
        toast.error(error);
        return;
      }

      console.log('SignIn success! Testing direct API...');
      // Test direct API call for comparison
      try {
        const response = await fetch('/api/debug-signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const debugResult = await response.json();
        console.log('Debug signin API result:', debugResult);
      } catch (debugError) {
        console.log('Debug API failed:', debugError);
      }

      toast.success("Signed in successfully!");

      console.log('Waiting for auth state to update...');
      // Test redirect to non-protected page first
      setTimeout(() => {
        console.log('Attempting redirect to homepage...');
        router.push("/");
      }, 1000);
    } catch (error) {
      console.log('SignIn exception:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <PenTool className="h-8 w-8" />
            <h1 className="font-serif text-2xl font-semibold">Ottopen</h1>
          </Link>
          <p className="text-muted-foreground">Welcome back to the literary community</p>
        </div>

        {/* Sign In Form */}
        <Card className="card-bg card-shadow border-literary-border">
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-literary-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-literary-border pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don&apos;t have an account? </span>
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            By continuing, you agree to our{" "}
            <Link href="/legal/terms" className="hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}