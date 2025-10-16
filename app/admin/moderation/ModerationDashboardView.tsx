'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Textarea } from '@/src/components/ui/textarea'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { Shield, Flag, Ban, Volume2, AlertTriangle, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import type { User } from '@/src/lib/supabase'

interface ContentReport {
  id: string
  reporter_id: string
  club_id: string | null
  content_type: string
  content_id: string
  reason: string
  details: string
  status: string
  reviewed_by: string | null
  reviewed_at: string | null
  resolution_notes: string | null
  created_at: string
  reporter: {
    id: string
    display_name: string
    email: string
  }
  reviewer: {
    id: string
    display_name: string
  } | null
}

interface ModerationAction {
  id: string
  user_id: string
  club_id: string | null
  moderator_id: string
  action_type: string
  reason: string
  duration_minutes: number | null
  expires_at: string | null
  created_at: string
  revoked_at: string | null
  user_name: string
  moderator_name: string
  is_active: boolean
}

interface ModerationDashboardProps {
  user: (User & { profile?: any }) | null
}

export default function ModerationDashboard({ user }: ModerationDashboardProps) {
  const [reports, setReports] = useState<ContentReport[]>([])
  const [actions, setActions] = useState<ModerationAction[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionForm, setActionForm] = useState({
    userId: '',
    actionType: 'warning',
    reason: '',
    durationMinutes: 0,
  })

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [reportsRes, actionsRes] = await Promise.all([
        fetch(`/api/admin/moderation/reports?status=${statusFilter}`),
        fetch('/api/admin/moderation/actions'),
      ])

      if (reportsRes.ok) {
        const data = await reportsRes.json()
        setReports(data.reports || [])
      }

      if (actionsRes.ok) {
        const data = await actionsRes.json()
        setActions(data.actions || [])
      }
    } catch (error) {
      console.error('Failed to load moderation data:', error)
      toast.error('Failed to load moderation data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReport = async (reportId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/moderation/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          status,
          resolution_notes: resolutionNotes || null,
        }),
      })

      if (response.ok) {
        toast.success('Report updated')
        loadData()
        setSelectedReport(null)
        setResolutionNotes('')
      } else {
        toast.error('Failed to update report')
      }
    } catch (error) {
      toast.error('Failed to update report')
    }
  }

  const handleCreateAction = async () => {
    try {
      const response = await fetch('/api/admin/moderation/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: actionForm.userId,
          actionType: actionForm.actionType,
          reason: actionForm.reason,
          durationMinutes: actionForm.durationMinutes || null,
        }),
      })

      if (response.ok) {
        toast.success('Moderation action created')
        setShowActionDialog(false)
        setActionForm({ userId: '', actionType: 'warning', reason: '', durationMinutes: 0 })
        loadData()
      } else {
        toast.error('Failed to create action')
      }
    } catch (error) {
      toast.error('Failed to create action')
    }
  }

  const handleRevokeAction = async (actionId: string) => {
    try {
      const response = await fetch('/api/admin/moderation/actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId }),
      })

      if (response.ok) {
        toast.success('Action revoked')
        loadData()
      } else {
        toast.error('Failed to revoke action')
      }
    } catch (error) {
      toast.error('Failed to revoke action')
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'ban':
        return <Ban className="h-4 w-4" />
      case 'mute':
        return <Volume2 className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'timeout':
        return <Clock className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
                <p className="text-muted-foreground">Manage content reports and user actions</p>
              </div>
            </div>

            <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
              <DialogTrigger asChild>
                <Button>New Moderation Action</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Moderation Action</DialogTitle>
                  <DialogDescription>Apply moderation action to a user</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>User ID</Label>
                    <Input
                      value={actionForm.userId}
                      onChange={e => setActionForm({ ...actionForm, userId: e.target.value })}
                      placeholder="Enter user ID"
                    />
                  </div>
                  <div>
                    <Label>Action Type</Label>
                    <Select
                      value={actionForm.actionType}
                      onValueChange={value => setActionForm({ ...actionForm, actionType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="mute">Mute</SelectItem>
                        <SelectItem value="timeout">Timeout</SelectItem>
                        <SelectItem value="ban">Ban</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <Textarea
                      value={actionForm.reason}
                      onChange={e => setActionForm({ ...actionForm, reason: e.target.value })}
                      placeholder="Reason for action..."
                    />
                  </div>
                  {['mute', 'timeout'].includes(actionForm.actionType) && (
                    <div>
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={actionForm.durationMinutes}
                        onChange={e =>
                          setActionForm({
                            ...actionForm,
                            durationMinutes: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  )}
                  <Button onClick={handleCreateAction} className="w-full">
                    Create Action
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Reports</CardDescription>
                <CardTitle className="text-3xl">
                  {reports.filter(r => r.status === 'pending').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Actions</CardDescription>
                <CardTitle className="text-3xl">
                  {actions.filter(a => a.is_active).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Resolved Today</CardDescription>
                <CardTitle className="text-3xl">
                  {
                    reports.filter(
                      r =>
                        r.status === 'resolved' &&
                        new Date(r.reviewed_at || '').toDateString() === new Date().toDateString()
                    ).length
                  }
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Bans</CardDescription>
                <CardTitle className="text-3xl">
                  {actions.filter(a => a.action_type === 'ban' && a.is_active).length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Reports Section */}
          <Card>
            <CardHeader>
              <CardTitle>Content Reports</CardTitle>
              <div className="flex space-x-2 mt-4">
                {['pending', 'reviewing', 'resolved', 'dismissed', 'all'].map(status => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(status)}
                    size="sm"
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8">Loading...</p>
              ) : reports.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No reports found</p>
              ) : (
                <div className="space-y-4">
                  {reports.map(report => (
                    <Card key={report.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Flag className="h-4 w-4" />
                            <CardTitle className="text-base">
                              {report.content_type} - {report.reason}
                            </CardTitle>
                          </div>
                          <Badge>{report.status}</Badge>
                        </div>
                        <CardDescription>
                          Reported by {report.reporter.display_name} •{' '}
                          {new Date(report.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-4">{report.details}</p>
                        {selectedReport?.id === report.id ? (
                          <div className="space-y-4 border-t pt-4">
                            <div>
                              <Label>Resolution Notes</Label>
                              <Textarea
                                value={resolutionNotes}
                                onChange={e => setResolutionNotes(e.target.value)}
                                placeholder="Add resolution notes..."
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleUpdateReport(report.id, 'resolved')}
                                size="sm"
                              >
                                Resolve
                              </Button>
                              <Button
                                onClick={() => handleUpdateReport(report.id, 'dismissed')}
                                variant="outline"
                                size="sm"
                              >
                                Dismiss
                              </Button>
                              <Button
                                onClick={() => setSelectedReport(null)}
                                variant="ghost"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          report.status === 'pending' && (
                            <Button onClick={() => setSelectedReport(report)} size="sm">
                              Review
                            </Button>
                          )
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Active Moderation Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {actions.filter(a => a.is_active).length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No active actions</p>
              ) : (
                <div className="space-y-4">
                  {actions
                    .filter(a => a.is_active)
                    .map(action => (
                      <Card key={action.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getActionIcon(action.action_type)}
                              <CardTitle className="text-base">
                                {action.action_type.toUpperCase()} - {action.user_name}
                              </CardTitle>
                            </div>
                            <Button
                              onClick={() => handleRevokeAction(action.id)}
                              variant="outline"
                              size="sm"
                            >
                              Revoke
                            </Button>
                          </div>
                          <CardDescription>
                            By {action.moderator_name} •{' '}
                            {new Date(action.created_at).toLocaleDateString()}
                            {action.expires_at &&
                              ` • Expires ${new Date(action.expires_at).toLocaleDateString()}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{action.reason}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
