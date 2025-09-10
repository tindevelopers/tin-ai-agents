'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Edit, 
  Globe,
  Eye,
  EyeOff,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  TestTube,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface WebflowConfig {
  id: string;
  platform_type: string;
  name: string;
  site_id?: string;
  collection_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Additional fields for display
  site_name?: string;
  collection_name?: string;
  published_url?: string;
}

interface WebflowSite {
  _id: string;
  name: string;
  shortName: string;
  domains: Array<{ name: string; url: string }>;
}

interface WebflowCollection {
  _id: string;
  name: string;
  slug: string;
  singularName: string;
}

interface WebflowCredentials {
  api_token: string;
  site_id?: string;
  collection_id?: string;
}

const WEBFLOW_FIELD_MAPPINGS = {
  title: { label: 'Title Field', default: 'name', required: true },
  content: { label: 'Content Field', default: 'content', required: true },
  slug: { label: 'Slug Field', default: 'slug', required: true },
  meta_description: { label: 'Meta Description Field', default: 'meta-description', required: false },
  featured_image: { label: 'Featured Image Field', default: 'featured-image', required: false },
  author: { label: 'Author Field', default: 'author', required: false },
  category: { label: 'Category Field', default: 'category', required: false },
  tags: { label: 'Tags Field', default: 'tags', required: false },
  seo_title: { label: 'SEO Title Field', default: 'seo-title', required: false },
  excerpt: { label: 'Excerpt Field', default: 'excerpt', required: false },
  published_date: { label: 'Published Date Field', default: 'published-date', required: false },
};

