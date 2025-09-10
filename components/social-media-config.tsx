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
import { 
  Plus, 
  Settings, 
  Trash2, 
  Edit, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Instagram, 
  Globe,
  Eye,
  EyeOff,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface SocialConfig {
  id: string;
  platform_type: string;
  name: string;
  account_handle?: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

interface SocialCredentials {
  [key: string]: string;
}

const PLATFORM_CONFIGS = {
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-600',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', required: true },
      { key: 'user_id', label: 'User ID', type: 'text', required: true },
    ],
    description: 'Publish articles and posts to your LinkedIn profile or company page.',
  },
  twitter: {
    name: 'Twitter/X',
    icon: Twitter,
    color: 'bg-black',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'api_secret', label: 'API Secret', type: 'password', required: true },
      { key: 'access_token', label: 'Access Token', type: 'password', required: true },
      { key: 'access_token_secret', label: 'Access Token Secret', type: 'password', required: true },
    ],
    description: 'Post tweets and threads to your Twitter/X account.',
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-500',
    fields: [
      { key: 'access_token', label: 'Page Access Token', type: 'password', required: true },
      { key: 'page_id', label: 'Page ID', type: 'text', required: true },
    ],
    description: 'Publish posts to your Facebook page.',
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', required: true },
      { key: 'user_id', label: 'Instagram Business Account ID', type: 'text', required: true },
    ],
    description: 'Share posts and stories to your Instagram business account.',
  },
  tumblr: {
    name: 'Tumblr',
    icon: Globe,
    color: 'bg-indigo-600',
    fields: [
      { key: 'consumer_key', label: 'Consumer Key', type: 'password', required: true },
      { key: 'consumer_secret', label: 'Consumer Secret', type: 'password', required: true },
      { key: 'token', label: 'Token', type: 'password', required: true },
      { key: 'token_secret', label: 'Token Secret', type: 'password', required: true },
      { key: 'blog_name', label: 'Blog Name', type: 'text', required: true },
    ],
    description: 'Publish posts to your Tumblr blog.',
  },
};

