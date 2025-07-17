import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu'
import { Badge } from '../ui/badge'
import { Bell, Search, Settings, User, LogOut, Globe } from 'lucide-react'
import { Input } from '../ui/input'

interface HeaderProps {
  currentHub: 'marketing' | 'sales' | 'service' | 'dashboard'
  onHubChange: (hub: 'marketing' | 'sales' | 'service' | 'dashboard') => void
}

export const Header: React.FC<HeaderProps> = ({ currentHub, onHubChange }) => {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
  }

  const hubs = [
    { key: 'dashboard', label: t('navigation.dashboard'), color: 'bg-blue-500' },
    { key: 'marketing', label: t('navigation.marketing'), color: 'bg-orange-500' },
    { key: 'sales', label: t('navigation.sales'), color: 'bg-green-500' },
    { key: 'service', label: t('navigation.service'), color: 'bg-purple-500' },
  ]

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-gradient-to-r from-orange-500 to-red-500"></div>
            <span className="text-xl font-bold text-gray-900">CRM Pro</span>
          </div>

          {/* Hub Switcher */}
          <div className="flex items-center space-x-1">
            {hubs.map((hub) => (
              <Button
                key={hub.key}
                variant={currentHub === hub.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onHubChange(hub.key as any)}
                className="relative"
              >
                {currentHub === hub.key && (
                  <div className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${hub.color}`}></div>
                )}
                {hub.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder={t('common.search')}
              className="w-64 pl-10"
            />
          </div>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Globe className="h-4 w-4 mr-1" />
                {i18n.language.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange('ja')}>
                日本語
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
            <Badge variant="destructive" className="ml-1 h-4 w-4 text-xs">
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>{t('common.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('common.settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('common.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}