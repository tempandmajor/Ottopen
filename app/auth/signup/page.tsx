'use client'

import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Checkbox } from '@/src/components/ui/checkbox'
import { PenTool, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/src/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    specialty: '',
    accountType: 'writer' as
      | 'writer'
      | 'platform_agent'
      | 'external_agent'
      | 'producer'
      | 'publisher'
      | 'theater_director'
      | 'reader_evaluator',
    companyName: '',
    industryCredentials: '',
    licenseNumber: '',
    agreedToTerms: false,
    agreedToPrivacy: false,
  })

  const { signUp } = useAuth()
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.agreedToTerms) {
      toast.error('Please agree to the terms and conditions')
      return
    }

    if (!formData.agreedToPrivacy) {
      toast.error('Please agree to the privacy policy and data handling practices')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        username: formData.username,
        bio: formData.bio,
        specialty: formData.specialty,
        accountType: formData.accountType,
      })

      if (!result.success) {
        toast.error(result.error || 'Signup failed')
        return
      }

      toast.success(
        'Account created successfully! Please check your email to confirm your account before signing in.'
      )

      // Mark as new user for welcome modal
      localStorage.setItem('isNewUser', 'true')

      // Show confirmation message and don't redirect immediately
      setTimeout(() => {
        router.push('/auth/signin?message=confirm-email')
      }, 3000)
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <PenTool className="h-8 w-8" />
            <h1 className="font-serif text-2xl font-semibold">Ottopen</h1>
          </Link>
          <p className="text-muted-foreground">Join the literary community</p>
        </div>

        {/* Sign Up Form */}
        <Card className="card-bg card-shadow border-literary-border">
          <CardHeader>
            <CardTitle className="text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Maya Rodriguez"
                    value={formData.displayName}
                    onChange={e => handleInputChange('displayName', e.target.value)}
                    className="border-literary-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="maya_writes"
                    value={formData.username}
                    onChange={e => handleInputChange('username', e.target.value)}
                    className="border-literary-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="maya@example.com"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className="border-literary-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={e => handleInputChange('password', e.target.value)}
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
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters with numbers and symbols
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={e => handleInputChange('confirmPassword', e.target.value)}
                    className="border-literary-border pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-gray-600">Passwords do not match</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={value => handleInputChange('accountType', value)}
                >
                  <SelectTrigger className="border-literary-border">
                    <SelectValue placeholder="Select your account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="writer">Writer</SelectItem>
                    <SelectItem value="platform_agent">Literary Agent (Platform)</SelectItem>
                    <SelectItem value="external_agent">Literary Agent (External)</SelectItem>
                    <SelectItem value="producer">Producer</SelectItem>
                    <SelectItem value="publisher">Publisher</SelectItem>
                    <SelectItem value="theater_director">Theater Director</SelectItem>
                    <SelectItem value="reader_evaluator">Reader/Evaluator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Professional fields - shown for non-writer account types */}
              {formData.accountType !== 'writer' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company/Organization Name</Label>
                    <Input
                      id="companyName"
                      placeholder="e.g., Literary Agency Inc."
                      value={formData.companyName}
                      onChange={e => handleInputChange('companyName', e.target.value)}
                      className="border-literary-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industryCredentials">Industry Credentials (Optional)</Label>
                    <Input
                      id="industryCredentials"
                      placeholder="e.g., AAR Member, MFA in Writing"
                      value={formData.industryCredentials}
                      onChange={e => handleInputChange('industryCredentials', e.target.value)}
                      className="border-literary-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number (Optional)</Label>
                    <Input
                      id="licenseNumber"
                      placeholder="Professional license number if applicable"
                      value={formData.licenseNumber}
                      onChange={e => handleInputChange('licenseNumber', e.target.value)}
                      className="border-literary-border"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="specialty">
                  {formData.accountType === 'writer' ? 'Writing Specialty' : 'Specialty/Focus Area'}
                </Label>
                <Select
                  value={formData.specialty}
                  onValueChange={value => handleInputChange('specialty', value)}
                >
                  <SelectTrigger className="border-literary-border">
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Literary Fiction">Literary Fiction</SelectItem>
                    <SelectItem value="Mystery & Thriller">Mystery & Thriller</SelectItem>
                    <SelectItem value="Romance">Romance</SelectItem>
                    <SelectItem value="Science Fiction">Science Fiction</SelectItem>
                    <SelectItem value="Fantasy">Fantasy</SelectItem>
                    <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                    <SelectItem value="Poetry">Poetry</SelectItem>
                    <SelectItem value="Screenwriting">Screenwriting</SelectItem>
                    <SelectItem value="Playwriting">Playwriting</SelectItem>
                    <SelectItem value="Young Adult">Young Adult</SelectItem>
                    <SelectItem value="Children's Books">Children&apos;s Books</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your writing journey..."
                  value={formData.bio}
                  onChange={e => handleInputChange('bio', e.target.value)}
                  className="min-h-[80px] border-literary-border"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreedToTerms}
                    onCheckedChange={checked =>
                      handleInputChange('agreedToTerms', checked as boolean)
                    }
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer">
                    I agree to the{' '}
                    <Link
                      href="/legal/terms"
                      className="text-primary hover:underline font-medium"
                      target="_blank"
                    >
                      Terms of Service
                    </Link>
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={formData.agreedToPrivacy}
                    onCheckedChange={checked =>
                      handleInputChange('agreedToPrivacy', checked as boolean)
                    }
                    className="mt-1"
                  />
                  <Label htmlFor="privacy" className="text-sm cursor-pointer">
                    I understand and agree to the{' '}
                    <Link
                      href="/legal/privacy"
                      className="text-primary hover:underline font-medium"
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>
                    , including how my data will be collected, stored, and used. I acknowledge that
                    my profile will be private by default and I control its visibility.
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!formData.agreedToTerms || !formData.agreedToPrivacy || loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
