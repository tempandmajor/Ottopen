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
import { Progress } from '@/src/components/ui/progress'
import {
  PenTool,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/src/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { dbService } from '@/src/lib/database'
import { GoogleOAuthButton } from '@/src/components/auth/google-oauth-button'

// Password strength calculator
function calculatePasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  if (password.length >= 8) score += 20
  if (password.length >= 12) score += 10
  if (/[a-z]/.test(password)) score += 20
  if (/[A-Z]/.test(password)) score += 20
  if (/[0-9]/.test(password)) score += 15
  if (/[^A-Za-z0-9]/.test(password)) score += 15

  if (score < 40) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score < 70) return { score, label: 'Fair', color: 'bg-yellow-500' }
  if (score < 90) return { score, label: 'Good', color: 'bg-blue-500' }
  return { score: 100, label: 'Strong', color: 'bg-green-500' }
}

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' })
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
    referralCode: '',
  })

  const { signUp } = useAuth()
  const router = useRouter()

  const totalSteps = formData.accountType === 'writer' ? 3 : 4
  const progress = (currentStep / totalSteps) * 100

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username.length < 3) {
        setUsernameAvailable(null)
        return
      }

      setUsernameChecking(true)
      try {
        const available = await dbService.checkUsernameAvailability(formData.username)
        setUsernameAvailable(available)
      } catch (error) {
        setUsernameAvailable(null)
      } finally {
        setUsernameChecking(false)
      }
    }

    const timer = setTimeout(checkUsername, 500)
    return () => clearTimeout(timer)
  }, [formData.username])

  // Update password strength
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(calculatePasswordStrength(formData.password))
    } else {
      setPasswordStrength({ score: 0, label: '', color: '' })
    }
  }, [formData.password])

  // Auto-suggest username from display name
  useEffect(() => {
    if (formData.displayName && !formData.username) {
      const suggested = formData.displayName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
      setFormData(prev => ({ ...prev, username: suggested }))
    }
  }, [formData.displayName])

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

    if (!usernameAvailable) {
      toast.error('Username is not available')
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

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.email &&
          formData.password &&
          formData.confirmPassword &&
          formData.password === formData.confirmPassword &&
          formData.password.length >= 8 &&
          passwordStrength.score >= 40
        )
      case 2:
        return formData.displayName && formData.username && usernameAvailable
      case 3:
        return formData.specialty && formData.agreedToTerms && formData.agreedToPrivacy
      case 4:
        return true // Optional professional details
      default:
        return false
    }
  }

  const nextStep = () => {
    if (canProceed()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
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

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Step {currentStep} of {totalSteps}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Sign Up Form */}
        <Card className="card-bg card-shadow border-literary-border">
          <CardHeader>
            <CardTitle className="text-center">
              {currentStep === 1 && 'Create Your Account'}
              {currentStep === 2 && 'Build Your Profile'}
              {currentStep === 3 && 'Set Your Preferences'}
              {currentStep === 4 && 'Professional Details'}
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              {currentStep === 1 && 'Start with your email and a secure password'}
              {currentStep === 2 && 'Tell us about yourself'}
              {currentStep === 3 && 'Choose your specialty and agree to our terms'}
              {currentStep === 4 && 'Optional: Add your professional credentials'}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google OAuth Button - Only show on first step */}
            {currentStep === 1 && (
              <>
                <GoogleOAuthButton mode="signup" />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-literary-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with email
                    </span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Step 1: Email & Password */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      className="border-literary-border"
                      required
                      autoFocus
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
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {formData.password && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Password Strength: {passwordStrength.label}</span>
                          <span>{passwordStrength.score}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${passwordStrength.score}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Use at least 8 characters with letters, numbers, and symbols
                        </p>
                      </div>
                    )}
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
                      <p className="text-xs text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Passwords do not match
                      </p>
                    )}
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <p className="text-xs text-green-600 flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Passwords match
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Step 2: Profile Info */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      placeholder="Maya Rodriguez"
                      value={formData.displayName}
                      onChange={e => handleInputChange('displayName', e.target.value)}
                      className="border-literary-border"
                      required
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      This is how other users will see you
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <Input
                        id="username"
                        placeholder="maya_writes"
                        value={formData.username}
                        onChange={e => handleInputChange('username', e.target.value)}
                        className="border-literary-border pr-10"
                        required
                      />
                      {usernameChecking && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {!usernameChecking && usernameAvailable === true && formData.username && (
                        <CheckCircle2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                      )}
                      {!usernameChecking && usernameAvailable === false && formData.username && (
                        <AlertCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                      )}
                    </div>
                    {usernameAvailable === false && (
                      <p className="text-xs text-red-600">Username is already taken</p>
                    )}
                    {usernameAvailable === true && (
                      <p className="text-xs text-green-600">Username is available!</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Your unique identifier (letters, numbers, and underscores only)
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                      {formData.bio.length}/500 characters
                    </p>
                  </div>
                </>
              )}

              {/* Step 3: Preferences */}
              {currentStep === 3 && (
                <>
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

                  <div className="space-y-2">
                    <Label htmlFor="specialty">
                      {formData.accountType === 'writer'
                        ? 'Writing Specialty'
                        : 'Specialty/Focus Area'}
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
                    <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                    <Input
                      id="referralCode"
                      placeholder="Enter code if you were referred"
                      value={formData.referralCode}
                      onChange={e => handleInputChange('referralCode', e.target.value)}
                      className="border-literary-border"
                    />
                  </div>

                  <div className="space-y-3 pt-4">
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
                        , including how my data will be collected, stored, and used. I acknowledge
                        that my profile will be private by default and I control its visibility.
                      </Label>
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Professional Details (Non-Writers Only) */}
              {currentStep === 4 && formData.accountType !== 'writer' && (
                <>
                  <div className="p-4 bg-muted rounded-lg mb-4">
                    <p className="text-sm text-muted-foreground">
                      These details help writers find and trust you. All fields are optional but
                      recommended for professional accounts.
                    </p>
                  </div>

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
                    <Label htmlFor="industryCredentials">Industry Credentials</Label>
                    <Input
                      id="industryCredentials"
                      placeholder="e.g., AAR Member, MFA in Writing"
                      value={formData.industryCredentials}
                      onChange={e => handleInputChange('industryCredentials', e.target.value)}
                      className="border-literary-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
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

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                )}
                <div className={currentStep === 1 ? 'w-full' : ''}>
                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className={currentStep === 1 ? 'w-full' : 'ml-auto'}
                    >
                      Next Step
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="ml-auto"
                      disabled={!formData.agreedToTerms || !formData.agreedToPrivacy || loading}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  )}
                </div>
              </div>
            </form>

            <div className="text-center text-sm pt-4 border-t">
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
