import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { 
  Plus, 
  Search, 
  FileText, 
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  User,
  Tag,
  ArrowRight,
  BookOpen,
  HelpCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface KnowledgeBaseArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  views: number
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
  author?: {
    first_name: string
    last_name: string
    email: string
  }
}

export const KnowledgeBase: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    is_public: true,
  })

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .select(`
          *,
          author:profiles!created_by(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setArticles(data || [])
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast.error('Failed to load articles')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .insert([
          {
            ...formData,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            created_by: user?.id,
            status: 'draft',
            views: 0,
          },
        ])
        .select()

      if (error) throw error

      setArticles([data[0], ...articles])
      setFormData({
        title: '',
        content: '',
        category: '',
        tags: '',
        is_public: true,
      })
      setIsCreateModalOpen(false)
      toast.success('Article created successfully')
    } catch (error) {
      console.error('Error creating article:', error)
      toast.error('Failed to create article')
    }
  }

  const handleUpdateArticle = async () => {
    if (!selectedArticle) return

    try {
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .update({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedArticle.id)
        .select()

      if (error) throw error

      setArticles(articles.map(a => a.id === selectedArticle.id ? data[0] : a))
      setIsEditModalOpen(false)
      setSelectedArticle(null)
      toast.success('Article updated successfully')
    } catch (error) {
      console.error('Error updating article:', error)
      toast.error('Failed to update article')
    }
  }

  const handleUpdateStatus = async (articleId: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const { error } = await supabase
        .from('knowledge_base_articles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId)

      if (error) throw error

      setArticles(articles.map(article => 
        article.id === articleId 
          ? { ...article, status: newStatus }
          : article
      ))
      
      toast.success(`Article ${newStatus} successfully`)
    } catch (error) {
      console.error('Error updating article status:', error)
      toast.error('Failed to update article status')
    }
  }

  const handleDeleteArticle = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_base_articles')
        .delete()
        .eq('id', articleId)

      if (error) throw error

      setArticles(articles.filter(a => a.id !== articleId))
      toast.success('Article deleted successfully')
    } catch (error) {
      console.error('Error deleting article:', error)
      toast.error('Failed to delete article')
    }
  }

  const handleIncrementViews = async (articleId: string) => {
    try {
      const article = articles.find(a => a.id === articleId)
      if (!article) return

      const { error } = await supabase
        .from('knowledge_base_articles')
        .update({ views: article.views + 1 })
        .eq('id', articleId)

      if (error) throw error

      setArticles(articles.map(a => 
        a.id === articleId 
          ? { ...a, views: a.views + 1 }
          : a
      ))
    } catch (error) {
      console.error('Error incrementing views:', error)
    }
  }

  const openEditModal = (article: KnowledgeBaseArticle) => {
    setSelectedArticle(article)
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags.join(', '),
      is_public: article.is_public,
    })
    setIsEditModalOpen(true)
  }

  const openViewModal = (article: KnowledgeBaseArticle) => {
    setSelectedArticle(article)
    setIsViewModalOpen(true)
    handleIncrementViews(article.id)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'archived':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="h-4 w-4" />
      case 'published':
        return <CheckCircle className="h-4 w-4" />
      case 'archived':
        return <FileText className="h-4 w-4" />
      default:
        return <Edit className="h-4 w-4" />
    }
  }

  const getUniqueCategories = () => {
    const categories = articles.map(a => a.category).filter(Boolean)
    return [...new Set(categories)]
  }

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || article.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const stats = {
    total: articles.length,
    draft: articles.filter(a => a.status === 'draft').length,
    published: articles.filter(a => a.status === 'published').length,
    archived: articles.filter(a => a.status === 'archived').length,
    totalViews: articles.reduce((sum, a) => sum + a.views, 0),
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
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-600 mt-1">Create and manage help articles</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Create New Article</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Article Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., How to reset your password"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Account, Technical, Billing"
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g., password, login, security"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="content">Article Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your article content here..."
                  rows={10}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                />
                <Label htmlFor="is_public">Make this article public</Label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateArticle}>
                  Create Article
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Articles</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              <div className="text-sm text-gray-600">Draft</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.published}</div>
              <div className="text-sm text-gray-600">Published</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.archived}</div>
              <div className="text-sm text-gray-600">Archived</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalViews}</div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {getUniqueCategories().map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(article.status)}
                    <h3 
                      className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => openViewModal(article)}
                    >
                      {article.title}
                    </h3>
                    <Badge className={getStatusColor(article.status)}>
                      {article.status}
                    </Badge>
                    {article.is_public ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <Eye className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {article.content.substring(0, 200)}...
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Tag className="h-4 w-4" />
                      <span>{article.category}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{article.views} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{article.author ? `${article.author.first_name} ${article.author.last_name}` : 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(article.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    {article.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openViewModal(article)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(article)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {article.status === 'draft' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(article.id, 'published')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Publish
                    </Button>
                  )}
                  {article.status === 'published' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(article.id, 'archived')}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Archive
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteArticle(article.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Article Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Article Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., How to reset your password"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Account, Technical, Billing"
                />
              </div>
              <div>
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., password, login, security"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-content">Article Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your article content here..."
                rows={10}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              />
              <Label htmlFor="edit-is_public">Make this article public</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateArticle}>
                Update Article
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Article Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5" />
              <span>{selectedArticle?.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <Badge className={getStatusColor(selectedArticle?.status || '')}>
                {selectedArticle?.status}
              </Badge>
              <span>Category: {selectedArticle?.category}</span>
              <span>Views: {selectedArticle?.views}</span>
              <span>Created: {selectedArticle?.created_at ? new Date(selectedArticle.created_at).toLocaleDateString() : ''}</span>
            </div>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">
                {selectedArticle?.content}
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <span className="text-sm text-gray-500">Tags:</span>
              {selectedArticle?.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}