import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { Progress } from '../components/ui/progress'
import { toast } from 'sonner'
import { 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Send,
  Eye,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Calendar,
  TrendingUp
} from 'lucide-react'

interface EmailCampaign {
  id: string
  name: string
  subject: string
  content: string
  status: 'draft' | 'scheduled' | 'sent' | 'paused'
  sent_at: string | null
  recipients_count: number
  opens_count: number
  clicks_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

interface CampaignFormData {
  name: string
  subject: string
  content: string
  status: 'draft' | 'scheduled' | 'sent' | 'paused'
  recipients_count: number
}

const CAMPAIGN_STATUSES = [
  { key: 'draft', label: 'Draft', color: 'bg-gray-500', icon: Edit },
  { key: 'scheduled', label: 'Scheduled', color: 'bg-blue-500', icon: Clock },
  { key: 'sent', label: 'Sent', color: 'bg-green-500', icon: CheckCircle },
  { key: 'paused', label: 'Paused', color: 'bg-yellow-500', icon: PauseCircle },
]

const EMAIL_TEMPLATES = [
  {
    name: 'Welcome Email',
    subject: 'Welcome to our platform!',
    content: `<h1>Welcome!</h1>
<p>Thank you for joining our platform. We're excited to have you on board.</p>
<p>Get started by:</p>
<ul>
  <li>Completing your profile</li>
  <li>Exploring our features</li>
  <li>Connecting with other users</li>
</ul>
<p>If you have any questions, don't hesitate to reach out to our support team.</p>
<p>Best regards,<br>The Team</p>`
  },
  {
    name: 'Newsletter',
    subject: 'Monthly Newsletter - {{month}} {{year}}',
    content: `<h1>Monthly Newsletter</h1>
<p>Here's what's new this month:</p>
<h2>Product Updates</h2>
<p>We've released several new features to improve your experience...</p>
<h2>Company News</h2>
<p>Check out what's happening behind the scenes...</p>
<h2>Upcoming Events</h2>
<p>Don't miss these upcoming events and webinars...</p>
<p>Stay connected,<br>The Team</p>`
  },
  {
    name: 'Product Announcement',
    subject: 'Introducing {{product_name}}',
    content: `<h1>Introducing {{product_name}}</h1>
<p>We're excited to announce the launch of our latest product: {{product_name}}!</p>
<p>Key features:</p>
<ul>
  <li>Feature 1</li>
  <li>Feature 2</li>
  <li>Feature 3</li>
</ul>
<p>Available now for all users.</p>
<p><a href="{{product_url}}">Learn More</a></p>
<p>Best regards,<br>The Team</p>`
  }
]

export const EmailCampaigns: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    subject: '',
    content: '',
    status: 'draft',
    recipients_count: 0
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Failed to fetch campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const campaignData = {
        ...formData,
        created_by: user.id,
        updated_at: new Date().toISOString()
      }