export default function WebflowConfig() {
  const [configs, setConfigs] = useState<WebflowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<WebflowConfig | null>(null);
  const [showApiToken, setShowApiToken] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  // Available sites and collections
  const [availableSites, setAvailableSites] = useState<WebflowSite[]>([]);
  const [availableCollections, setAvailableCollections] = useState<WebflowCollection[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    api_token: '',
    site_id: '',
    collection_id: '',
    field_mappings: Object.fromEntries(
      Object.entries(WEBFLOW_FIELD_MAPPINGS).map(([key, config]) => [key, config.default])
    ),
    publishing_rules: {
      auto_publish: true,
      base_url: '',
      review_required: false,
    },
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/cms/configs?platform=webflow');
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.configs || []);
      } else {
        toast.error('Failed to fetch Webflow configurations');
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Failed to fetch Webflow configurations');
    } finally {
      setLoading(false);
    }
  };

  // Removed fetchWebflowSites - each API token is site-specific

  const fetchWebflowCollections = async (apiToken: string, siteId: string) => {
    if (!apiToken.trim() || !siteId.trim()) {
      toast.error('API token and site ID are required to fetch collections');
      return;
    }

    setLoadingCollections(true);
    try {
      const response = await fetch('/api/webflow/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_token: apiToken,
          site_id: siteId
        })
      });

      if (response.ok) {
        const collections = await response.json();
        setAvailableCollections(collections);
        toast.success(`Found ${collections.length} collections`);
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(`Failed to fetch collections: ${error.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching Webflow collections:', error);
      toast.error('Failed to fetch collections');
    } finally {
      setLoadingCollections(false);
    }
  };

  const testWebflowConnection = async () => {
    if (!formData.api_token.trim()) {
      toast.error('API token is required for testing');
      return;
    }

    if (!formData.site_id.trim()) {
      toast.error('Site ID is required for testing');
      return;
    }

    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/cms/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform_type: 'webflow',
          api_credentials: {
            api_token: formData.api_token,
            site_id: formData.site_id,
            collection_id: formData.collection_id,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        
        // Automatically fetch collections for this site after successful connection
        if (formData.site_id) {
          await fetchWebflowCollections(formData.api_token, formData.site_id);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Failed to test connection');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleCreateConfig = async () => {
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        toast.error('Configuration name is required');
        return;
      }

      if (!formData.api_token.trim()) {
        toast.error('Webflow API token is required');
        return;
      }

      if (!formData.site_id.trim()) {
        toast.error('Site selection is required');
        return;
      }

      if (!formData.collection_id.trim()) {
        toast.error('Collection selection is required');
        return;
      }

      const response = await fetch('/api/cms/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform_type: 'webflow',
          name: formData.name,
          site_id: formData.site_id,
          collection_id: formData.collection_id,
          api_credentials: {
            api_token: formData.api_token,
            site_id: formData.site_id,
            collection_id: formData.collection_id,
          },
          field_mappings: formData.field_mappings,
          publishing_rules: formData.publishing_rules,
        }),
      });

      if (response.ok) {
        toast.success('Webflow configuration created successfully');
        setIsDialogOpen(false);
        resetForm();
        fetchConfigs();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create configuration');
      }
    } catch (error) {
      console.error('Error creating config:', error);
      toast.error('Failed to create configuration');
    }
  };

  const handleUpdateConfig = async () => {
    if (!editingConfig) return;

    try {
      const response = await fetch(`/api/cms/configs/${editingConfig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          site_id: formData.site_id,
          collection_id: formData.collection_id,
          api_credentials: {
            api_token: formData.api_token,
            site_id: formData.site_id,
            collection_id: formData.collection_id,
          },
          field_mappings: formData.field_mappings,
          publishing_rules: formData.publishing_rules,
        }),
      });

      if (response.ok) {
        toast.success('Configuration updated successfully');
        setIsDialogOpen(false);
        setEditingConfig(null);
        resetForm();
        fetchConfigs();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Failed to update configuration');
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this Webflow configuration?')) return;

    try {
      const response = await fetch(`/api/cms/configs/${configId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Configuration deleted successfully');
        fetchConfigs();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete configuration');
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Failed to delete configuration');
    }
  };

  const handleToggleActive = async (configId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/cms/configs/${configId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (response.ok) {
        toast.success(`Configuration ${isActive ? 'activated' : 'deactivated'}`);
        fetchConfigs();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Failed to update configuration');
    }
  };

  const handleEditConfig = async (config: WebflowConfig) => {
    try {
      // Fetch the full config with credentials
      const response = await fetch(`/api/cms/configs/${config.id}`);
      if (response.ok) {
        const data = await response.json();
        const fullConfig = data.config;
        
        setEditingConfig(config);
        setFormData({
          name: fullConfig.name,
          api_token: fullConfig.api_credentials?.api_token || '',
          site_id: fullConfig.site_id || '',
          collection_id: fullConfig.collection_id || '',
          field_mappings: fullConfig.field_mappings || Object.fromEntries(
            Object.entries(WEBFLOW_FIELD_MAPPINGS).map(([key, config]) => [key, config.default])
          ),
          publishing_rules: fullConfig.publishing_rules || {
            auto_publish: true,
            base_url: '',
            review_required: false,
          },
        });
        setIsDialogOpen(true);
      } else {
        toast.error('Failed to fetch configuration details');
      }
    } catch (error) {
      console.error('Error fetching config details:', error);
      toast.error('Failed to fetch configuration details');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      api_token: '',
      site_id: '',
      collection_id: '',
      field_mappings: Object.fromEntries(
        Object.entries(WEBFLOW_FIELD_MAPPINGS).map(([key, config]) => [key, config.default])
      ),
      publishing_rules: {
        auto_publish: true,
        base_url: '',
        review_required: false,
      },
    });
    setEditingConfig(null);
    setAvailableSites([]);
    setAvailableCollections([]);
    setShowApiToken(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Webflow CMS Configuration
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect your Webflow site to automatically publish blog posts
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Webflow Site
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit' : 'Add'} Webflow Configuration
              </DialogTitle>
              <DialogDescription>
                {editingConfig 
                  ? 'Update your Webflow site configuration'
                  : 'Connect a new Webflow site for automated blog publishing'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Configuration Form */}
              <Tabs defaultValue="connection" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="connection">Connection</TabsTrigger>
                  <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
                  <TabsTrigger value="publishing">Publishing Rules</TabsTrigger>
                </TabsList>
                
                <TabsContent value="connection" className="space-y-4">
                  <div>
                    <Label htmlFor="name">Configuration Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., My Blog Site"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="api_token">Webflow API Token *</Label>
                    <div className="relative">
                      <Input
                        id="api_token"
                        type={showApiToken ? 'text' : 'password'}
                        placeholder="Enter your Webflow API token"
                        value={formData.api_token}
                        onChange={(e) => setFormData(prev => ({ ...prev, api_token: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiToken(!showApiToken)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showApiToken ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Get your site-specific API token from Webflow: Site Settings → Integrations → API Access
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testWebflowConnection}
                      disabled={isTestingConnection || !formData.api_token.trim() || !formData.site_id.trim()}
                      className="flex items-center gap-2"
                    >
                      {isTestingConnection ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                      Test Connection
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="site_id">Webflow Site ID *</Label>
                    <Input
                      id="site_id"
                      name="site_id"
                      value={formData.site_id}
                      onChange={handleInputChange}
                      placeholder="e.g., 507f1f77bcf86cd799439011"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Find your Site ID in Webflow: Site Settings → General → Site ID
                    </p>
                  </div>

                  {formData.site_id && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fetchWebflowCollections(formData.api_token, formData.site_id)}
                        disabled={loadingCollections}
                        className="flex items-center gap-2"
                      >
                        {loadingCollections ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Load Collections
                      </Button>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="collection_id">Blog Collection *</Label>
                    <Select 
                      value={formData.collection_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, collection_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a collection for blog posts" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCollections.map((collection) => (
                          <SelectItem key={collection._id} value={collection._id}>
                            <div className="flex items-center gap-2">
                              <span>{collection.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {collection.singularName}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="mapping" className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Field Mapping</p>
                        <p>
                          Map your blog post fields to the corresponding fields in your Webflow collection.
                          Use the exact field names as they appear in your Webflow CMS.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(WEBFLOW_FIELD_MAPPINGS).map(([key, config]) => (
                      <div key={key}>
                        <Label htmlFor={key}>
                          {config.label} {config.required && '*'}
                        </Label>
                        <Input
                          id={key}
                          placeholder={config.default}
                          value={formData.field_mappings[key] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            field_mappings: { ...prev.field_mappings, [key]: e.target.value }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="publishing" className="space-y-4">
                  <div>
                    <Label htmlFor="base_url">Site Base URL</Label>
                    <Input
                      id="base_url"
                      placeholder="https://your-site.webflow.io"
                      value={formData.publishing_rules.base_url}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        publishing_rules: { ...prev.publishing_rules, base_url: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_publish"
                      checked={formData.publishing_rules.auto_publish}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        publishing_rules: { ...prev.publishing_rules, auto_publish: checked }
                      }))}
                    />
                    <Label htmlFor="auto_publish">Auto-publish posts (make them live immediately)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="review_required"
                      checked={formData.publishing_rules.review_required}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        publishing_rules: { ...prev.publishing_rules, review_required: checked }
                      }))}
                    />
                    <Label htmlFor="review_required">Require manual review before publishing</Label>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingConfig ? handleUpdateConfig : handleCreateConfig}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingConfig ? 'Update' : 'Create'} Configuration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Configurations List */}
      {configs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Webflow Configurations
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Connect your Webflow site to start publishing your blog posts automatically.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Webflow Site
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <Card key={config.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-600 text-white">
                      <Globe className="w-6 h-6" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {config.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">Webflow</Badge>
                        {config.site_name && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {config.site_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Created {new Date(config.created_at).toLocaleDateString()}
                        {config.published_url && (
                          <>
                            {' • '}
                            <a 
                              href={config.published_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                            >
                              View Site <ExternalLink className="w-3 h-3" />
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.is_active}
                        onCheckedChange={(checked) => handleToggleActive(config.id, checked)}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {config.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditConfig(config)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConfig(config.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