export default function SocialMediaConfig() {
  const [configs, setConfigs] = useState<SocialConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SocialConfig | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('linkedin');
  const [showCredentials, setShowCredentials] = useState<{ [key: string]: boolean }>({});
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    account_handle: '',
    credentials: {} as SocialCredentials,
    publishing_rules: {
      auto_hashtags: '',
      default_message: '',
      include_link: true,
    },
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/social/configs');
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.configs || []);
      } else {
        toast.error('Failed to fetch social media configurations');
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Failed to fetch social media configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async () => {
    try {
      const platformConfig = PLATFORM_CONFIGS[selectedPlatform as keyof typeof PLATFORM_CONFIGS];
      
      // Validate required fields
      const missingFields = platformConfig.fields
        .filter(field => field.required && !formData.credentials[field.key])
        .map(field => field.label);
      
      if (missingFields.length > 0) {
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      if (!formData.name.trim()) {
        toast.error('Configuration name is required');
        return;
      }

      const response = await fetch('/api/social/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform_type: selectedPlatform,
          name: formData.name,
          account_handle: formData.account_handle,
          api_credentials: formData.credentials,
          publishing_rules: formData.publishing_rules,
        }),
      });

      if (response.ok) {
        toast.success('Social media configuration created successfully');
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
      const response = await fetch(`/api/social/configs/${editingConfig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          account_handle: formData.account_handle,
          api_credentials: formData.credentials,
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
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      const response = await fetch(`/api/social/configs/${configId}`, {
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
      const response = await fetch(`/api/social/configs/${configId}`, {
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

  const handleEditConfig = async (config: SocialConfig) => {
    try {
      // Fetch the full config with credentials
      const response = await fetch(`/api/social/configs/${config.id}`);
      if (response.ok) {
        const data = await response.json();
        const fullConfig = data.config;
        
        setEditingConfig(config);
        setSelectedPlatform(config.platform_type);
        setFormData({
          name: fullConfig.name,
          account_handle: fullConfig.account_handle || '',
          credentials: fullConfig.api_credentials || {},
          publishing_rules: fullConfig.publishing_rules || {
            auto_hashtags: '',
            default_message: '',
            include_link: true,
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
      account_handle: '',
      credentials: {},
      publishing_rules: {
        auto_hashtags: '',
        default_message: '',
        include_link: true,
      },
    });
    setEditingConfig(null);
    setSelectedPlatform('linkedin');
    setShowCredentials({});
  };

  const getPlatformIcon = (platform: string) => {
    const config = PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS];
    if (!config) return Globe;
    return config.icon;
  };

  const getPlatformColor = (platform: string) => {
    const config = PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS];
    return config?.color || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className=\"flex items-center justify-center p-8\">
        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600\"></div>
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h2 className=\"text-2xl font-bold text-gray-900 dark:text-gray-100\">
            Social Media Configurations
          </h2>
          <p className=\"text-gray-600 dark:text-gray-400 mt-1\">
            Manage your social media platform connections for automated publishing
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className=\"flex items-center gap-2\">
              <Plus className=\"w-4 h-4\" />
              Add Platform
            </Button>
          </DialogTrigger>
          
          <DialogContent className=\"max-w-2xl max-h-[90vh] overflow-y-auto\">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit' : 'Add'} Social Media Configuration
              </DialogTitle>
              <DialogDescription>
                {editingConfig 
                  ? 'Update your social media platform configuration'
                  : 'Connect a new social media platform for automated publishing'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className=\"space-y-6\">
              {/* Platform Selection (only for new configs) */}
              {!editingConfig && (
                <div>
                  <Label className=\"text-sm font-medium mb-3 block\">Select Platform</Label>
                  <div className=\"grid grid-cols-2 gap-3\">
                    {Object.entries(PLATFORM_CONFIGS).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedPlatform(key)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedPlatform === key
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className=\"flex items-center gap-3\">
                            <div className={`p-2 rounded-lg ${config.color} text-white`}>
                              <Icon className=\"w-5 h-5\" />
                            </div>
                            <div className=\"text-left\">
                              <div className=\"font-medium\">{config.name}</div>
                              <div className=\"text-sm text-gray-500 dark:text-gray-400\">
                                {config.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Configuration Form */}
              <Tabs defaultValue=\"basic\" className=\"w-full\">
                <TabsList className=\"grid w-full grid-cols-2\">
                  <TabsTrigger value=\"basic\">Basic Info</TabsTrigger>
                  <TabsTrigger value=\"credentials\">API Credentials</TabsTrigger>
                </TabsList>
                
                <TabsContent value=\"basic\" className=\"space-y-4\">
                  <div>
                    <Label htmlFor=\"name\">Configuration Name *</Label>
                    <Input
                      id=\"name\"
                      placeholder=\"e.g., My LinkedIn Account\"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor=\"handle\">Account Handle</Label>
                    <Input
                      id=\"handle\"
                      placeholder=\"@username or profile identifier\"
                      value={formData.account_handle}
                      onChange={(e) => setFormData(prev => ({ ...prev, account_handle: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor=\"hashtags\">Default Hashtags</Label>
                    <Input
                      id=\"hashtags\"
                      placeholder=\"#ai #content #blog\"
                      value={formData.publishing_rules.auto_hashtags}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        publishing_rules: { ...prev.publishing_rules, auto_hashtags: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor=\"message\">Default Message Template</Label>
                    <Textarea
                      id=\"message\"
                      placeholder=\"Check out my latest blog post: {title}\"
                      value={formData.publishing_rules.default_message}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        publishing_rules: { ...prev.publishing_rules, default_message: e.target.value }
                      }))}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value=\"credentials\" className=\"space-y-4\">
                  {PLATFORM_CONFIGS[selectedPlatform as keyof typeof PLATFORM_CONFIGS]?.fields.map((field) => (
                    <div key={field.key}>
                      <Label htmlFor={field.key}>
                        {field.label} {field.required && '*'}
                      </Label>
                      <div className=\"relative\">
                        <Input
                          id={field.key}
                          type={field.type === 'password' && !showCredentials[field.key] ? 'password' : 'text'}
                          placeholder={`Enter your ${field.label.toLowerCase()}`}
                          value={formData.credentials[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            credentials: { ...prev.credentials, [field.key]: e.target.value }
                          }))}
                        />
                        {field.type === 'password' && (
                          <button
                            type=\"button\"
                            onClick={() => setShowCredentials(prev => ({
                              ...prev,
                              [field.key]: !prev[field.key]
                            }))}
                            className=\"absolute right-3 top-1/2 transform -translate-y-1/2\"
                          >
                            {showCredentials[field.key] ? (
                              <EyeOff className=\"w-4 h-4 text-gray-400\" />
                            ) : (
                              <Eye className=\"w-4 h-4 text-gray-400\" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className=\"bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg\">
                    <div className=\"flex items-start gap-2\">
                      <AlertCircle className=\"w-5 h-5 text-blue-600 mt-0.5\" />
                      <div className=\"text-sm text-blue-800 dark:text-blue-200\">
                        <p className=\"font-medium mb-1\">API Setup Instructions:</p>
                        <p>
                          {PLATFORM_CONFIGS[selectedPlatform as keyof typeof PLATFORM_CONFIGS]?.description}
                          Visit the platform's developer documentation to obtain your API credentials.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className=\"flex justify-end gap-3 pt-4 border-t\">
                <Button
                  variant=\"outline\"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingConfig ? handleUpdateConfig : handleCreateConfig}
                  className=\"flex items-center gap-2\"
                >
                  <Save className=\"w-4 h-4\" />
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
          <CardContent className=\"flex flex-col items-center justify-center py-12\">
            <Settings className=\"w-12 h-12 text-gray-400 mb-4\" />
            <h3 className=\"text-lg font-medium text-gray-900 dark:text-gray-100 mb-2\">
              No Social Media Configurations
            </h3>
            <p className=\"text-gray-600 dark:text-gray-400 text-center mb-6\">
              Connect your social media accounts to start publishing your blog posts automatically.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className=\"flex items-center gap-2\">
              <Plus className=\"w-4 h-4\" />
              Add Your First Platform
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className=\"grid gap-4\">
          {configs.map((config) => {
            const Icon = getPlatformIcon(config.platform_type);
            const platformColor = getPlatformColor(config.platform_type);
            const platformName = PLATFORM_CONFIGS[config.platform_type as keyof typeof PLATFORM_CONFIGS]?.name || config.platform_type;
            
            return (
              <Card key={config.id} className=\"hover:shadow-md transition-shadow\">
                <CardContent className=\"p-6\">
                  <div className=\"flex items-center justify-between\">
                    <div className=\"flex items-center gap-4\">
                      <div className={`p-3 rounded-lg ${platformColor} text-white`}>
                        <Icon className=\"w-6 h-6\" />
                      </div>
                      
                      <div>
                        <h3 className=\"font-semibold text-gray-900 dark:text-gray-100\">
                          {config.name}
                        </h3>
                        <div className=\"flex items-center gap-2 mt-1\">
                          <Badge variant=\"secondary\">{platformName}</Badge>
                          {config.account_handle && (
                            <span className=\"text-sm text-gray-600 dark:text-gray-400\">
                              {config.account_handle}
                            </span>
                          )}
                        </div>
                        <p className=\"text-sm text-gray-500 dark:text-gray-400 mt-1\">
                          Created {new Date(config.created_at).toLocaleDateString()}
                          {config.last_used_at && (
                            <> • Last used {new Date(config.last_used_at).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className=\"flex items-center gap-3\">
                      <div className=\"flex items-center gap-2\">
                        <Switch
                          checked={config.is_active}
                          onCheckedChange={(checked) => handleToggleActive(config.id, checked)}
                        />
                        <span className=\"text-sm text-gray-600 dark:text-gray-400\">
                          {config.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className=\"flex items-center gap-1\">
                        <Button
                          variant=\"ghost\"
                          size=\"sm\"
                          onClick={() => handleEditConfig(config)}
                        >
                          <Edit className=\"w-4 h-4\" />
                        </Button>
                        <Button
                          variant=\"ghost\"
                          size=\"sm\"
                          onClick={() => handleDeleteConfig(config.id)}
                          className=\"text-red-600 hover:text-red-700\"
                        >
                          <Trash2 className=\"w-4 h-4\" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
