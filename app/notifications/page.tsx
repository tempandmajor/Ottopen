import { requireAuth } from '@/lib/server/auth'
import { Navigation } from '@/src/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react'

export default async function NotificationsPage() {
  const user = await requireAuth()

  // TODO: Fetch actual notifications from database
  const notifications: any[] = []

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold mb-2 flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notifications
            </h1>
            <p className="text-muted-foreground">Stay updated with your latest activities</p>
          </div>

          {notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground">
                When you receive notifications, they&apos;ll appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {notification.type === 'success' && (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        )}
                        {notification.type === 'error' && (
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        )}
                        {notification.type === 'info' && <Info className="h-6 w-6 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
