'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Textarea } from '@/src/components/ui/textarea'
import { Shield, Flag, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import type { User } from '@/src/lib/supabase'

interface PostReport {
  id: string
  post_id: string
  reporter_id: string
  reason: string
  description: string
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed'
  reviewed_by: string | null
  reviewed_at: string | null
  action_taken: string | null
  admin_notes: string | null
  created_at: string
  post: {
    id: string
    content: string
    user_id: string
    created_at: string
  }
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

interface AdminDashboardViewProps {
  user: (User & { profile?: any }) | null
}

export default function AdminDashboardView({ user }: AdminDashboardViewProps) {
  const [reports, setReports] = useState<PostReport[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [selectedReport, setSelectedReport] = useState<PostReport | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadReports()
  }, [statusFilter])

  const loadReports = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/reports?status=${statusFilter}`)

      if (response.status === 403) {
        toast.error('Access denied. Admin privileges required.')
        return
      }

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      } else {
        toast.error('Failed to load reports')
      }
    } catch (error) {
      console.error('Failed to load reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReport = async (reportId: string, status: string, action_taken?: string) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          status,
          action_taken,
          admin_notes: adminNotes || null,
        }),
      })

      if (response.ok) {
        toast.success('Report updated successfully')
        loadReports()
        setSelectedReport(null)
        setAdminNotes('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update report')
      }
    } catch (error) {
      console.error('Failed to update report:', error)
      toast.error('Failed to update report')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeletePost = async (postId: string, reportId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Post deleted')
        await handleUpdateReport(reportId, 'actioned', 'deleted')
      } else {
        toast.error('Failed to delete post')
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      toast.error('Failed to delete post')
    }
  }

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-yellow-100 text-yellow-800',
      harassment: 'bg-red-100 text-red-800',
      inappropriate: 'bg-orange-100 text-orange-800',
      misinformation: 'bg-purple-100 text-purple-800',
      copyright: 'bg-gray-100 text-gray-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[reason] || colors.other
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage content reports and moderation</p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                {['pending', 'reviewed', 'actioned', 'dismissed', 'all'].map(status => (
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
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">Loading reports...</CardContent>
              </Card>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No {statusFilter !== 'all' ? statusFilter : ''} reports found
                </CardContent>
              </Card>
            ) : (
              reports.map(report => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Flag className="h-4 w-4 text-red-500" />
                        <CardTitle className="text-lg">Report #{report.id.slice(0, 8)}</CardTitle>
                        <Badge className={getReasonBadge(report.reason)}>{report.reason}</Badge>
                      </div>
                      <Badge
                        variant={
                          report.status === 'pending'
                            ? 'default'
                            : report.status === 'actioned'
                              ? 'default'
                              : 'outline'
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Reported by {report.reporter.display_name} on{' '}
                      {new Date(report.created_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Report Details */}
                    <div>
                      <p className="text-sm font-medium mb-1">Description:</p>
                      <p className="text-sm text-muted-foreground">
                        {report.description || 'No description provided'}
                      </p>
                    </div>

                    {/* Reported Post */}
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-2">Reported Post:</p>
                      <p className="text-sm whitespace-pre-wrap">{report.post.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Posted on {new Date(report.post.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Admin Actions */}
                    {selectedReport?.id === report.id ? (
                      <div className="space-y-4 border-t pt-4">
                        <div>
                          <label className="text-sm font-medium">Admin Notes</label>
                          <Textarea
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            placeholder="Add notes about this report..."
                            rows={3}
                            className="mt-2"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePost(report.post_id, report.id)}
                            disabled={processing}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Delete Post
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateReport(report.id, 'dismissed')}
                            disabled={processing}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Dismiss Report
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateReport(report.id, 'reviewed', 'no_action')}
                            disabled={processing}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Reviewed
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {report.status === 'pending' && (
                          <Button size="sm" onClick={() => setSelectedReport(report)}>
                            Review Report
                          </Button>
                        )}
                        {report.reviewed_at && (
                          <div className="text-sm text-muted-foreground mt-2">
                            Reviewed by {report.reviewer?.display_name || 'Unknown'} on{' '}
                            {new Date(report.reviewed_at).toLocaleString()}
                            {report.admin_notes && (
                              <p className="mt-1">Notes: {report.admin_notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
