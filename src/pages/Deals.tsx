import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'
import { 
  Target, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  DollarSign,
  Calendar,
  User,
  Filter,
  Building2,
  TrendingUp
} from 'lucide-react'

interface Deal {
  id: string
  title: string
  amount: number | null
  stage: 'prospecting' | 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  probability: number
  close_date: string | null
  contact_id: string | null
  company_id: string | null
  assigned_to: string | null
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  contacts?: {
    first_name: string
    last_name: string
  }
  companies?: {
    name: string
  }
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface Company {
  id: string
  name: string
}

interface DealFormData {
  title: string
  amount: string
  stage: string
  probability: number
  close_date: string
  contact_id: string
  company_id: string
  description: string
}

const DEAL_STAGES = [
  { key: 'prospecting', label: 'Prospecting', color: 'bg-blue-500' },
  { key: 'qualification', label: 'Qualification', color: 'bg-yellow-500' },
  { key: 'needs_analysis', label: 'Needs Analysis', color: 'bg-orange-500' },
  { key: 'proposal', label: 'Proposal', color: 'bg-purple-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-pink-500' },
  { key: 'closed_won', label: 'Closed Won', color: 'bg-green-500' },
  { key: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500' },
]

export const Deals: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStage, setSelectedStage] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [formData, setFormData] = useState<DealFormData>({
    title: '',
    amount: '',
    stage: 'prospecting',
    probability: 0,
    close_date: '',
    contact_id: '',
    company_id: '',
    description: ''
  })

  useEffect(() => {
    fetchDeals()
    fetchContacts()
    fetchCompanies()
  }, [])

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          contacts (first_name, last_name),
          companies (name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDeals(data || [])
    } catch (error) {
      console.error('Error fetching deals:', error)
      toast.error('Failed to fetch deals')
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

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const dealData = {
        title: formData.title,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        stage: formData.stage,
        probability: formData.probability,
        close_date: formData.close_date || null,
        contact_id: formData.contact_id || null,
        company_id: formData.company_id || null,
        description: formData.description || null,
        created_by: user.id,
        updated_at: new Date().toISOString()
      }

      if (editingDeal) {
        const { error } = await supabase
          .from('deals')
          .update(dealData)
          .eq('id', editingDeal.id)

        if (error) throw error
        toast.success('Deal updated successfully')
      } else {
        const { error } = await supabase
          .from('deals')
          .insert([dealData])

        if (error) throw error
        toast.success('Deal created successfully')
      }

      setIsDialogOpen(false)
      setEditingDeal(null)
      resetForm()
      fetchDeals()
    } catch (error) {
      console.error('Error saving deal:', error)
      toast.error('Failed to save deal')
    }
  }

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal)
    setFormData({
      title: deal.title,
      amount: deal.amount?.toString() || '',
      stage: deal.stage,
      probability: deal.probability,
      close_date: deal.close_date || '',
      contact_id: deal.contact_id || '',
      company_id: deal.company_id || '',
      description: deal.description || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Deal deleted successfully')
      fetchDeals()
    } catch (error) {
      console.error('Error deleting deal:', error)
      toast.error('Failed to delete deal')
    }
  }

  const handleStageChange = async (dealId: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ 
          stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId)

      if (error) throw error
      toast.success('Deal stage updated')
      fetchDeals()
    } catch (error) {
      console.error('Error updating deal stage:', error)
      toast.error('Failed to update deal stage')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      stage: 'prospecting',
      probability: 0,
      close_date: '',
      contact_id: '',
      company_id: '',
      description: ''
    })
  }

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.companies?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${deal.contacts?.first_name} ${deal.contacts?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStage = !selectedStage || selectedStage === 'all' || deal.stage === selectedStage
    
    return matchesSearch && matchesStage
  })

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStageColor = (stage: string) => {
    const stageConfig = DEAL_STAGES.find(s => s.key === stage)
    return stageConfig?.color || 'bg-gray-500'
  }

  const renderKanbanBoard = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
        {DEAL_STAGES.map(stage => {
          const stageDeals = filteredDeals.filter(deal => deal.stage === stage.key)
          const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0)
          
          return (
            <Card key={stage.key} className="min-h-[500px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                    {stage.label}
                  </CardTitle>
                  <Badge variant="outline">{stageDeals.length}</Badge>
                </div>
                <p className="text-xs text-gray-600">{formatCurrency(stageValue)}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {stageDeals.map(deal => (
                    <Card key={deal.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{deal.title}</h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(deal)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(deal.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(deal.amount)}
                        </div>
                        
                        {deal.companies?.name && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Building2 className="h-3 w-3" />
                            {deal.companies.name}
                          </div>
                        )}
                        
                        {deal.contacts && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <User className="h-3 w-3" />
                            {deal.contacts.first_name} {deal.contacts.last_name}
                          </div>
                        )}
                        
                        {deal.close_date && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {new Date(deal.close_date).toLocaleDateString()}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {deal.probability}%
                          </Badge>
                          <div className="flex gap-1">
                            {DEAL_STAGES.map(nextStage => (
                              nextStage.key !== deal.stage && (
                                <Button
                                  key={nextStage.key}
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleStageChange(deal.id, nextStage.key)}
                                >
                                  → {nextStage.label}
                                </Button>
                              )
                            )).slice(0, 2)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">{t('deals.title')}</h1>
          <p className="text-gray-600 mt-1">Track your sales opportunities</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingDeal(null) }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('deals.createDeal')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingDeal ? t('deals.editDeal') : t('deals.createDeal')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">{t('deals.dealTitle')}</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">{t('deals.amount')}</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stage">{t('deals.stage')}</Label>
                    <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEAL_STAGES.map(stage => (
                          <SelectItem key={stage.key} value={stage.key}>{stage.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="probability">{t('deals.probability')} (%)</Label>
                    <Input
                      id="probability"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability}
                      onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="close_date">{t('deals.closeDate')}</Label>
                    <Input
                      id="close_date"
                      type="date"
                      value={formData.close_date}
                      onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_id">Contact</Label>
                    <Select value={formData.contact_id} onValueChange={(value) => setFormData({ ...formData, contact_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map(contact => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.first_name} {contact.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="company_id">Company</Label>
                    <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">{t('deals.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">
                    {editingDeal ? t('common.save') : t('common.create')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {DEAL_STAGES.map(stage => (
                    <SelectItem key={stage.key} value={stage.key}>{stage.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Deals</p>
                <p className="text-2xl font-bold">{filteredDeals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(filteredDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Won Deals</p>
                <p className="text-2xl font-bold">
                  {filteredDeals.filter(deal => deal.stage === 'closed_won').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold">
                  {filteredDeals.length > 0 
                    ? `${Math.round((filteredDeals.filter(deal => deal.stage === 'closed_won').length / filteredDeals.length) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deal Content */}
      {viewMode === 'kanban' ? renderKanbanBoard() : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Deals ({filteredDeals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Table view would go here */}
            <div className="text-center py-8">
              <p className="text-gray-600">Table view coming soon...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredDeals.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No deals found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || selectedStage
                ? 'Try adjusting your filters'
                : 'Create your first deal to get started'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}