import React, { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Auth } from './pages/Auth'
import { Contacts } from './pages/Contacts'
import { Companies } from './pages/Companies'
import { Deals } from './pages/Deals'
import { Tickets } from './pages/Tickets'
import { EmailCampaigns } from './pages/EmailCampaigns'
import { KnowledgeBase } from './pages/KnowledgeBase'
import { LiveChat } from './pages/LiveChat'
import { Tickets } from './pages/Tickets'
import { EmailCampaigns } from './pages/EmailCampaigns'
import { Toaster } from './components/ui/sonner'
import './lib/i18n'

const MainApp: React.FC = () => {
  const { user, loading } = useAuth()
  const [currentHub, setCurrentHub] = useState<'marketing' | 'sales' | 'service' | 'dashboard'>('dashboard')
  const [currentPage, setCurrentPage] = useState('dashboard')

  const handleHubChange = (hub: 'marketing' | 'sales' | 'service' | 'dashboard') => {
    setCurrentHub(hub)
    // Set default page for each hub
    switch (hub) {
      case 'marketing':
        setCurrentPage('contacts')
        break
      case 'sales':
        setCurrentPage('deals')
        break
      case 'service':
        setCurrentPage('tickets')
        break
      default:
        setCurrentPage('dashboard')
    }
  }

  const handlePageChange = (page: string) => {
    setCurrentPage(page)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'contacts':
        return <Contacts />
      case 'companies':
        return <Companies />
      case 'deals':
        return <Deals />
      case 'tickets':
        return <Tickets />
      case 'campaigns':
        return <EmailCampaigns />
      case 'reports':
        return <div className="p-6"><h1 className="text-2xl font-bold">Reports</h1><p className="text-gray-600">Analytics and reporting coming soon...</p></div>
      case 'tasks':
        return <div className="p-6"><h1 className="text-2xl font-bold">Tasks</h1><p className="text-gray-600">Task management coming soon...</p></div>
      case 'settings':
        return <div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-600">Application settings coming soon...</p></div>
      default:
        return <Dashboard />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentHub={currentHub} 
        onHubChange={handleHubChange} 
      />
      <div className="flex">
        <Sidebar 
          currentHub={currentHub}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
      <Toaster />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}

export default App