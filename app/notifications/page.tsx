import { Navigation } from '@/src/components/navigation'

import { requireAuth } from '@/lib/server/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Bell, CheckCircle, AlertCircle, Info, Mail } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'

export default async function NotificationsPage() {
  const user = await requireAuth()

  // TODO: Fetch actual notifications from database
  // For now, showing placeholder UI
  const notifications: any[] = []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold mb-2 flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notifications
            </h1>
            <p className="text-muted-foreground">
              Stay updated with activity on your manuscripts and community interactions
            </p>
          </div>

          {/* Notifications List */}
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification: any) => (
                <Card key={notification.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {notification.type === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {notification.type === 'warning' && (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        )}
                        {notification.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                        {notification.type === 'message' && (
                          <Mail className="h-5 w-5 text-purple-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold">{notification.title}</h3>
                          {!notification.read && (
                            <Badge variant="default" className="flex-shrink-0">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground">
                You&apos;ll see notifications here when there&apos;s activity on your manuscripts,
                comments, or community interactions.
              </p>
            </Card>
          )}

          {/* Notification Settings */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Notification settings will be available soon. You&apos;ll be able to customize which
                notifications you receive via email and in-app.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
