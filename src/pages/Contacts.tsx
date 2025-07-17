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
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Building2,
  User,
  Eye,
  Calendar,
  MapPin
} from 'lucide-react'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  job_title: string | null
  company_id: string | null
  lead_status: 'new' | 'open' | 'in_progress' | 'closed' | 'unqualified'
  lead_source: string | null
  notes: string | null
  created_at: string
  updated_at: string
  companies?: {
    id: string
    name: string
  }
}

export const Contacts: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    company_id: '',
    lead_status: 'new' as const,
    lead_source: '',
    notes: '',
  })

  useEffect(() => {
    fetchContacts()
    fetchCompanies()
  }, [])

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setContacts(data || [])
    } catch (error: any) {
      console.error('Error fetching contacts:', error)
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')

      if (error) throw error

      setCompanies(data || [])
    } catch (error: any) {
      console.error('Error fetching companies:', error)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.first_name || !formData.last_name) {
      toast.error('First name and last name are required')
      return
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          ...formData,
          company_id: formData.company_id === 'none' ? null : formData.company_id || null,
          created_by: user?.id
        })

      if (error) throw error

      toast.success(t('contacts.createContact') + ' success')
      setIsCreateDialogOpen(false)
      resetForm()
      fetchContacts()
    } catch (error: any) {
      console.error('Error creating contact:', error)
      toast.error('Failed to create contact')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedContact) return

    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          ...formData,
          company_id: formData.company_id === 'none' ? null : formData.company_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedContact.id)

      if (error) throw error

      toast.success(t('contacts.editContact') + ' success')
      setIsEditDialogOpen(false)
      resetForm()
      fetchContacts()
    } catch (error: any) {
      console.error('Error updating contact:', error)
      toast.error('Failed to update contact')
    }
  }

  const handleDelete = async (contactId: string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error

      toast.success('Contact deleted successfully')
      fetchContacts()
    } catch (error: any) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
    }
  }

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact)
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      job_title: contact.job_title || '',
      company_id: contact.company_id || '',
      lead_status: contact.lead_status,
      lead_source: contact.lead_source || '',
      notes: contact.notes || '',
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      job_title: '',
      company_id: '',
      lead_status: 'new',
      lead_source: '',
      notes: '',
    })
    setSelectedContact(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500'
      case 'open': return 'bg-green-500'
      case 'in_progress': return 'bg-yellow-500'
      case 'closed': return 'bg-gray-500'
      case 'unqualified': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.companies?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || contact.lead_status === statusFilter

    return matchesSearch && matchesStatus
  })

  const ContactForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <form onSubmit={isEdit ? handleUpdate : handleCreate} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">{t('contacts.firstName')} *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="last_name">{t('contacts.lastName')} *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">{t('contacts.email')}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">{t('contacts.phone')}</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="job_title">{t('contacts.jobTitle')}</Label>
          <Input
            id="job_title"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="company_id">{t('contacts.company')}</Label>
          <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Company</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lead_status">{t('contacts.leadStatus')}</Label>
          <Select value={formData.lead_status} onValueChange={(value) => setFormData({ ...formData, lead_status: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">{t('contacts.status.new')}</SelectItem>
              <SelectItem value="open">{t('contacts.status.open')}</SelectItem>
              <SelectItem value="in_progress">{t('contacts.status.in_progress')}</SelectItem>
              <SelectItem value="closed">{t('contacts.status.closed')}</SelectItem>
              <SelectItem value="unqualified">{t('contacts.status.unqualified')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="lead_source">{t('contacts.leadSource')}</Label>
          <Input
            id="lead_source"
            value={formData.lead_source}
            onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
            placeholder="Website, Referral, Cold Call, etc."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">{t('contacts.notes')}</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => {
          isEdit ? setIsEditDialogOpen(false) : setIsCreateDialogOpen(false)
          resetForm()
        }}>
          {t('common.cancel')}
        </Button>
        <Button type="submit">
          {isEdit ? t('common.save') : t('common.create')}
        </Button>
      </div>
    </form>
  )

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
          <h1 className="text-2xl font-bold text-gray-900">{t('contacts.title')}</h1>
          <p className="text-gray-600 mt-1">Manage your contacts and leads</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('contacts.createContact')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('contacts.createContact')}</DialogTitle>
            </DialogHeader>
            <ContactForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t('common.search') + ' contacts...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">{t('contacts.status.new')}</SelectItem>
            <SelectItem value="open">{t('contacts.status.open')}</SelectItem>
            <SelectItem value="in_progress">{t('contacts.status.in_progress')}</SelectItem>
            <SelectItem value="closed">{t('contacts.status.closed')}</SelectItem>
            <SelectItem value="unqualified">{t('contacts.status.unqualified')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{contacts.length}</div>
            <div className="text-sm text-gray-600">Total Contacts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{contacts.filter(c => c.lead_status === 'new').length}</div>
            <div className="text-sm text-gray-600">New Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{contacts.filter(c => c.lead_status === 'open').length}</div>
            <div className="text-sm text-gray-600">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{contacts.filter(c => c.lead_status === 'in_progress').length}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{contacts.filter(c => c.lead_status === 'closed').length}</div>
            <div className="text-sm text-gray-600">Closed</div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {contact.first_name} {contact.last_name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{contact.job_title}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(contact)}>
                      <Edit className="h-4 w-4 mr-2" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(contact.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {contact.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.companies && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="h-4 w-4 mr-2" />
                    {contact.companies.name}
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(contact.lead_status)} text-white border-transparent`}
                  >
                    {t(`contacts.status.${contact.lead_status}`)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Get started by creating your first contact'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('contacts.createContact')}
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('contacts.editContact')}</DialogTitle>
          </DialogHeader>
          <ContactForm isEdit />
        </DialogContent>
      </Dialog>
    </div>
  )
}