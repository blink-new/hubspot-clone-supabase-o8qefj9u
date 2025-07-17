import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  BarChart3, 
  Building2, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Mail, 
  MessageSquare, 
  PieChart, 
  Settings, 
  Users, 
  Zap,
  Ticket,
  Target
} from 'lucide-react'

interface SidebarProps {
  currentHub: 'marketing' | 'sales' | 'service' | 'dashboard'
  currentPage: string
  onPageChange: (page: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ currentHub, currentPage, onPageChange }) => {
  const { t } = useTranslation()

  const getNavigationItems = () => {
    switch (currentHub) {
      case 'dashboard':
        return [
          { key: 'dashboard', label: t('navigation.dashboard'), icon: BarChart3 },
          { key: 'reports', label: t('navigation.reports'), icon: PieChart },
          { key: 'tasks', label: t('navigation.tasks'), icon: CheckSquare, badge: '5' },
        ]
      case 'marketing':
        return [
          { key: 'contacts', label: t('navigation.contacts'), icon: Users },
          { key: 'companies', label: t('navigation.companies'), icon: Building2 },
          { key: 'campaigns', label: t('navigation.campaigns'), icon: Mail },
          { key: 'landing-pages', label: 'Landing Pages', icon: FileText },
          { key: 'forms', label: 'Forms', icon: Zap },
          { key: 'analytics', label: 'Analytics', icon: BarChart3 },
        ]
      case 'sales':
        return [
          { key: 'contacts', label: t('navigation.contacts'), icon: Users },
          { key: 'companies', label: t('navigation.companies'), icon: Building2 },
          { key: 'deals', label: t('navigation.deals'), icon: Target },
          { key: 'tasks', label: t('navigation.tasks'), icon: CheckSquare, badge: '3' },
          { key: 'calendar', label: 'Calendar', icon: Calendar },
          { key: 'reports', label: t('navigation.reports'), icon: PieChart },
        ]
      case 'service':
        return [
          { key: 'tickets', label: t('navigation.tickets'), icon: Ticket, badge: '12' },
          { key: 'contacts', label: t('navigation.contacts'), icon: Users },
          { key: 'knowledge-base', label: 'Knowledge Base', icon: FileText },
          { key: 'live-chat', label: 'Live Chat', icon: MessageSquare, badge: '2' },
          { key: 'reports', label: t('navigation.reports'), icon: PieChart },
        ]
      default:
        return []
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <aside className="w-64 border-r bg-white">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold capitalize">
            {currentHub === 'dashboard' ? t('navigation.dashboard') : `${t(`navigation.${currentHub}`)} Hub`}
          </h2>
        </div>

        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.key}
                variant={currentPage === item.key ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  currentPage === item.key && 'bg-gray-100 font-medium'
                )}
                onClick={() => onPageChange(item.key)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
                {item.badge && (
                  <Badge variant="destructive" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            )
          })}
        </nav>

        <div className="mt-8 pt-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onPageChange('settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            {t('common.settings')}
          </Button>
        </div>
      </div>
    </aside>
  )
}