      if (editingCampaign) {
        const { error } = await supabase
          .from('email_campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id)

        if (error) throw error
        toast.success('Campaign updated successfully')
      } else {
        const { error } = await supabase
          .from('email_campaigns')
          .insert([campaignData])

        if (error) throw error
        toast.success('Campaign created successfully')
      }

      setIsDialogOpen(false)
      setEditingCampaign(null)
      resetForm()
      fetchCampaigns()
    } catch (error) {
      console.error('Error saving campaign:', error)
      toast.error('Failed to save campaign')
    }
  }

  const handleEdit = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign)
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content,
      status: campaign.status,
      recipients_count: campaign.recipients_count
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Campaign deleted successfully')
      fetchCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign')
    }
  }

  const handleSendCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to send this campaign?')) return

    try {
      const { error } = await supabase
        .from('email_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success('Campaign sent successfully')
      fetchCampaigns()
    } catch (error) {
      console.error('Error sending campaign:', error)
      toast.error('Failed to send campaign')
    }
  }

  const handleTemplateChange = (templateName: string) => {
    const template = EMAIL_TEMPLATES.find(t => t.name === templateName)
    if (template) {
      setFormData({
        ...formData,
        name: template.name,
        subject: template.subject,
        content: template.content
      })
    }
    setSelectedTemplate(templateName)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      content: '',
      status: 'draft',
      recipients_count: 0
    })
    setSelectedTemplate('')
  }

  const getStatusColor = (status: string) => {
    const statusConfig = CAMPAIGN_STATUSES.find(s => s.key === status)
    return statusConfig?.color || 'bg-gray-500'
  }

  const getStatusIcon = (status: string) => {
    const statusConfig = CAMPAIGN_STATUSES.find(s => s.key === status)
    const Icon = statusConfig?.icon || Edit
    return <Icon className="h-4 w-4" />
  }

  const calculateOpenRate = (campaign: EmailCampaign) => {
    if (campaign.recipients_count === 0) return 0
    return Math.round((campaign.opens_count / campaign.recipients_count) * 100)
  }

  const calculateClickRate = (campaign: EmailCampaign) => {
    if (campaign.recipients_count === 0) return 0
    return Math.round((campaign.clicks_count / campaign.recipients_count) * 100)
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalStats = {
    totalCampaigns: campaigns.length,
    totalSent: campaigns.filter(c => c.status === 'sent').length,
    totalRecipients: campaigns.reduce((sum, c) => sum + c.recipients_count, 0),
    totalOpens: campaigns.reduce((sum, c) => sum + c.opens_count, 0),
    totalClicks: campaigns.reduce((sum, c) => sum + c.clicks_count, 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="text-gray-600 mt-1">Create and manage email marketing campaigns</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingCampaign(null) }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="template">Template</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blank">Blank Template</SelectItem>
                      {EMAIL_TEMPLATES.map(template => (
                        <SelectItem key={template.name} value={template.name}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Email Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="Enter your email content here. You can use HTML tags for formatting."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_STATUSES.map(status => (
                        <SelectItem key={status.key} value={status.key}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="recipients_count">Recipients Count</Label>
                  <Input
                    id="recipients_count"
                    type="number"
                    value={formData.recipients_count}
                    onChange={(e) => setFormData({ ...formData, recipients_count: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCampaign ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold">{totalStats.totalCampaigns}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sent</p>
                <p className="text-2xl font-bold">{totalStats.totalSent}</p>
              </div>
              <Send className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recipients</p>
                <p className="text-2xl font-bold">{totalStats.totalRecipients.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Opens</p>
                <p className="text-2xl font-bold">{totalStats.totalOpens.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clicks</p>
                <p className="text-2xl font-bold">{totalStats.totalClicks.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {CAMPAIGN_STATUSES.map(status => (
                    <SelectItem key={status.key} value={status.key}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(campaign.status)}
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(campaign.status)} text-white border-transparent text-xs`}
                    >
                      {campaign.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2 mb-1">
                    {campaign.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {campaign.subject}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(campaign)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {campaign.status === 'draft' && (
                      <DropdownMenuItem onClick={() => handleSendCampaign(campaign.id)}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Now
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleDelete(campaign.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Recipients</p>
                  <p className="text-lg font-semibold">{campaign.recipients_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Opens</p>
                  <p className="text-lg font-semibold">{campaign.opens_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Clicks</p>
                  <p className="text-lg font-semibold">{campaign.clicks_count}</p>
                </div>
              </div>
              
              {campaign.status === 'sent' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Open Rate</span>
                    <span>{calculateOpenRate(campaign)}%</span>
                  </div>
                  <Progress value={calculateOpenRate(campaign)} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Click Rate</span>
                    <span>{calculateClickRate(campaign)}%</span>
                  </div>
                  <Progress value={calculateClickRate(campaign)} className="h-2" />
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(campaign.created_at).toLocaleDateString()}
                </div>
                {campaign.sent_at && (
                  <div className="flex items-center gap-1">
                    <Send className="h-4 w-4" />
                    {new Date(campaign.sent_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No campaigns found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first email campaign to get started'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}