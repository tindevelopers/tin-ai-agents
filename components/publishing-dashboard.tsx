'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import { 
  Search, 
  Filter, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar,
  ExternalLink,
  RefreshCw,
  MoreVertical
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface BlogPost {
  id: string
  title: string
  content: string
  status: string
  slug?: string
  created_at: string
  updated_at: string
  published_at?: string
  scheduled_for?: string
  publishing_history?: PublishingHistory[]
  cms_publications?: CmsPublication[]
}

interface PublishingHistory {
  id: string
  status: string
  published_url?: string
  published_at?: string
  error_details?: any
  cms_config: {
    id: string
    platform_type: string
    name: string
  }
}

interface CmsPublication {
  id: string
  external_id?: string
  published_url?: string
  status: string
  last_synced_at?: string
  cms_config: {
    id: string
    platform_type: string
    name: string
  }
}

interface CmsConfig {
  id: string
  platform_type: string
  name: string
  is_active: boolean
}

const STATUS_COLORS = {
  draft: 'gray',
  'content-review': 'yellow',
  'seo-review': 'orange',
  'image-review': 'blue',
  'ready-to-publish': 'green',
  publishing: 'purple',
  published: 'green',
  failed: 'red'
} as const

const STATUS_LABELS = {
  draft: 'Draft',
  'content-review': 'Content Review',
  'seo-review': 'SEO Review',
  'image-review': 'Image Review',
  'ready-to-publish': 'Ready to Publish',
  publishing: 'Publishing',
  published: 'Published',
  failed: 'Failed'
} as const

export function PublishingDashboard() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [cmsConfigs, setCmsConfigs] = useState<CmsConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [publishingStats, setPublishingStats] = useState({
    total: 0,
    published: 0,
    ready: 0,
    failed: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [postsResponse, configsResponse] = await Promise.all([
        fetch('/api/blog/list'),
        fetch('/api/cms/configs')
      ])

      if (!postsResponse.ok || !configsResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const postsData = await postsResponse.json()
      const configsData = await configsResponse.json()

      setBlogPosts(postsData.posts || [])
      setCmsConfigs(configsData.configs || [])

      // Calculate stats
      const posts = postsData.posts || []
      setPublishingStats({
        total: posts.length,
        published: posts.filter((p: BlogPost) => p.status === 'published').length,
        ready: posts.filter((p: BlogPost) => p.status === 'ready-to-publish').length,
        failed: posts.filter((p: BlogPost) => p.status === 'failed').length
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkPublish = async (cmsConfigId: string) => {
    if (selectedPosts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select posts to publish',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/publish/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blog_ids: selectedPosts,
          cms_config_id: cmsConfigId,
          publish_immediately: true
        })
      })

      if (!response.ok) throw new Error('Failed to publish posts')

      toast({
        title: 'Success',
        description: `${selectedPosts.length} posts queued for publishing`
      })

      setSelectedPosts([])
      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish posts',
        variant: 'destructive'
      })
    }
  }

  const handleSinglePublish = async (postId: string, cmsConfigId: string) => {
    try {
      const response = await fetch(`/api/publish/blog/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cms_config_id: cmsConfigId,
          publish_immediately: true
        })
      })

      if (!response.ok) throw new Error('Failed to publish post')

      toast({
        title: 'Success',
        description: 'Post queued for publishing'
      })

      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish post',
        variant: 'destructive'
      })
    }
  }

  const getPublishingStatus = (post: BlogPost): { status: string; platform?: string; url?: string } => {
    if (post.cms_publications && post.cms_publications.length > 0) {
      const publication = post.cms_publications[0]
      return {
        status: publication.status,
        platform: publication.cms_config.name,
        url: publication.published_url
      }
    }
    return { status: 'not-published' }
  }

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const togglePostSelection = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    )
  }

  const selectAllPosts = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([])
    } else {
      setSelectedPosts(filteredPosts.map(post => post.id))
    }
  }

  if (loading) {
    return <div className="p-6">Loading publishing dashboard...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Publishing Dashboard</h2>
          <p className="text-gray-600">Manage and publish your blog posts to CMS platforms</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full" />
              <span className="text-sm text-gray-600">Total Posts</span>
            </div>
            <p className="text-2xl font-bold">{publishingStats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">Published</span>
            </div>
            <p className="text-2xl font-bold">{publishingStats.published}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-yellow-500 rounded-full" />
              <span className="text-sm text-gray-600">Ready to Publish</span>
            </div>
            <p className="text-2xl font-bold">{publishingStats.ready}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-red-500 rounded-full" />
              <span className="text-sm text-gray-600">Failed</span>
            </div>
            <p className="text-2xl font-bold">{publishingStats.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedPosts.length > 0 && (
          <div className="flex gap-2">
            <span className="text-sm text-gray-600 py-2">
              {selectedPosts.length} selected
            </span>
            {cmsConfigs.map(config => (
              <Button
                key={config.id}
                size="sm"
                onClick={() => handleBulkPublish(config.id)}
                disabled={!config.is_active}
              >
                <Send className="h-4 w-4 mr-2" />
                Publish to {config.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Blog Posts</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                onCheckedChange={selectAllPosts}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const publishingStatus = getPublishingStatus(post)
              
              return (
                <div key={post.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedPosts.includes(post.id)}
                        onCheckedChange={() => togglePostSelection(post.id)}
                      />
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{post.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline"
                            className={`text-${STATUS_COLORS[post.status as keyof typeof STATUS_COLORS]}-600`}
                          >
                            {STATUS_LABELS[post.status as keyof typeof STATUS_LABELS] || post.status}
                          </Badge>
                          
                          {publishingStatus.status !== 'not-published' && (
                            <Badge variant="secondary">
                              {publishingStatus.platform}: {publishingStatus.status}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 mt-2">
                          Created: {new Date(post.created_at).toLocaleDateString()}
                          {post.published_at && (
                            <span className="ml-4">
                              Published: {new Date(post.published_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {publishingStatus.url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={publishingStatus.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {cmsConfigs.map(config => (
                            <DropdownMenuItem
                              key={config.id}
                              onClick={() => handleSinglePublish(post.id, config.id)}
                              disabled={!config.is_active}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Publish to {config.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Publishing History */}
                  {post.publishing_history && post.publishing_history.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Recent Publishing Activity</h4>
                      <div className="space-y-2">
                        {post.publishing_history.slice(0, 3).map((history) => (
                          <div key={history.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              {history.status === 'published' && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {history.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                              {history.status === 'publishing' && <Clock className="h-4 w-4 text-yellow-500" />}
                              <span>{history.cms_config.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {history.status}
                              </Badge>
                            </div>
                            {history.published_at && (
                              <span className="text-gray-500">
                                {new Date(history.published_at).toLocaleString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {filteredPosts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No posts found matching your filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
