'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Video,
  FileText,
  Image,
  Folder,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  Star
} from 'lucide-react'

interface ContentItem {
  id: string
  title: string
  type: 'video' | 'document' | 'image' | 'drill'
  category: string
  size: string
  uploadDate: string
  lastModified: string
  views: number
  featured: boolean
  status: 'published' | 'draft' | 'archived'
}

export default function AssistantContentPage() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    // Simulate loading content
    setTimeout(() => {
      setContentItems([
        {
          id: '1',
          title: 'Advanced Defensive Drills',
          type: 'video',
          category: 'Training',
          size: '245 MB',
          uploadDate: '2024-01-15',
          lastModified: '2024-01-15',
          views: 1250,
          featured: true,
          status: 'published'
        },
        {
          id: '2',
          title: 'Nutrition Guide for Athletes',
          type: 'document',
          category: 'Resources',
          size: '3.2 MB',
          uploadDate: '2024-01-10',
          lastModified: '2024-01-12',
          views: 890,
          featured: false,
          status: 'published'
        },
        {
          id: '3',
          title: 'Team Formation Diagrams',
          type: 'image',
          category: 'Tactics',
          size: '1.8 MB',
          uploadDate: '2024-01-08',
          lastModified: '2024-01-08',
          views: 567,
          featured: false,
          status: 'published'
        },
        {
          id: '4',
          title: 'Warm-up Routine',
          type: 'drill',
          category: 'Training',
          size: '156 KB',
          uploadDate: '2024-01-05',
          lastModified: '2024-01-07',
          views: 2340,
          featured: true,
          status: 'published'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />
      case 'document':
        return <FileText className="w-4 h-4" />
      case 'image':
        return <Image className="w-4 h-4" />
      case 'drill':
        return <Folder className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-red-100 text-red-800'
      case 'document':
        return 'bg-blue-100 text-blue-800'
      case 'image':
        return 'bg-green-100 text-green-800'
      case 'drill':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const categories = ['all', 'Training', 'Resources', 'Tactics', 'Recovery']

  const filteredContent = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Content Organization</h1>
        <p className="text-gray-600 mt-2">Manage and organize training content and resources</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Content</p>
                <p className="text-2xl font-bold">{contentItems.length}</p>
              </div>
              <Folder className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Videos</p>
                <p className="text-2xl font-bold">
                  {contentItems.filter(i => i.type === 'video').length}
                </p>
              </div>
              <Video className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">
                  {contentItems.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-2xl font-bold">
                  {contentItems.filter(i => i.featured).length}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList>
                  {categories.map(category => (
                    <TabsTrigger key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex gap-2 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContent.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </div>
                    {item.featured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>{item.category}</span>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{item.size}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.views}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Modified: {new Date(item.lastModified).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Content</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Views</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Modified</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredContent.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.featured && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getTypeColor(item.type)}>
                        <span className="flex items-center gap-1">
                          {getTypeIcon(item.type)}
                          {item.type}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{item.views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(item.lastModified).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}