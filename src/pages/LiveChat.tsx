import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { ScrollArea } from '../components/ui/scroll-area'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Video, 
  MoreHorizontal,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Minimize2,
  Maximize2,
  X,
  Settings,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'

interface ChatSession {
  id: string
  visitor_name: string
  visitor_email: string
  status: 'active' | 'waiting' | 'ended'
  started_at: string
  ended_at: string | null
  assigned_to: string | null
  last_message: string | null
  last_message_at: string | null
  visitor_info: {
    ip_address?: string
    user_agent?: string
    page_url?: string
    referrer?: string
  }
}

interface ChatMessage {
  id: string
  session_id: string
  sender_type: 'visitor' | 'agent'
  sender_name: string
  message: string
  timestamp: string
  is_read: boolean
}

export const LiveChat: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'waiting' | 'ended'>('active')
  const [searchTerm, setSearchTerm] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    fetchSessions()
    // Set up real-time subscriptions
    const sessionsSubscription = supabase
      .channel('chat_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, 
        (payload) => {
          console.log('Session change:', payload)
          fetchSessions()
        })
      .subscribe()

    const messagesSubscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, 
        (payload) => {
          console.log('Message change:', payload)
          if (activeSession) {
            fetchMessages(activeSession.id)
          }
        })
      .subscribe()

    return () => {
      sessionsSubscription.unsubscribe()
      messagesSubscription.unsubscribe()
    }
  }, [activeSession])

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('started_at', { ascending: false })

      if (error) throw error

      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
      toast.error('Failed to load chat sessions')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const handleSessionSelect = (session: ChatSession) => {
    setActiveSession(session)
    fetchMessages(session.id)
    markSessionAsRead(session.id)
  }

  const markSessionAsRead = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('session_id', sessionId)
        .eq('sender_type', 'visitor')

      if (error) throw error
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!activeSession || !newMessage.trim()) return

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([
          {
            session_id: activeSession.id,
            sender_type: 'agent',
            sender_name: `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() || user?.email || 'Agent',
            message: newMessage,
            timestamp: new Date().toISOString(),
            is_read: false,
          },
        ])
        .select()

      if (error) throw error

      // Update session with last message
      await supabase
        .from('chat_sessions')
        .update({
          last_message: newMessage,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', activeSession.id)

      setMessages([...messages, data[0]])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const handleAssignSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ assigned_to: user?.id })
        .eq('id', sessionId)

      if (error) throw error

      setSessions(sessions.map(s => 
        s.id === sessionId 
          ? { ...s, assigned_to: user?.id }
          : s
      ))
      
      toast.success('Session assigned to you')
    } catch (error) {
      console.error('Error assigning session:', error)
      toast.error('Failed to assign session')
    }
  }

  const handleEndSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) throw error

      setSessions(sessions.map(s => 
        s.id === sessionId 
          ? { ...s, status: 'ended' as const, ended_at: new Date().toISOString() }
          : s
      ))
      
      if (activeSession?.id === sessionId) {
        setActiveSession(null)
        setMessages([])
      }
      
      toast.success('Session ended')
    } catch (error) {
      console.error('Error ending session:', error)
      toast.error('Failed to end session')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800'
      case 'ended':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'waiting':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'ended':
        return <X className="h-4 w-4 text-gray-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.visitor_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || session.status === filter
    
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: sessions.length,
    active: sessions.filter(s => s.status === 'active').length,
    waiting: sessions.filter(s => s.status === 'waiting').length,
    ended: sessions.filter(s => s.status === 'ended').length,
  }

  const unreadMessages = messages.filter(m => !m.is_read && m.sender_type === 'visitor').length

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
          <h1 className="text-2xl font-bold text-gray-900">Live Chat</h1>
          <p className="text-gray-600 mt-1">Manage customer support conversations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Chat Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
              <div className="text-sm text-gray-600">Waiting</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.ended}</div>
              <div className="text-sm text-gray-600">Ended</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Sessions List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Chat Sessions</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setFilter(filter === 'all' ? 'active' : 'all')}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <ScrollArea className="h-[480px]">
              <div className="space-y-1">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 transition-colors ${
                      activeSession?.id === session.id 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'border-transparent'
                    }`}
                    onClick={() => handleSessionSelect(session)}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {session.visitor_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-sm truncate">{session.visitor_name}</p>
                          {getStatusIcon(session.status)}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{session.visitor_email}</p>
                        <p className="text-xs text-gray-600 truncate mt-1">
                          {session.last_message || 'No messages yet'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge className={getStatusColor(session.status)} variant="secondary">
                            {session.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {session.last_message_at 
                              ? new Date(session.last_message_at).toLocaleTimeString() 
                              : new Date(session.started_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          {activeSession ? (
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {activeSession.visitor_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{activeSession.visitor_name}</p>
                      <p className="text-sm text-gray-500">{activeSession.visitor_email}</p>
                    </div>
                    <Badge className={getStatusColor(activeSession.status)}>
                      {activeSession.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    {activeSession.status !== 'ended' && (
                      <>
                        {!activeSession.assigned_to && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignSession(activeSession.id)}
                          >
                            Assign to Me
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEndSession(activeSession.id)}
                        >
                          End Chat
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.sender_type === 'agent'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-sm font-medium mb-1">
                            {message.sender_name}
                          </div>
                          <div className="text-sm">{message.message}</div>
                          <div className={`text-xs mt-1 ${
                            message.sender_type === 'agent' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              {activeSession.status !== 'ended' && (
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a chat session to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}