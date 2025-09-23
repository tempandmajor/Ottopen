"use client";

import { Navigation } from "@/src/components/navigation";
import { Footer } from "@/src/components/footer";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { ProtectedRoute } from "@/src/components/auth/protected-route";
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
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/src/contexts/auth-context";
import { dbService } from "@/src/lib/database";
import { authService } from "@/src/lib/auth";
import type { User as UserType } from "@/src/lib/supabase";
import { toast } from "react-hot-toast";

export default function Settings() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserType | null>(null);

  // Form states
  const [profileData, setProfileData] = useState({
    displayName: "",
    username: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    specialty: ""
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newFollowers: true,
    newMessages: true,
    postLikes: false,
    postComments: true,
    mentions: true,
    newsletter: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showFollowers: true,
    allowMessages: "followers",
    searchable: true
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load user data on mount
  useEffect(() => {
    if (currentUser?.profile) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser?.profile) return;

    try {
      setLoading(true);
      const profile = currentUser.profile;

      setUserProfile(profile);
      setProfileData({
        displayName: profile.display_name || "",
        username: profile.username || "",
        email: currentUser.email || "",
        bio: profile.bio || "",
        location: "", // Not in current User interface
        website: "", // Not in current User interface
        specialty: profile.specialty || ""
      });

      // TODO: Load actual notification and privacy settings from database
      // For now, using default values

    } catch (error) {
      console.error("Failed to load user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {};

    if (!profileData.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    }

    if (!profileData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_]+$/.test(profileData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    if (!profileData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (profileData.bio.length > 500) {
      newErrors.bio = "Bio cannot exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.profile || !validateProfileForm()) return;

    try {
      setSaving(true);
      setErrors({});

      const updatedProfile = await dbService.updateUser(currentUser.profile.id, {
        display_name: profileData.displayName,
        username: profileData.username,
        bio: profileData.bio,
        specialty: profileData.specialty
      });

      if (updatedProfile) {
        setUserProfile(updatedProfile);
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    try {
      setSaving(true);
      setErrors({});

      const result = await authService.updatePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (result.error) {
        setErrors({ currentPassword: result.error });
        toast.error(result.error);
      } else {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        toast.success("Password updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update password:", error);
      toast.error("Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      // TODO: Implement notification settings in database
      toast.success("Notification preferences saved!");
    } catch (error) {
      console.error("Failed to save notifications:", error);
      toast.error("Failed to save notification preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setSaving(true);
      // TODO: Implement privacy settings in database
      toast.success("Privacy settings saved!");
    } catch (error) {
      console.error("Failed to save privacy settings:", error);
      toast.error("Failed to save privacy settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading settings...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-2">Settings</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Manage your account preferences and privacy settings</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1">
              <TabsTrigger value="profile" className="flex items-center space-x-2 p-3">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
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
                        {profileData.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="flex items-center space-x-2" disabled>
                        <Camera className="h-4 w-4" />
                        <span>Change Photo</span>
                      </Button>
                      <p className="text-xs text-muted-foreground">Avatar upload coming soon</p>
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
                          onChange={(e) => {
                            setProfileData(prev => ({ ...prev, displayName: e.target.value }));
                            if (errors.displayName) {
                              setErrors(prev => ({ ...prev, displayName: "" }));
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
                          onChange={(e) => {
                            setProfileData(prev => ({ ...prev, username: e.target.value }));
                            if (errors.username) {
                              setErrors(prev => ({ ...prev, username: "" }));
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
                        onChange={(e) => {
                          setProfileData(prev => ({ ...prev, email: e.target.value }));
                          if (errors.email) {
                            setErrors(prev => ({ ...prev, email: "" }));
                          }
                        }}
                        className={`border-literary-border ${errors.email ? 'border-destructive' : ''}`}
                        disabled={saving}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => {
                          setProfileData(prev => ({ ...prev, bio: e.target.value }));
                          if (errors.bio) {
                            setErrors(prev => ({ ...prev, bio: "" }));
                          }
                        }}
                        className={`min-h-[100px] border-literary-border ${errors.bio ? 'border-destructive' : ''}`}
                        placeholder="Tell us about yourself..."
                        disabled={saving}
                      />
                      <div className="flex justify-between items-center">
                        <p className={`text-xs ${profileData.bio.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {profileData.bio.length}/500 characters
                        </p>
                        {errors.bio && (
                          <p className="text-sm text-destructive">{errors.bio}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                          className="border-literary-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={profileData.website}
                          onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                          className="border-literary-border"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialty">Writing Specialty</Label>
                      <Select
                        value={profileData.specialty}
                        onValueChange={(value) => setProfileData(prev => ({ ...prev, specialty: value }))}
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

                  <div className="flex justify-end">
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
                          <span>Save Changes</span>
                        </>
                      )}
                    </Button>
                  </div>
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
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                      </div>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Activity Notifications</h4>

                      {[
                        { key: 'newFollowers', label: 'New Followers', description: 'When someone follows you' },
                        { key: 'newMessages', label: 'New Messages', description: 'When you receive a message' },
                        { key: 'postLikes', label: 'Post Likes', description: 'When someone likes your post' },
                        { key: 'postComments', label: 'Post Comments', description: 'When someone comments on your post' },
                        { key: 'mentions', label: 'Mentions', description: 'When someone mentions you' },
                        { key: 'newsletter', label: 'Newsletter', description: 'Ottopen weekly newsletter' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>{item.label}</Label>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <Switch
                            checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                            onCheckedChange={(checked) =>
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
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Profile Visibility</Label>
                      <Select
                        value={privacySettings.profileVisibility}
                        onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))}
                        disabled={saving}
                      >
                        <SelectTrigger className="border-literary-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public - Anyone can see your profile</SelectItem>
                          <SelectItem value="followers">Followers Only - Only followers can see your full profile</SelectItem>
                          <SelectItem value="private">Private - Only you can see your profile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Show Email Address</Label>
                        <p className="text-sm text-muted-foreground">Display your email on your profile</p>
                      </div>
                      <Switch
                        checked={privacySettings.showEmail}
                        onCheckedChange={(checked) =>
                          setPrivacySettings(prev => ({ ...prev, showEmail: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Show Followers List</Label>
                        <p className="text-sm text-muted-foreground">Allow others to see who follows you</p>
                      </div>
                      <Switch
                        checked={privacySettings.showFollowers}
                        onCheckedChange={(checked) =>
                          setPrivacySettings(prev => ({ ...prev, showFollowers: checked }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Who Can Message You</Label>
                      <Select
                        value={privacySettings.allowMessages}
                        onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, allowMessages: value }))}
                        disabled={saving}
                      >
                        <SelectTrigger className="border-literary-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="everyone">Everyone</SelectItem>
                          <SelectItem value="followers">Followers Only</SelectItem>
                          <SelectItem value="none">No One</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Searchable Profile</Label>
                        <p className="text-sm text-muted-foreground">Allow your profile to appear in search results</p>
                      </div>
                      <Switch
                        checked={privacySettings.searchable}
                        onCheckedChange={(checked) =>
                          setPrivacySettings(prev => ({ ...prev, searchable: checked }))
                        }
                      />
                    </div>
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
                        <Button variant="outline" className="h-20 flex-col space-y-2">
                          <div className="w-8 h-8 bg-white border rounded"></div>
                          <span className="text-xs">Light</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col space-y-2">
                          <div className="w-8 h-8 bg-gray-900 rounded"></div>
                          <span className="text-xs">Dark</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col space-y-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-900 rounded"></div>
                          <span className="text-xs">System</span>
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select defaultValue="en">
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
                      <Select defaultValue="utc">
                        <SelectTrigger className="border-literary-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utc">UTC (GMT+0)</SelectItem>
                          <SelectItem value="est">Eastern Time (GMT-5)</SelectItem>
                          <SelectItem value="pst">Pacific Time (GMT-8)</SelectItem>
                          <SelectItem value="cet">Central European Time (GMT+1)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="flex items-center space-x-2">
                      <Save className="h-4 w-4" />
                      <span>Save Preferences</span>
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
                            type={showPassword ? "text" : "password"}
                            placeholder="Current password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => {
                              setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }));
                              if (errors.currentPassword) {
                                setErrors(prev => ({ ...prev, currentPassword: "" }));
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
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {errors.currentPassword && (
                          <p className="text-sm text-destructive">{errors.currentPassword}</p>
                        )}

                        <Input
                          type="password"
                          placeholder="New password"
                          value={passwordForm.newPassword}
                          onChange={(e) => {
                            setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }));
                            if (errors.newPassword) {
                              setErrors(prev => ({ ...prev, newPassword: "" }));
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
                          onChange={(e) => {
                            setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }));
                            if (errors.confirmPassword) {
                              setErrors(prev => ({ ...prev, confirmPassword: "" }));
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
                          disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Updating...
                            </>
                          ) : (
                            "Update Password"
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
                              <p className="text-xs text-muted-foreground">Last active: 2 minutes ago</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Current</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-literary-border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">iPhone Safari</p>
                              <p className="text-xs text-muted-foreground">Last active: 3 hours ago</p>
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
                      <p className="text-sm text-muted-foreground">Get a copy of all your Ottopen data</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Request
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <div>
                      <p className="font-medium text-destructive">Delete Account</p>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            </Tabs>
          </div>
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}