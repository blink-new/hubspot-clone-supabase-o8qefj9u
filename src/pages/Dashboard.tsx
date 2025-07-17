import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { supabase } from '../lib/supabase'
import { 
  Users, 
  Building2, 
  Target, 
  Ticket, 
  TrendingUp, 
  Calendar, 
  CheckSquare,
  Plus,
  ArrowRight
} from 'lucide-react'

export const Dashboard: React.FC = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalCompanies: 0,
    totalDeals: 0,
    totalTickets: 0,
  })
  const [recentContacts, setRecentContacts] = useState<any[]>([])
  const [recentDeals, setRecentDeals] = useState<any[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [contactsCount, companiesCount, dealsCount, ticketsCount] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact' }),
        supabase.from('companies').select('id', { count: 'exact' }),
        supabase.from('deals').select('id', { count: 'exact' }),
        supabase.from('tickets').select('id', { count: 'exact' }),
      ])

      setStats({
        totalContacts: contactsCount.count || 0,
        totalCompanies: companiesCount.count || 0,
        totalDeals: dealsCount.count || 0,
        totalTickets: ticketsCount.count || 0,
      })

      // Fetch recent data
      const [contactsData, dealsData, tasksData] = await Promise.all([
        supabase
          .from('contacts')
          .select('*, companies(name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('deals')
          .select('*, contacts(first_name, last_name), companies(name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('tasks')
          .select('*, contacts(first_name, last_name)')
          .eq('completed', false)
          .order('due_date', { ascending: true })
          .limit(5),
      ])

      setRecentContacts(contactsData.data || [])
      setRecentDeals(dealsData.data || [])
      setUpcomingTasks(tasksData.data || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500'
      case 'open':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-yellow-500'
      case 'closed':
        return 'bg-gray-500'
      case 'closed_won':
        return 'bg-green-500'
      case 'closed_lost':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.overview')}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('common.new')}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('dashboard.totalContacts')}</p>
                <p className="text-2xl font-bold">{stats.totalContacts}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('dashboard.totalCompanies')}</p>
                <p className="text-2xl font-bold">{stats.totalCompanies}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('dashboard.totalDeals')}</p>
                <p className="text-2xl font-bold">{stats.totalDeals}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('dashboard.totalTickets')}</p>
                <p className="text-2xl font-bold">{stats.totalTickets}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Ticket className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Recent Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('dashboard.recentContacts')}</CardTitle>
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContacts.map((contact) => (
                <div key={contact.id} className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {contact.first_name} {contact.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{contact.companies?.name}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(contact.lead_status)} text-white border-transparent`}
                  >
                    {t(`contacts.status.${contact.lead_status}`)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Deals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('dashboard.recentDeals')}</CardTitle>
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{deal.title}</p>
                    <p className="text-xs text-gray-500">
                      {deal.contacts ? `${deal.contacts.first_name} ${deal.contacts.last_name}` : deal.companies?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(deal.amount || 0)}</p>
                    <Badge 
                      variant="outline"
                      className={`${getStatusColor(deal.stage)} text-white border-transparent text-xs`}
                    >
                      {t(`deals.stages.${deal.stage}`)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('dashboard.upcomingTasks')}</CardTitle>
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3">
                  <CheckSquare className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      {task.contacts ? `${task.contacts.first_name} ${task.contacts.last_name}` : 'General'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                    </p>
                    <Badge 
                      variant={task.priority === 'high' ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}