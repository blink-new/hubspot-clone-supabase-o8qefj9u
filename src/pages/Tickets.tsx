import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { toast } from 'sonner'
import { 
  Ticket, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react'

interface TicketType {
  id: string
  title: string
  description: string | null
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string | null
  contact_id: string | null
  assigned_to: string | null
  created_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  contacts?: {
    first_name: string
    last_name: string
    email: string
  }
}

interface TicketFormData {
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  contact_id: string
  assigned_to: string
}

const TICKET_STATUSES = [
  { key: 'open', label: 'Open', color: 'bg-blue-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { key: 'resolved', label: 'Resolved', color: 'bg-green-500' },
  { key: 'closed', label: 'Closed', color: 'bg-gray-500' },
]

const TICKET_PRIORITIES = [
  { key: 'low', label: 'Low', color: 'bg-green-500' },
  { key: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { key: 'high', label: 'High', color: 'bg-orange-500' },
  { key: 'urgent', label: 'Urgent', color: 'bg-red-500' },
]

const TICKET_CATEGORIES = [
  'Technical Support',
  'Billing',
  'Feature Request',
  'Bug Report',
  'General Inquiry',
  'Account Issues',
  'Product Question',
  'Other'
]

export const Tickets: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null)
  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    category: '',
    contact_id: '',
    assigned_to: ''
  })

  useEffect(() => {
    fetchTickets()
    fetchContacts()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          contacts (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .order('first_name', { ascending: true })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const ticketData = {
        ...formData,
        contact_id: formData.contact_id === 'none' ? null : formData.contact_id || null,
        assigned_to: formData.assigned_to === 'none' ? null : formData.assigned_to || null,
        created_by: user.id,
        updated_at: new Date().toISOString()
      }

      if (editingTicket) {
        const { error } = await supabase
          .from('tickets')
          .update(ticketData)
          .eq('id', editingTicket.id)

        if (error) throw error
        toast.success('Ticket updated successfully')
      } else {
        const { error } = await supabase
          .from('tickets')
          .insert([ticketData])

        if (error) throw error
        toast.success('Ticket created successfully')
      }

      setIsDialogOpen(false)
      setEditingTicket(null)
      resetForm()
      fetchTickets()
    } catch (error) {
      console.error('Error saving ticket:', error)
      toast.error('Failed to save ticket')
    }
  }

  const handleEdit = (ticket: TicketType) => {
    setEditingTicket(ticket)
    setFormData({
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category || '',
      contact_id: ticket.contact_id || '',
      assigned_to: ticket.assigned_to || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return

    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Ticket deleted successfully')
      fetchTickets()
    } catch (error) {
      console.error('Error deleting ticket:', error)
      toast.error('Failed to delete ticket')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'open',
      priority: 'medium',
      category: '',
      contact_id: '',
      assigned_to: ''
    })
  }

  const getPriorityColor = (priority: string) => {
    const priorityConfig = TICKET_PRIORITIES.find(p => p.key === priority)
    return priorityConfig?.color || 'bg-gray-500'
  }

  const getStatusColor = (status: string) => {
    const statusConfig = TICKET_STATUSES.find(s => s.key === status)
    return statusConfig?.color || 'bg-gray-500'
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'high': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'low': return <Clock className="h-4 w-4 text-green-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'closed': return <CheckCircle className="h-4 w-4 text-gray-500" />
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <AlertCircle className="h-4 w-4 text-blue-500" />
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.contacts?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.contacts?.last_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

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
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Manage customer support requests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingTicket(null) }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTicket ? 'Edit Ticket' : 'Create New Ticket'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
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
                      {TICKET_STATUSES.map(status => (
                        <SelectItem key={status.key} value={status.key}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_PRIORITIES.map(priority => (
                        <SelectItem key={priority.key} value={priority.key}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contact_id">Contact</Label>
                  <Select value={formData.contact_id} onValueChange={(value) => setFormData({ ...formData, contact_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Contact</SelectItem>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTicket ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {TICKET_STATUSES.map(status => (
          <Card key={status.key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{status.label}</p>
                  <p className="text-2xl font-bold">
                    {filteredTickets.filter(t => t.status === status.key).length}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full ${status.color.replace('bg-', 'bg-').replace('-500', '-100')} flex items-center justify-center`}>
                  {getStatusIcon(status.key)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search tickets..."
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
                  {TICKET_STATUSES.map(status => (
                    <SelectItem key={status.key} value={status.key}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {TICKET_PRIORITIES.map(priority => (
                    <SelectItem key={priority.key} value={priority.key}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getPriorityIcon(ticket.priority)}
                    <Badge 
                      variant="outline" 
                      className={`${getPriorityColor(ticket.priority)} text-white border-transparent text-xs`}
                    >
                      {ticket.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2 mb-1">
                    {ticket.title}
                  </CardTitle>
                  {ticket.category && (
                    <p className="text-sm text-gray-600">{ticket.category}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(ticket)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(ticket.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.description && (
                <p className="text-sm text-gray-600 line-clamp-3">
                  {ticket.description}
                </p>
              )}
              
              {ticket.contacts && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  {ticket.contacts.first_name} {ticket.contacts.last_name}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                {new Date(ticket.created_at).toLocaleDateString()}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(ticket.status)}
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(ticket.status)} text-white border-transparent text-xs`}
                  >
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <Button size="sm" variant="ghost">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No tickets found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first ticket to get started'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}