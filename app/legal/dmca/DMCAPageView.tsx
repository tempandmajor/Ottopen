'use client'
import { Navigation } from '@/src/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { Scale, FileText, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import type { User } from '@/src/lib/supabase'

interface DMCANotice {
  id: string
  complainant_name: string
  complainant_email: string
  content_type: string
  content_id: string
  content_url: string
  status: string
  created_at: string
  copyrighted_work_description: string
  infringement_description: string
}

interface DMCAPageViewProps {
  user: (User & { profile?: any }) | null
}

export default function DMCAPageView({ user }: DMCAPageViewProps) {
  const [notices, setNotices] = useState<DMCANotice[]>([])
  const [loading, setLoading] = useState(true)
  const [showNoticeDialog, setShowNoticeDialog] = useState(false)
  const [showCounterDialog, setShowCounterDialog] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<DMCANotice | null>(null)
  const [noticeForm, setNoticeForm] = useState({
    complainantName: '',
    complainantEmail: '',
    complainantAddress: '',
    complainantPhone: '',
    contentType: 'manuscript',
    contentId: '',
    contentUrl: '',
    copyrightedWorkDescription: '',
    originalWorkLocation: '',
    infringementDescription: '',
    goodFaithStatement: '',
    accuracyStatement: '',
    signature: '',
    signatureDate: new Date().toISOString().split('T')[0],
  })

  const [counterForm, setCounterForm] = useState({
    userName: '',
    userEmail: '',
    userAddress: '',
    userPhone: '',
    goodFaithStatement: '',
    consentToJurisdiction: '',
    accuracyStatement: '',
    signature: '',
    signatureDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadNotices()
  }, [])

  const loadNotices = async () => {
    try {
      const response = await fetch('/api/legal/dmca/notice')
      if (response.ok) {
        const data = await response.json()
        setNotices(data.notices || [])
      }
    } catch (error) {
      console.error('Failed to load DMCA notices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitNotice = async () => {
    try {
      const response = await fetch('/api/legal/dmca/notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeForm),
      })

      if (response.ok) {
        toast.success('DMCA notice submitted successfully')
        setShowNoticeDialog(false)
        loadNotices()
        setNoticeForm({
          complainantName: '',
          complainantEmail: '',
          complainantAddress: '',
          complainantPhone: '',
          contentType: 'manuscript',
          contentId: '',
          contentUrl: '',
          copyrightedWorkDescription: '',
          originalWorkLocation: '',
          infringementDescription: '',
          goodFaithStatement: '',
          accuracyStatement: '',
          signature: '',
          signatureDate: new Date().toISOString().split('T')[0],
        })
      } else {
        toast.error('Failed to submit notice')
      }
    } catch (error) {
      toast.error('Failed to submit notice')
    }
  }

  const handleSubmitCounter = async () => {
    if (!selectedNotice) return

    try {
      const response = await fetch('/api/legal/dmca/counter-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...counterForm,
          dmcaNoticeId: selectedNotice.id,
        }),
      })

      if (response.ok) {
        toast.success('Counter notice submitted successfully')
        setShowCounterDialog(false)
        loadNotices()
        setCounterForm({
          userName: '',
          userEmail: '',
          userAddress: '',
          userPhone: '',
          goodFaithStatement: '',
          consentToJurisdiction: '',
          accuracyStatement: '',
          signature: '',
          signatureDate: new Date().toISOString().split('T')[0],
        })
      } else {
        toast.error('Failed to submit counter notice')
      }
    } catch (error) {
      toast.error('Failed to submit counter notice')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'destructive',
      rejected: 'outline',
      content_removed: 'destructive',
      counter_noticed: 'default',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Scale className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">DMCA Takedown</h1>
                <p className="text-muted-foreground">
                  File or respond to copyright infringement notices
                </p>
              </div>
            </div>

            <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
              <DialogTrigger asChild>
                <Button>File DMCA Notice</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>File DMCA Takedown Notice</DialogTitle>
                  <DialogDescription>
                    Report copyright infringement under the Digital Millennium Copyright Act
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Your Name *</Label>
                      <Input
                        value={noticeForm.complainantName}
                        onChange={e =>
                          setNoticeForm({ ...noticeForm, complainantName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Your Email *</Label>
                      <Input
                        type="email"
                        value={noticeForm.complainantEmail}
                        onChange={e =>
                          setNoticeForm({ ...noticeForm, complainantEmail: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Your Address *</Label>
                    <Input
                      value={noticeForm.complainantAddress}
                      onChange={e =>
                        setNoticeForm({ ...noticeForm, complainantAddress: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Content URL *</Label>
                    <Input
                      value={noticeForm.contentUrl}
                      onChange={e => setNoticeForm({ ...noticeForm, contentUrl: e.target.value })}
                      placeholder="URL of the infringing content"
                    />
                  </div>

                  <div>
                    <Label>Copyrighted Work Description *</Label>
                    <Textarea
                      value={noticeForm.copyrightedWorkDescription}
                      onChange={e =>
                        setNoticeForm({
                          ...noticeForm,
                          copyrightedWorkDescription: e.target.value,
                        })
                      }
                      placeholder="Describe your original copyrighted work"
                    />
                  </div>

                  <div>
                    <Label>Infringement Description *</Label>
                    <Textarea
                      value={noticeForm.infringementDescription}
                      onChange={e =>
                        setNoticeForm({
                          ...noticeForm,
                          infringementDescription: e.target.value,
                        })
                      }
                      placeholder="Describe how your work is being infringed"
                    />
                  </div>

                  <div>
                    <Label>Good Faith Statement *</Label>
                    <Textarea
                      value={noticeForm.goodFaithStatement}
                      onChange={e =>
                        setNoticeForm({ ...noticeForm, goodFaithStatement: e.target.value })
                      }
                      placeholder="I have a good faith belief that use of the copyrighted materials described above is not authorized..."
                    />
                  </div>

                  <div>
                    <Label>Accuracy Statement *</Label>
                    <Textarea
                      value={noticeForm.accuracyStatement}
                      onChange={e =>
                        setNoticeForm({ ...noticeForm, accuracyStatement: e.target.value })
                      }
                      placeholder="The information in this notification is accurate, and under penalty of perjury..."
                    />
                  </div>

                  <div>
                    <Label>Electronic Signature *</Label>
                    <Input
                      value={noticeForm.signature}
                      onChange={e => setNoticeForm({ ...noticeForm, signature: e.target.value })}
                      placeholder="Type your full name"
                    />
                  </div>

                  <Button onClick={handleSubmitNotice} className="w-full">
                    Submit DMCA Notice
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Info Card */}
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-900 dark:text-yellow-100">
                  Important Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
              <p>
                • Filing a false DMCA notice may result in legal liability for damages, including
                costs and attorney fees.
              </p>
              <p>
                • We will forward your notice to the alleged infringer, who may file a counter
                notice.
              </p>
              <p>• If a counter notice is filed, we may restore the content after 10-14 days.</p>
            </CardContent>
          </Card>

          {/* AI-Generated Content and Copyright */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Content and Copyright</CardTitle>
              <CardDescription>
                Important information about copyright concerns with AI-assisted content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Copyright Concerns with AI</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  AI-generated content may inadvertently reproduce copyrighted material from its
                  training data:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Copyrighted text from training data</li>
                  <li>Distinctive phrases or passages</li>
                  <li>Plot structures or character archetypes</li>
                  <li>Stylistic patterns from copyrighted works</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Your Responsibilities with AI Content</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  If you use AI-generated content on Ottopen:
                </p>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>
                    <strong>Review for originality</strong> - Check that AI hasn&apos;t reproduced
                    copyrighted material
                  </li>
                  <li>
                    <strong>Edit substantially</strong> - Transform AI suggestions into your unique
                    voice
                  </li>
                  <li>
                    <strong>Fact-check</strong> - Verify AI hasn&apos;t copied factual content
                    verbatim
                  </li>
                  <li>
                    <strong>Run plagiarism checks</strong> - Use tools like Turnitin or Copyscape
                    before publishing
                  </li>
                </ol>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Copyright Liability</h3>
                <ul className="text-sm space-y-1">
                  <li>
                    • <strong>You are responsible</strong> for ensuring your final work doesn&apos;t
                    infringe copyright
                  </li>
                  <li>
                    • We are not liable for copyright issues arising from AI-generated content
                  </li>
                  <li>• AI-assisted content is your responsibility to verify and edit</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">DMCA Takedown for AI Content</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  If you believe AI-generated content on our platform infringes your copyright:
                </p>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Follow the standard DMCA takedown process above</li>
                  <li>Note in your infringement description that the content is AI-generated</li>
                  <li>
                    Provide evidence of substantial similarity between your work and the
                    AI-generated content
                  </li>
                  <li>Include specific examples of copyrighted elements that were reproduced</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Notices List */}
          <Card>
            <CardHeader>
              <CardTitle>DMCA Notices</CardTitle>
              <CardDescription>View submitted copyright infringement notices</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8">Loading...</p>
              ) : notices.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No notices found</p>
              ) : (
                <div className="space-y-4">
                  {notices.map(notice => (
                    <Card key={notice.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <CardTitle className="text-base">
                              {notice.content_type} - {notice.complainant_name}
                            </CardTitle>
                          </div>
                          {getStatusBadge(notice.status)}
                        </div>
                        <CardDescription>
                          Filed {new Date(notice.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm">
                          <strong>Work:</strong> {notice.copyrighted_work_description}
                        </p>
                        <p className="text-sm">
                          <strong>Infringement:</strong> {notice.infringement_description}
                        </p>
                        {notice.status === 'approved' && (
                          <Button
                            onClick={() => {
                              setSelectedNotice(notice)
                              setShowCounterDialog(true)
                            }}
                            size="sm"
                            variant="outline"
                          >
                            File Counter Notice
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Counter Notice Dialog */}
          <Dialog open={showCounterDialog} onOpenChange={setShowCounterDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>File DMCA Counter Notice</DialogTitle>
                <DialogDescription>Respond to a copyright infringement notice</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Your Name *</Label>
                    <Input
                      value={counterForm.userName}
                      onChange={e => setCounterForm({ ...counterForm, userName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Your Email *</Label>
                    <Input
                      type="email"
                      value={counterForm.userEmail}
                      onChange={e => setCounterForm({ ...counterForm, userEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Your Address *</Label>
                  <Input
                    value={counterForm.userAddress}
                    onChange={e => setCounterForm({ ...counterForm, userAddress: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Good Faith Statement *</Label>
                  <Textarea
                    value={counterForm.goodFaithStatement}
                    onChange={e =>
                      setCounterForm({ ...counterForm, goodFaithStatement: e.target.value })
                    }
                    placeholder="I have a good faith belief that the material was removed or disabled as a result of mistake..."
                  />
                </div>

                <div>
                  <Label>Consent to Jurisdiction *</Label>
                  <Textarea
                    value={counterForm.consentToJurisdiction}
                    onChange={e =>
                      setCounterForm({ ...counterForm, consentToJurisdiction: e.target.value })
                    }
                    placeholder="I consent to the jurisdiction of Federal District Court..."
                  />
                </div>

                <div>
                  <Label>Accuracy Statement *</Label>
                  <Textarea
                    value={counterForm.accuracyStatement}
                    onChange={e =>
                      setCounterForm({ ...counterForm, accuracyStatement: e.target.value })
                    }
                    placeholder="The information in this counter notice is accurate, and under penalty of perjury..."
                  />
                </div>

                <div>
                  <Label>Electronic Signature *</Label>
                  <Input
                    value={counterForm.signature}
                    onChange={e => setCounterForm({ ...counterForm, signature: e.target.value })}
                    placeholder="Type your full name"
                  />
                </div>

                <Button onClick={handleSubmitCounter} className="w-full">
                  Submit Counter Notice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
