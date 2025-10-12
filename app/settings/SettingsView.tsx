'use client'

import { Footer } from '@/src/components/footer'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Switch } from '@/src/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Download,
  Trash2,
  Camera,
  Save,
  AlertTriangle,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CreditCard,
  Crown,
  ExternalLink,
  Twitter,
  Linkedin,
  Github,
  Link as LinkIcon,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/src/components/ui/alert-dialog'
import { useState, useEffect } from 'react'
import { dbService } from '@/src/lib/database'
import { authService } from '@/src/lib/auth'
import type { User as UserType, User as SupabaseUser } from '@/src/lib/supabase'
import type { User as AuthUser } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'
import { supabase } from '@/src/lib/supabase'
import { updateUserProfileAction } from '@/app/actions/user'

interface SettingsViewProps {
  user: (AuthUser & { profile?: SupabaseUser }) | null
}

export function SettingsView({ user: currentUser }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userProfile, setUserProfile] = useState<UserType | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarFileInputKey, setAvatarFileInputKey] = useState(0)

  // Form states
  const [profileData, setProfileData] = useState({
    displayName: '',
    username: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    specialty: '',
  })

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    language: 'en',
    timezone: 'UTC',
  })

  const [socialLinks, setSocialLinks] = useState({
    twitter: '',
    linkedin: '',
    github: '',
    website: '',
    other: '',
  })

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newFollowers: true,
    newMessages: true,
    postLikes: false,
    postComments: true,
    mentions: true,
    newsletter: true,
  })

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showInDirectory: false,
    allowMessagesFrom: 'everyone',
    hideLocation: false,
    showEmail: false,
    showFollowers: true,
    searchable: true,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState<{
    status: 'active' | 'canceled' | 'past_due' | 'none'
    planName: string
    amount: number
    currency: string
    interval: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
  }>({
    status: 'none',
    planName: '',
    amount: 0,
    currency: 'usd',
    interval: '',
    currentPeriodEnd: '',
    cancelAtPeriodEnd: false,
  })

  // Load user data on mount
  useEffect(() => {
    if (currentUser?.profile) {
      loadUserData()
      loadSubscriptionData()
      loadNotificationSettings()
      loadPrivacySettings()
      loadSocialLinks()
    }
  }, [currentUser])

  // Load notification settings from database (self-only)
  const loadNotificationSettings = async () => {
    if (!currentUser?.profile) return
    try {
      const settings = await dbService.getNotificationSettings(currentUser.profile.id)
      if (settings) {
        setNotificationSettings({
          emailNotifications: settings.email_notifications,
          pushNotifications: settings.push_notifications,
          newFollowers: settings.new_followers,
          newMessages: settings.new_messages,
          postLikes: settings.post_likes,
          postComments: settings.post_comments,
          mentions: settings.mentions,
          newsletter: settings.newsletter,
        })
      }
    } catch (error) {
      console.warn('Failed to load notification settings', error)
      toast.error('Failed to load notification settings')
    }
  }

  // Load privacy settings from database (self-only)
  const loadPrivacySettings = async () => {
    if (!currentUser?.profile) return
    try {
      const settings = await dbService.getPrivacySettings(currentUser.profile.id)
      if (settings) {
        setPrivacySettings({
          profileVisibility: settings.profile_visibility,
          showInDirectory: settings.show_in_directory,
          allowMessagesFrom: settings.allow_messages_from,
          hideLocation: settings.hide_location,
          showEmail: settings.show_email,
          showFollowers: settings.show_followers,
          searchable: settings.searchable,
        })
      }
    } catch (error) {
      console.warn('Failed to load privacy settings', error)
      toast.error('Failed to load privacy settings')
    }
  }

  // Handle URL parameters for tab switching (e.g., returning from Stripe)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [])

  const loadUserData = async () => {
    if (!currentUser?.profile) return

    try {
      setLoading(true)
      const profile = currentUser.profile

      setUserProfile(profile)
      setProfileData({
        displayName: profile.display_name || '',
        username: profile.username || '',
        email: currentUser.email || '',
        bio: profile.bio || '',
        location: (profile as any).location || '',
        website: (profile as any).website || '',
        specialty: profile.specialty || '',
      })

      setAppearanceSettings({
        theme: ((profile as any).theme as 'light' | 'dark' | 'system') || 'system',
        language: (profile as any).language || 'en',
        timezone: (profile as any).timezone || 'UTC',
      })

      // Notification & privacy loaded separately
    } catch (error) {
      console.error('Failed to load user data:', error)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const loadSubscriptionData = async () => {
    if (!currentUser?.profile?.stripe_customer_id) {
      // No Stripe customer ID, so no subscription
      setSubscriptionData({
        status: 'none',
        planName: '',
        amount: 0,
        currency: 'usd',
        interval: '',
        currentPeriodEnd: '',
        cancelAtPeriodEnd: false,
      })
      return
    }

    try {
      const response = await fetch(
        `/api/subscription-status?customerId=${currentUser.profile.stripe_customer_id}`
      )
      const data = await response.json()
      setSubscriptionData(data)
    } catch (error) {
      console.error('Failed to load subscription data:', error)
      setSubscriptionData({
        status: 'none',
        planName: '',
        amount: 0,
        currency: 'usd',
        interval: '',
        currentPeriodEnd: '',
        cancelAtPeriodEnd: false,
      })
    }
  }

  const loadSocialLinks = async () => {
    if (!currentUser?.profile || !supabase) return
    try {
      const { data } = await supabase
        .from('user_social_links')
        .select('platform, url')
        .eq('user_id', currentUser.profile.id)

      if (data) {
        const links: any = {}
        data.forEach(link => {
          links[link.platform] = link.url
        })
        setSocialLinks({
          twitter: links.twitter || '',
          linkedin: links.linkedin || '',
          github: links.github || '',
          website: links.website || '',
          other: links.other || '',
        })
      }
    } catch (error) {
      console.error('Failed to load social links:', error)
    }
  }

  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {}

    if (!profileData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    }

    if (!profileData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (!/^[a-zA-Z0-9_]+$/.test(profileData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (profileData.bio.length > 500) {
      newErrors.bio = 'Bio cannot exceed 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {}

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveProfile = async () => {
    if (!currentUser?.profile || !validateProfileForm()) return

    try {
      setSaving(true)
      setErrors({})

      const updatedProfile = await dbService.updateUser(currentUser.profile.id, {
        display_name: profileData.displayName,
        username: profileData.username,
        bio: profileData.bio,
        specialty: profileData.specialty,
        location: profileData.location,
        website: profileData.website,
      } as any)

      if (updatedProfile) {
        setUserProfile(updatedProfile)
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return

    try {
      setSaving(true)
      setErrors({})

      // First verify the current password
      const verifyResult = await authService.verifyCurrentPassword(passwordForm.currentPassword)

      if (!verifyResult.valid) {
        setErrors({ currentPassword: verifyResult.error || 'Current password is incorrect' })
        toast.error(verifyResult.error || 'Current password is incorrect')
        return
      }

      // Update to new password
      const result = await authService.updatePassword(passwordForm.newPassword)

      if (result.error) {
        setErrors({ currentPassword: result.error })
        toast.error(result.error)
      } else {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        toast.success('Password updated successfully!')
      }
    } catch (error) {
      console.error('Failed to update password:', error)
      toast.error('Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      setSaving(true)
      if (!currentUser?.profile) throw new Error('No user')
      const result = await dbService.upsertNotificationSettings(currentUser.profile.id, {
        email_notifications: notificationSettings.emailNotifications,
        push_notifications: notificationSettings.pushNotifications,
        new_followers: notificationSettings.newFollowers,
        new_messages: notificationSettings.newMessages,
        post_likes: notificationSettings.postLikes,
        post_comments: notificationSettings.postComments,
        mentions: notificationSettings.mentions,
        newsletter: notificationSettings.newsletter,
      })
      if (!result) throw new Error('Failed to save')
      toast.success('Notification preferences saved!')
    } catch (error) {
      console.error('Failed to save notifications:', error)
      toast.error('Failed to save notification preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrivacy = async () => {
    try {
      setSaving(true)
      if (!currentUser?.profile) throw new Error('No user')
      const result = await dbService.upsertPrivacySettings(currentUser.profile.id, {
        profile_visibility: privacySettings.profileVisibility,
        show_in_directory: privacySettings.showInDirectory,
        allow_messages_from: privacySettings.allowMessagesFrom,
        hide_location: privacySettings.hideLocation,
        show_email: privacySettings.showEmail,
        show_followers: privacySettings.showFollowers,
        searchable: privacySettings.searchable,
      })
      if (!result) throw new Error('Failed to save')
      toast.success('Privacy settings saved!')
    } catch (error) {
      console.error('Failed to save privacy settings:', error)
      toast.error('Failed to save privacy settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAppearance = async () => {
    try {
      setSaving(true)
      if (!currentUser?.profile) throw new Error('No user')

      const updatedProfile = await dbService.updateUser(currentUser.profile.id, {
        theme: appearanceSettings.theme,
        language: appearanceSettings.language,
        timezone: appearanceSettings.timezone,
      } as any)

      if (updatedProfile) {
        // Apply theme immediately
        document.documentElement.classList.remove('light', 'dark')
        if (appearanceSettings.theme !== 'system') {
          document.documentElement.classList.add(appearanceSettings.theme)
        } else {
          // Apply system preference
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          document.documentElement.classList.add(isDark ? 'dark' : 'light')
        }

        toast.success('Appearance settings saved!')
      }
    } catch (error) {
      console.error('Failed to save appearance settings:', error)
      toast.error('Failed to save appearance settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSocialLinks = async () => {
    try {
      setSaving(true)
      if (!currentUser?.profile || !supabase) throw new Error('No user')

      // Delete existing links
      await supabase.from('user_social_links').delete().eq('user_id', currentUser.profile.id)

      // Insert new links (only non-empty ones)
      const linksToInsert = Object.entries(socialLinks)
        .filter(([_, url]) => url.trim())
        .map(([platform, url]) => ({
          user_id: currentUser.profile!.id,
          platform,
          url,
        }))

      if (linksToInsert.length > 0) {
        await supabase.from('user_social_links').insert(linksToInsert)
      }

      toast.success('Social links saved!')
    } catch (error) {
      console.error('Failed to save social links:', error)
      toast.error('Failed to save social links')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings/export-data')

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ottopen-data-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Data exported successfully!')
    } catch (error) {
      console.error('Failed to export data:', error)
      toast.error('Failed to export data')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password')
      return
    }

    try {
      setDeleting(true)

      const response = await fetch('/api/settings/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      toast.success('Account deleted successfully')

      // Redirect to home page after short delay
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error: any) {
      console.error('Failed to delete account:', error)
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-2">Settings</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage your account preferences and privacy settings
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto p-1">
                <TabsTrigger value="profile" className="flex items-center space-x-2 p-3">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="subscription" className="flex items-center space-x-2 p-3">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Subscription</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center space-x-2 p-3">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="privacy" className="flex items-center space-x-2 p-3">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Privacy</span>
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center space-x-2 p-3">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Appearance</span>
                </TabsTrigger>
                <TabsTrigger value="account" className="flex items-center space-x-2 p-3">
                  <Key className="h-4 w-4" />
                  <span className="hidden sm:inline">Account</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Settings */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="card-bg card-shadow border-literary-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Profile Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                      <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                        <AvatarImage src={userProfile?.avatar_url} alt={profileData.displayName} />
                        <AvatarFallback className="bg-literary-subtle text-foreground font-bold text-lg">
                          {profileData.displayName
                            ?.split(' ')
                            .map(n => n[0])
                            .join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <input
                          key={avatarFileInputKey}
                          id="avatar-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async e => {
                            const file = e.target.files?.[0]
                            if (!file || !currentUser?.profile) return
                            try {
                              setAvatarUploading(true)
                              // Validate type and size
                              const allowed = ['image/jpeg', 'image/png', 'image/webp']
                              if (!allowed.includes(file.type)) {
                                toast.error('Unsupported image type. Use JPG, PNG, or WebP')
                                return
                              }
                              const maxBytes = 5 * 1024 * 1024 // 5MB
                              if (file.size > maxBytes) {
                                toast.error('Image too large. Max size is 5MB')
                                return
                              }
                              if (!supabase) {
                                toast.error('Unable to upload avatar')
                                return
                              }

                              const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
                              const path = `${currentUser.profile.id}/avatar.${ext}`
                              // Upload to avatars bucket; upsert to replace existing
                              const { error: upErr } = await supabase.storage
                                .from('avatars')
                                .upload(path, file, { cacheControl: '3600', upsert: true })
                              if (upErr) {
                                console.error('Avatar upload failed:', upErr)
                                toast.error('Failed to upload avatar')
                                return
                              }
                              const { data } = supabase.storage.from('avatars').getPublicUrl(path)
                              const publicUrl = data.publicUrl
                              const updated = await dbService.updateUser(currentUser.profile.id, {
                                avatar_url: publicUrl,
                              } as Partial<UserType>)
                              if (updated) {
                                setUserProfile(updated)
                                toast.success('Profile photo updated!')
                              } else {
                                toast.error('Failed to update profile')
                              }
                            } catch (err) {
                              console.error('Avatar upload error:', err)
                              toast.error('Failed to upload avatar')
                            } finally {
                              setAvatarUploading(false)
                              // Reset file input
                              setAvatarFileInputKey(k => k + 1)
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                          disabled={avatarUploading}
                          onClick={() => document.getElementById('avatar-file-input')?.click()}
                        >
                          <Camera className="h-4 w-4" />
                          <span>{avatarUploading ? 'Uploading...' : 'Change Photo'}</span>
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          PNG/JPG up to ~5MB recommended
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Profile Form */}
                    <div className="grid gap-4 sm:gap-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            value={profileData.displayName}
                            onChange={e => {
                              setProfileData(prev => ({ ...prev, displayName: e.target.value }))
                              if (errors.displayName) {
                                setErrors(prev => ({ ...prev, displayName: '' }))
                              }
                            }}
                            className={`border-literary-border ${errors.displayName ? 'border-destructive' : ''}`}
                            disabled={saving}
                          />
                          {errors.displayName && (
                            <p className="text-sm text-destructive">{errors.displayName}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={profileData.username}
                            onChange={e => {
                              setProfileData(prev => ({ ...prev, username: e.target.value }))
                              if (errors.username) {
                                setErrors(prev => ({ ...prev, username: '' }))
                              }
                            }}
                            className={`border-literary-border ${errors.username ? 'border-destructive' : ''}`}
                            disabled={saving}
                          />
                          {errors.username && (
                            <p className="text-sm text-destructive">{errors.username}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={e => {
                            setProfileData(prev => ({ ...prev, email: e.target.value }))
                            if (errors.email) {
                              setErrors(prev => ({ ...prev, email: '' }))
                            }
                          }}
                          className={`border-literary-border ${errors.email ? 'border-destructive' : ''}`}
                          disabled={saving}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={e => {
                            setProfileData(prev => ({ ...prev, bio: e.target.value }))
                            if (errors.bio) {
                              setErrors(prev => ({ ...prev, bio: '' }))
                            }
                          }}
                          className={`min-h-[100px] border-literary-border ${errors.bio ? 'border-destructive' : ''}`}
                          placeholder="Tell us about yourself..."
                          disabled={saving}
                        />
                        <div className="flex justify-between items-center">
                          <p
                            className={`text-xs ${profileData.bio.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}
                          >
                            {profileData.bio.length}/500 characters
                          </p>
                          {errors.bio && <p className="text-sm text-destructive">{errors.bio}</p>}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={profileData.location}
                            onChange={e =>
                              setProfileData(prev => ({ ...prev, location: e.target.value }))
                            }
                            className="border-literary-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={profileData.website}
                            onChange={e =>
                              setProfileData(prev => ({ ...prev, website: e.target.value }))
                            }
                            className="border-literary-border"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="specialty">Writing Specialty</Label>
                        <Select
                          value={profileData.specialty}
                          onValueChange={value =>
                            setProfileData(prev => ({ ...prev, specialty: value }))
                          }
                          disabled={saving}
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
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    {/* Social Links Section */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-semibold">Social Links</Label>
                        <p className="text-sm text-muted-foreground">
                          Add links to your social media and professional profiles
                        </p>
                      </div>

                      <div className="grid gap-4">
                        <div className="flex items-center gap-3">
                          <Twitter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Input
                            placeholder="https://twitter.com/username"
                            value={socialLinks.twitter}
                            onChange={e =>
                              setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))
                            }
                            className="border-literary-border"
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <Linkedin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Input
                            placeholder="https://linkedin.com/in/username"
                            value={socialLinks.linkedin}
                            onChange={e =>
                              setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))
                            }
                            className="border-literary-border"
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <Github className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Input
                            placeholder="https://github.com/username"
                            value={socialLinks.github}
                            onChange={e =>
                              setSocialLinks(prev => ({ ...prev, github: e.target.value }))
                            }
                            className="border-literary-border"
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Input
                            placeholder="Other link (portfolio, blog, etc.)"
                            value={socialLinks.other}
                            onChange={e =>
                              setSocialLinks(prev => ({ ...prev, other: e.target.value }))
                            }
                            className="border-literary-border"
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between gap-3">
                      <Button
                        variant="outline"
                        onClick={handleSaveSocialLinks}
                        disabled={saving}
                        className="flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save Social Links</span>
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Save Profile</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subscription Settings */}
              <TabsContent value="subscription" className="space-y-6">
                <Card className="card-bg card-shadow border-literary-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Subscription Management</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {subscriptionData.status === 'none' ? (
                      /* No subscription */
                      <div className="space-y-8">
                        <div className="text-center">
                          <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-medium mb-2">Choose Your Plan</h3>
                          <p className="text-muted-foreground mb-6">
                            Select the plan that best fits your creative goals
                          </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {/* Writer Premium Plan */}
                          <div className="border border-literary-border rounded-lg p-6 bg-card">
                            <div className="text-center mb-4">
                              <h4 className="font-semibold text-lg">Writer Premium</h4>
                              <p className="text-2xl font-bold">
                                $20<span className="text-sm text-muted-foreground">/month</span>
                              </p>
                            </div>
                            <ul className="text-sm space-y-2 mb-6">
                              <li>• Unlimited submissions</li>
                              <li>• Priority review</li>
                              <li>• Professional feedback</li>
                              <li>• Submission tracking</li>
                              <li>• Industry networking</li>
                            </ul>
                            <Button
                              className="w-full"
                              onClick={() =>
                                window.open(
                                  'https://buy.stripe.com/test_aFa9AS8YPfgW64ebCvdUY00',
                                  '_blank'
                                )
                              }
                            >
                              Get Premium
                            </Button>
                          </div>

                          {/* Writer Pro Plan */}
                          <div className="border border-primary rounded-lg p-6 bg-card relative">
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                                Most Popular
                              </span>
                            </div>
                            <div className="text-center mb-4">
                              <h4 className="font-semibold text-lg">Writer Pro</h4>
                              <p className="text-2xl font-bold">
                                $50<span className="text-sm text-muted-foreground">/month</span>
                              </p>
                            </div>
                            <ul className="text-sm space-y-2 mb-6">
                              <li>• Everything in Premium</li>
                              <li>• Direct industry access</li>
                              <li>• Marketing tools</li>
                              <li>• Pitch deck assistance</li>
                              <li>• Agent matching</li>
                              <li>• Exclusive events</li>
                            </ul>
                            <Button className="w-full">Get Pro Access</Button>
                          </div>

                          {/* Industry Professional Plans */}
                          <div className="border border-literary-border rounded-lg p-6 bg-card">
                            <div className="text-center mb-4">
                              <h4 className="font-semibold text-lg">Industry Access</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                For Agents, Producers, Publishers
                              </p>
                              <p className="text-lg font-bold">
                                Starting at $200
                                <span className="text-sm text-muted-foreground">/month</span>
                              </p>
                            </div>
                            <ul className="text-sm space-y-2 mb-6">
                              <li>• Manuscript access</li>
                              <li>• Co-agent relationships</li>
                              <li>• Industry networking</li>
                              <li>• Deal tracking</li>
                              <li>• Custom agreements</li>
                            </ul>
                            <Button variant="outline" className="w-full">
                              Contact Sales
                            </Button>
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-4">
                            All plans include our <strong>literary agency representation</strong>{' '}
                            with industry-standard 15% commission on successful deals.
                          </p>
                          <Button
                            variant="link"
                            onClick={() => window.open('/legal/agency-terms', '_blank')}
                            className="text-sm"
                          >
                            Read Agency Terms & Submission Guidelines
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Active subscription */
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 border border-literary-border rounded-lg bg-gray-50 dark:bg-gray-900/20">
                          <div className="flex items-center space-x-3">
                            <Crown className="h-6 w-6 text-gray-700" />
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-400">
                                Premium Member
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-600">
                                {subscriptionData.planName} - ${subscriptionData.amount / 100}/
                                {subscriptionData.interval}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="border-gray-300 text-gray-800 bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:bg-gray-900/20"
                          >
                            {subscriptionData.status === 'active'
                              ? 'Active'
                              : subscriptionData.status === 'past_due'
                                ? 'Past Due'
                                : subscriptionData.status === 'canceled'
                                  ? 'Canceled'
                                  : subscriptionData.status}
                          </Badge>
                        </div>

                        <div className="grid gap-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Next billing date:
                            </span>
                            <span className="text-sm font-medium">
                              {subscriptionData.currentPeriodEnd
                                ? new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                          {subscriptionData.cancelAtPeriodEnd && (
                            <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20">
                              <AlertTriangle className="h-4 w-4 text-gray-700" />
                              <p className="text-sm text-gray-800 dark:text-gray-400">
                                Your subscription will cancel at the end of the current billing
                                period.
                              </p>
                            </div>
                          )}
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium">Manage Your Subscription</h4>
                          <p className="text-sm text-muted-foreground">
                            Use Stripe&apos;s secure portal to manage your subscription, update
                            payment methods, view billing history, and more.
                          </p>

                          <Button
                            variant="outline"
                            className="w-full flex items-center justify-center space-x-2"
                            onClick={async () => {
                              try {
                                setSaving(true)
                                const response = await fetch('/api/create-portal-session', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    customerId: currentUser?.profile?.stripe_customer_id,
                                    userEmail: currentUser?.email,
                                    userName: currentUser?.profile?.display_name,
                                  }),
                                })

                                if (!response.ok) {
                                  throw new Error('Failed to create portal session')
                                }

                                const { url } = await response.json()
                                window.open(url, '_blank')
                              } catch (error) {
                                console.error('Failed to create portal session:', error)
                                toast.error('Failed to open billing portal')
                              } finally {
                                setSaving(false)
                              }
                            }}
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <ExternalLink className="h-4 w-4" />
                                <span>Manage Subscription</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Settings */}
              <TabsContent value="notifications" className="space-y-6">
                <Card className="card-bg card-shadow border-literary-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5" />
                      <span>Notification Preferences</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={checked =>
                            setNotificationSettings(prev => ({
                              ...prev,
                              emailNotifications: checked,
                            }))
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive push notifications in browser
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={checked =>
                            setNotificationSettings(prev => ({
                              ...prev,
                              pushNotifications: checked,
                            }))
                          }
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">Activity Notifications</h4>

                        {[
                          {
                            key: 'newFollowers',
                            label: 'New Followers',
                            description: 'When someone follows you',
                          },
                          {
                            key: 'newMessages',
                            label: 'New Messages',
                            description: 'When you receive a message',
                          },
                          {
                            key: 'postLikes',
                            label: 'Post Likes',
                            description: 'When someone likes your post',
                          },
                          {
                            key: 'postComments',
                            label: 'Post Comments',
                            description: 'When someone comments on your post',
                          },
                          {
                            key: 'mentions',
                            label: 'Mentions',
                            description: 'When someone mentions you',
                          },
                          {
                            key: 'newsletter',
                            label: 'Newsletter',
                            description: 'Ottopen weekly newsletter',
                          },
                        ].map(item => (
                          <div key={item.key} className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label>{item.label}</Label>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <Switch
                              checked={
                                notificationSettings[
                                  item.key as keyof typeof notificationSettings
                                ] as boolean
                              }
                              onCheckedChange={checked =>
                                setNotificationSettings(prev => ({ ...prev, [item.key]: checked }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveNotifications}
                        disabled={saving}
                        className="flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Save Preferences</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy Settings */}
              <TabsContent value="privacy" className="space-y-6">
                <Card className="card-bg card-shadow border-literary-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Privacy & Security</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Privacy Notice */}
                    <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Your Privacy is Important
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            We&apos;ve enhanced privacy controls. All profiles are private by
                            default. You control who sees your information.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Profile Visibility</Label>
                        <Select
                          value={privacySettings.profileVisibility}
                          onValueChange={value =>
                            setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))
                          }
                          disabled={saving}
                        >
                          <SelectTrigger className="border-literary-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">
                              Public - Anyone can see your profile
                            </SelectItem>
                            <SelectItem value="followers_only">
                              Followers Only - Only followers can see your full profile
                            </SelectItem>
                            <SelectItem value="private">
                              Private - Only you can see your profile
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Controls who can view your profile page and writing works
                        </p>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="flex items-center space-x-2">
                            <span>Show in Author Directory</span>
                            <Badge variant="secondary" className="text-xs">
                              Opt-in
                            </Badge>
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Appear in public author listings and search results
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.showInDirectory}
                          onCheckedChange={checked =>
                            setPrivacySettings(prev => ({ ...prev, showInDirectory: checked }))
                          }
                        />
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Who Can Message You</Label>
                        <Select
                          value={privacySettings.allowMessagesFrom}
                          onValueChange={value =>
                            setPrivacySettings(prev => ({ ...prev, allowMessagesFrom: value }))
                          }
                          disabled={saving}
                        >
                          <SelectTrigger className="border-literary-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="everyone">Everyone</SelectItem>
                            <SelectItem value="followers">Followers Only</SelectItem>
                            <SelectItem value="no_one">No One</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Control who can send you direct messages
                        </p>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Hide Location</Label>
                          <p className="text-sm text-muted-foreground">
                            Don&apos;t display your location on your profile
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.hideLocation}
                          onCheckedChange={checked =>
                            setPrivacySettings(prev => ({ ...prev, hideLocation: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Show Email Address</Label>
                          <p className="text-sm text-muted-foreground">
                            Display your email on your public profile
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.showEmail}
                          onCheckedChange={checked =>
                            setPrivacySettings(prev => ({ ...prev, showEmail: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Show Followers List</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow others to see who follows you
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.showFollowers}
                          onCheckedChange={checked =>
                            setPrivacySettings(prev => ({ ...prev, showFollowers: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Searchable Profile</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow your profile to appear in search results
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.searchable}
                          onCheckedChange={checked =>
                            setPrivacySettings(prev => ({ ...prev, searchable: checked }))
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="p-4 border border-literary-border rounded-lg bg-muted/30">
                      <h4 className="font-medium mb-2 text-sm">Privacy Summary</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>
                          • Profile:{' '}
                          <span className="font-medium text-foreground">
                            {privacySettings.profileVisibility === 'public'
                              ? 'Public'
                              : privacySettings.profileVisibility === 'followers_only'
                                ? 'Followers Only'
                                : 'Private'}
                          </span>
                        </li>
                        <li>
                          • Directory:{' '}
                          <span className="font-medium text-foreground">
                            {privacySettings.showInDirectory ? 'Visible' : 'Hidden'}
                          </span>
                        </li>
                        <li>
                          • Messages:{' '}
                          <span className="font-medium text-foreground">
                            {privacySettings.allowMessagesFrom === 'everyone'
                              ? 'Everyone'
                              : privacySettings.allowMessagesFrom === 'followers'
                                ? 'Followers Only'
                                : 'Disabled'}
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSavePrivacy}
                        disabled={saving}
                        className="flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Save Settings</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appearance Settings */}
              <TabsContent value="appearance" className="space-y-6">
                <Card className="card-bg card-shadow border-literary-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Palette className="h-5 w-5" />
                      <span>Appearance Preferences</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <div className="grid grid-cols-3 gap-3">
                          <Button
                            variant={appearanceSettings.theme === 'light' ? 'default' : 'outline'}
                            className="h-20 flex-col space-y-2"
                            onClick={() =>
                              setAppearanceSettings(prev => ({ ...prev, theme: 'light' }))
                            }
                          >
                            <div className="w-8 h-8 bg-white border rounded"></div>
                            <span className="text-xs">Light</span>
                          </Button>
                          <Button
                            variant={appearanceSettings.theme === 'dark' ? 'default' : 'outline'}
                            className="h-20 flex-col space-y-2"
                            onClick={() =>
                              setAppearanceSettings(prev => ({ ...prev, theme: 'dark' }))
                            }
                          >
                            <div className="w-8 h-8 bg-gray-900 rounded"></div>
                            <span className="text-xs">Dark</span>
                          </Button>
                          <Button
                            variant={appearanceSettings.theme === 'system' ? 'default' : 'outline'}
                            className="h-20 flex-col space-y-2"
                            onClick={() =>
                              setAppearanceSettings(prev => ({ ...prev, theme: 'system' }))
                            }
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-900 rounded"></div>
                            <span className="text-xs">System</span>
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select
                          value={appearanceSettings.language}
                          onValueChange={value =>
                            setAppearanceSettings(prev => ({ ...prev, language: value }))
                          }
                        >
                          <SelectTrigger className="border-literary-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                            <SelectItem value="it">Italiano</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select
                          value={appearanceSettings.timezone}
                          onValueChange={value =>
                            setAppearanceSettings(prev => ({ ...prev, timezone: value }))
                          }
                        >
                          <SelectTrigger className="border-literary-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time (GMT-5)</SelectItem>
                            <SelectItem value="America/Los_Angeles">
                              Pacific Time (GMT-8)
                            </SelectItem>
                            <SelectItem value="Europe/Paris">
                              Central European Time (GMT+1)
                            </SelectItem>
                            <SelectItem value="Asia/Tokyo">Japan Time (GMT+9)</SelectItem>
                            <SelectItem value="Australia/Sydney">
                              Australian Eastern Time (GMT+10)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveAppearance}
                        disabled={saving}
                        className="flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Save Preferences</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Account Settings */}
              <TabsContent value="account" className="space-y-6">
                <Card className="card-bg card-shadow border-literary-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Key className="h-5 w-5" />
                      <span>Account Security</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Change Password</Label>
                        <div className="space-y-3">
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Current password"
                              value={passwordForm.currentPassword}
                              onChange={e => {
                                setPasswordForm(prev => ({
                                  ...prev,
                                  currentPassword: e.target.value,
                                }))
                                if (errors.currentPassword) {
                                  setErrors(prev => ({ ...prev, currentPassword: '' }))
                                }
                              }}
                              className={`border-literary-border pr-10 ${errors.currentPassword ? 'border-destructive' : ''}`}
                              disabled={saving}
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
                          {errors.currentPassword && (
                            <p className="text-sm text-destructive">{errors.currentPassword}</p>
                          )}

                          <Input
                            type="password"
                            placeholder="New password"
                            value={passwordForm.newPassword}
                            onChange={e => {
                              setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))
                              if (errors.newPassword) {
                                setErrors(prev => ({ ...prev, newPassword: '' }))
                              }
                            }}
                            className={`border-literary-border ${errors.newPassword ? 'border-destructive' : ''}`}
                            disabled={saving}
                          />
                          {errors.newPassword && (
                            <p className="text-sm text-destructive">{errors.newPassword}</p>
                          )}

                          <Input
                            type="password"
                            placeholder="Confirm new password"
                            value={passwordForm.confirmPassword}
                            onChange={e => {
                              setPasswordForm(prev => ({
                                ...prev,
                                confirmPassword: e.target.value,
                              }))
                              if (errors.confirmPassword) {
                                setErrors(prev => ({ ...prev, confirmPassword: '' }))
                              }
                            }}
                            className={`border-literary-border ${errors.confirmPassword ? 'border-destructive' : ''}`}
                            disabled={saving}
                          />
                          {errors.confirmPassword && (
                            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleChangePassword}
                            disabled={
                              saving ||
                              !passwordForm.currentPassword ||
                              !passwordForm.newPassword ||
                              !passwordForm.confirmPassword
                            }
                          >
                            {saving ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Updating...
                              </>
                            ) : (
                              'Update Password'
                            )}
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Two-Factor Authentication</Label>
                        <div className="flex items-center justify-between p-4 border border-literary-border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Authenticator App</p>
                              <p className="text-sm text-muted-foreground">Not enabled</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Enable
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Connected Devices</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 border border-literary-border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Chrome on MacOS</p>
                                <p className="text-xs text-muted-foreground">
                                  Last active: 2 minutes ago
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary">Current</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border border-literary-border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">iPhone Safari</p>
                                <p className="text-xs text-muted-foreground">
                                  Last active: 3 hours ago
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              Revoke
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Data & Privacy Card */}
                <Card className="card-bg card-shadow border-literary-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Download className="h-5 w-5" />
                      <span>Data & Privacy</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-literary-border rounded-lg">
                      <div>
                        <p className="font-medium">Download Your Data</p>
                        <p className="text-sm text-muted-foreground">
                          Get a copy of all your Ottopen data (GDPR compliant)
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportData}
                        disabled={saving}
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div>
                        <p className="font-medium text-destructive">Delete Account</p>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your
                              account and remove all your data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="delete-password">
                                Enter your password to confirm
                              </Label>
                              <Input
                                id="delete-password"
                                type="password"
                                placeholder="Your password"
                                value={deletePassword}
                                onChange={e => setDeletePassword(e.target.value)}
                                className="border-destructive/50"
                              />
                            </div>
                            <div className="p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                              <p className="text-sm text-destructive font-medium">
                                ⚠️ This will delete:
                              </p>
                              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                                <li>• All your written works and posts</li>
                                <li>• All comments and interactions</li>
                                <li>• Your profile and settings</li>
                                <li>• All messages and conversations</li>
                                <li>• Your subscription (if any)</li>
                              </ul>
                            </div>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeletePassword('')}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAccount}
                              disabled={deleting || !deletePassword}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleting ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Deleting...
                                </>
                              ) : (
                                'Delete My Account'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}
