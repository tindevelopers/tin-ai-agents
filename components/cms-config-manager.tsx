'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Trash2, Edit, TestTube2, Plus, ExternalLink } from 'lucide-react'

interface CmsConfig {
  id: string
  platform_type: string
  name: string
  site_id?: string
  collection_id?: string
  field_mappings: Record<string, string>
  publishing_rules: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
  _count?: {
    publishing_history: number
    cms_publications: number
  }
}

interface CmsConfigFormData {
  platform_type: string
  name: string
  site_id: string
  collection_id: string
  api_token: string
  field_mappings: Record<string, string>
  publishing_rules: Record<string, any>
}

const PLATFORM_TYPES = [
  { value: 'webflow', label: 'Webflow' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'contentful', label: 'Contentful' },
  { value: 'ghost', label: 'Ghost' }
]

const DEFAULT_FIELD_MAPPINGS = {
  webflow: {
    title: 'name',
    content: 'content',
    slug: 'slug',
    meta_description: 'meta-description',
    featured_image: 'featured-image',
    author: 'author',
    category: 'category',
    tags: 'tags',
    seo_title: 'seo-title',
    excerpt: 'excerpt',
    published_date: 'published-date'
  }
}

export function CmsConfigManager() {
  const [configs, setConfigs] = useState<CmsConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<CmsConfig | null>(null)
  const [formData, setFormData] = useState<CmsConfigFormData>({
    platform_type: '',
    name: '',
    site_id: '',
    collection_id: '',
    api_token: '',
    field_mappings: {},
    publishing_rules: {
      auto_publish: true,
      base_url: ''
    }
  })

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/cms/configs')
      if (!response.ok) throw new Error('Failed to fetch configurations')
      const data = await response.json()
      setConfigs(data.configs)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch CMS configurations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        ...formData,
        api_credentials: {
          api_token: formData.api_token,
          site_id: formData.site_id,
          collection_id: formData.collection_id
        }
      }

      const url = editingConfig 
        ? `/api/cms/configs/${editingConfig.id}`
        : '/api/cms/configs'
      
      const method = editingConfig ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save configuration')
      }

      toast({
        title: 'Success',
        description: `Configuration ${editingConfig ? 'updated' : 'created'} successfully`
      })

      setIsDialogOpen(false)
      setEditingConfig(null)
      resetForm()
      fetchConfigs()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save configuration',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (config: CmsConfig) => {
    setEditingConfig(config)
    setFormData({
      platform_type: config.platform_type,
      name: config.name,
      site_id: config.site_id || '',
      collection_id: config.collection_id || '',
      api_token: '', // Don't populate for security
      field_mappings: config.field_mappings,
      publishing_rules: config.publishing_rules
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (config: CmsConfig) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return

    try {
      const response = await fetch(`/api/cms/configs/${config.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete configuration')

      toast({
        title: 'Success',
        description: 'Configuration deleted successfully'
      })

      fetchConfigs()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete configuration',
        variant: 'destructive'
      })
    }
  }

  const testConnection = async (config: CmsConfig) => {
    try {
      // Implement connection test logic here
      toast({
        title: 'Connection Test',
        description: 'Connection test feature coming soon'
      })
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to CMS platform',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      platform_type: '',
      name: '',
      site_id: '',
      collection_id: '',
      api_token: '',
      field_mappings: {},
      publishing_rules: {
        auto_publish: true,
        base_url: ''
      }
    })
  }

  const handlePlatformChange = (platform: string) => {
    setFormData({
      ...formData,
      platform_type: platform,
      field_mappings: DEFAULT_FIELD_MAPPINGS[platform as keyof typeof DEFAULT_FIELD_MAPPINGS] || {}
    })
  }

  if (loading) {
    return <div className="p-6">Loading CMS configurations...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">CMS Configurations</h2>
          <p className="text-gray-600">Manage your content management system connections</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingConfig(null) }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit CMS Configuration' : 'Add CMS Configuration'}
              </DialogTitle>
              <DialogDescription>
                Configure your connection to a content management system.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="mappings">Field Mappings</TabsTrigger>
                  <TabsTrigger value="rules">Publishing Rules</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="platform">Platform</Label>
                      <Select 
                        value={formData.platform_type} 
                        onValueChange={handlePlatformChange}
                        disabled={!!editingConfig}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {PLATFORM_TYPES.map(platform => (
                            <SelectItem key={platform.value} value={platform.value}>
                              {platform.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="name">Configuration Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="My Webflow Site"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="site_id">Site ID</Label>
                      <Input
                        id="site_id"
                        value={formData.site_id}
                        onChange={(e) => setFormData({...formData, site_id: e.target.value})}
                        placeholder="Site identifier"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="collection_id">Collection ID</Label>
                      <Input
                        id="collection_id"
                        value={formData.collection_id}
                        onChange={(e) => setFormData({...formData, collection_id: e.target.value})}
                        placeholder="Collection identifier"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="api_token">API Token</Label>
                    <Input
                      id="api_token"
                      type="password"
                      value={formData.api_token}
                      onChange={(e) => setFormData({...formData, api_token: e.target.value})}
                      placeholder="Enter your API token"
                      required={!editingConfig}
                    />
                    {editingConfig && (
                      <p className="text-sm text-gray-500 mt-1">Leave empty to keep existing token</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="mappings" className="space-y-4">
                  <div className="space-y-3">
                    <Label>Field Mappings</Label>
                    <p className="text-sm text-gray-600">
                      Map your blog fields to CMS fields
                    </p>
                    
                    {Object.entries(formData.field_mappings).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 gap-2">
                        <Input value={key} disabled className="bg-gray-50" />
                        <Input
                          value={value}
                          onChange={(e) => setFormData({
                            ...formData,
                            field_mappings: {
                              ...formData.field_mappings,
                              [key]: e.target.value
                            }
                          })}
                          placeholder="CMS field name"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="rules" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-publish</Label>
                        <p className="text-sm text-gray-600">Automatically make content live</p>
                      </div>
                      <Switch
                        checked={formData.publishing_rules.auto_publish}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          publishing_rules: {
                            ...formData.publishing_rules,
                            auto_publish: checked
                          }
                        })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="base_url">Base URL</Label>
                      <Input
                        id="base_url"
                        value={formData.publishing_rules.base_url || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          publishing_rules: {
                            ...formData.publishing_rules,
                            base_url: e.target.value
                          }
                        })}
                        placeholder="https://your-site.com"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingConfig ? 'Update' : 'Create'} Configuration
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No CMS configurations found. Add one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {config.name}
                      <Badge variant={config.is_active ? 'default' : 'secondary'}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {config.platform_type} • Created {new Date(config.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testConnection(config)}
                    >
                      <TestTube2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(config)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(config)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Site ID</p>
                    <p className="font-mono">{config.site_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Collection ID</p>
                    <p className="font-mono">{config.collection_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Publications</p>
                    <p>{config._count?.cms_publications || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Publishing History</p>
                    <p>{config._count?.publishing_history || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
