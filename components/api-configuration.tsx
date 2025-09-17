'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  Globe, 
  Zap,
  Settings,
  Eye,
  Play,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';

interface ApiEndpoint {
  name: string;
  path: string;
  method: string;
  description: string;
  category: string;
  status?: 'online' | 'offline' | 'testing' | 'error';
  responseTime?: number;
  lastChecked?: string;
}

interface ApiProvider {
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'testing' | 'error';
  endpoints: number;
  lastChecked?: string;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  // Blog Generation APIs
  {
    name: 'Generate Blog Post',
    path: '/api/blog/generate',
    method: 'POST',
    description: 'Generate AI-powered blog content with streaming response',
    category: 'Blog Generation'
  },
  {
    name: 'Save Blog Post',
    path: '/api/blog/save',
    method: 'POST',
    description: 'Save generated blog posts to database',
    category: 'Blog Generation'
  },
  {
    name: 'List Blog Posts',
    path: '/api/blog/list',
    method: 'GET',
    description: 'Retrieve all saved blog posts',
    category: 'Blog Generation'
  },
  {
    name: 'Generate Blog Images',
    path: '/api/blog/generate-images',
    method: 'POST',
    description: 'Generate images for blog posts using AI',
    category: 'Blog Generation'
  },
  {
    name: 'Generate Backlinks',
    path: '/api/blog/generate-backlinks',
    method: 'POST',
    description: 'Generate backlink suggestions for blog posts',
    category: 'Blog Generation'
  },
  
  // Content Management APIs
  {
    name: 'Content Ideas',
    path: '/api/content/ideas',
    method: 'POST',
    description: 'Generate content ideas based on keywords',
    category: 'Content Management'
  },
  {
    name: 'Content Strategy',
    path: '/api/content/strategy',
    method: 'POST',
    description: 'Generate content strategy recommendations',
    category: 'Content Management'
  },
  {
    name: 'Content Test',
    path: '/api/content/test',
    method: 'POST',
    description: 'Test content before publishing',
    category: 'Content Management'
  },
  {
    name: 'Content Publish',
    path: '/api/content/publish',
    method: 'POST',
    description: 'Publish content to multiple platforms',
    category: 'Content Management'
  },
  
  // AI Generation APIs
  {
    name: 'AI Generate',
    path: '/api/ai/generate',
    method: 'POST',
    description: 'General AI text generation endpoint',
    category: 'AI Services'
  },
  
  // Keyword APIs
  {
    name: 'Search Keywords',
    path: '/api/keywords/search',
    method: 'POST',
    description: 'Search for keywords using DataForSEO',
    category: 'Keywords'
  },
  {
    name: 'Save Keywords',
    path: '/api/keywords/save',
    method: 'POST',
    description: 'Save keyword sets to database',
    category: 'Keywords'
  },
  {
    name: 'Cluster Keywords',
    path: '/api/keywords/cluster',
    method: 'POST',
    description: 'Group keywords into semantic clusters',
    category: 'Keywords'
  },
  {
    name: 'Keyword Ideas',
    path: '/api/keywords/ideas',
    method: 'POST',
    description: 'Generate keyword ideas and suggestions',
    category: 'Keywords'
  },
  {
    name: 'Keyword Overview',
    path: '/api/keywords/overview',
    method: 'POST',
    description: 'Get keyword overview and metrics',
    category: 'Keywords'
  },
  {
    name: 'Keyword Suggestions',
    path: '/api/keywords/suggestions',
    method: 'POST',
    description: 'Get keyword suggestions based on seed keywords',
    category: 'Keywords'
  },
  
  // Publishing APIs
  {
    name: 'Publish to Blog',
    path: '/api/publish/blog',
    method: 'POST',
    description: 'Publish content to blog platforms',
    category: 'Publishing'
  },
  {
    name: 'Bulk Publish',
    path: '/api/publish/bulk',
    method: 'POST',
    description: 'Publish multiple posts in bulk',
    category: 'Publishing'
  },
  
  // CMS APIs
  {
    name: 'CMS Configs',
    path: '/api/cms/configs',
    method: 'GET',
    description: 'Get CMS configuration settings',
    category: 'CMS'
  },
  {
    name: 'Test CMS Connection',
    path: '/api/cms/test-connection',
    method: 'POST',
    description: 'Test connection to CMS platforms',
    category: 'CMS'
  },
  {
    name: 'Test CMS Publish',
    path: '/api/cms/test-publish',
    method: 'POST',
    description: 'Test publishing to CMS platforms',
    category: 'CMS'
  },
  
  // Social Media APIs
  {
    name: 'Social Configs',
    path: '/api/social/configs',
    method: 'GET',
    description: 'Get social media configuration settings',
    category: 'Social Media'
  },
  {
    name: 'Publish Social',
    path: '/api/social/publish',
    method: 'POST',
    description: 'Publish content to social media platforms',
    category: 'Social Media'
  },
  
  // Sync APIs
  {
    name: 'Sync Status',
    path: '/api/sync/status',
    method: 'GET',
    description: 'Get synchronization status across platforms',
    category: 'Synchronization'
  },
  {
    name: 'Sync Content',
    path: '/api/sync/content',
    method: 'POST',
    description: 'Synchronize content across platforms',
    category: 'Synchronization'
  },
  {
    name: 'Sync Keywords',
    path: '/api/sync/keywords',
    method: 'POST',
    description: 'Synchronize keywords across systems',
    category: 'Synchronization'
  },
  {
    name: 'Sync Images',
    path: '/api/sync/images',
    method: 'POST',
    description: 'Synchronize images across platforms',
    category: 'Synchronization'
  },
  
  // Utility APIs
  {
    name: 'Health Check',
    path: '/api/health',
    method: 'GET',
    description: 'System health check endpoint',
    category: 'System'
  },
  {
    name: 'Asset Retrieval',
    path: '/api/asset-retrieval',
    method: 'GET',
    description: 'Retrieve assets and media files',
    category: 'System'
  },
  {
    name: 'Topics',
    path: '/api/topics',
    method: 'GET',
    description: 'Get available topics for content generation',
    category: 'System'
  }
];

const API_PROVIDERS: ApiProvider[] = [
  {
    name: 'AbacusAI',
    type: 'AI Content Generation',
    status: 'connected',
    endpoints: 2,
    lastChecked: new Date().toISOString()
  },
  {
    name: 'DataForSEO',
    type: 'SEO & Keywords',
    status: 'connected',
    endpoints: 6,
    lastChecked: new Date().toISOString()
  },
  {
    name: 'Stability AI',
    type: 'Image Generation',
    status: 'connected',
    endpoints: 3,
    lastChecked: new Date().toISOString()
  },
  {
    name: 'Webflow',
    type: 'CMS',
    status: 'disconnected',
    endpoints: 2,
    lastChecked: new Date().toISOString()
  }
];

export default function ApiConfiguration() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(API_ENDPOINTS);
  const [providers, setProviders] = useState<ApiProvider[]>(API_PROVIDERS);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(API_ENDPOINTS.map(ep => ep.category)))];

  const filteredEndpoints = selectedCategory === 'all' 
    ? endpoints 
    : endpoints.filter(ep => ep.category === selectedCategory);

  const testEndpoint = async (endpoint: ApiEndpoint) => {
    setEndpoints(prev => prev.map(ep => 
      ep.path === endpoint.path ? { ...ep, status: 'testing' } : ep
    ));

    try {
      const startTime = Date.now();
      
      // Test the endpoint based on its method
      let response;
      if (endpoint.method === 'GET') {
        response = await fetch(endpoint.path);
      } else {
        // For POST endpoints, send a minimal test payload
        const testPayload = getTestPayload(endpoint.path);
        response = await fetch(endpoint.path, {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });
      }

      const responseTime = Date.now() - startTime;
      
      setEndpoints(prev => prev.map(ep => 
        ep.path === endpoint.path ? { 
          ...ep, 
          status: response.ok ? 'online' : 'error',
          responseTime,
          lastChecked: new Date().toISOString()
        } : ep
      ));
    } catch (error) {
      setEndpoints(prev => prev.map(ep => 
        ep.path === endpoint.path ? { 
          ...ep, 
          status: 'error',
          lastChecked: new Date().toISOString()
        } : ep
      ));
    }
  };

  const getTestPayload = (path: string) => {
    // Return appropriate test payload based on endpoint
    switch (path) {
      case '/api/blog/generate':
        return { title: 'Test Post', keywords: ['test'], tone: 'professional', wordCount: 500 };
      case '/api/content/ideas':
        return { keywords: ['test'], category: 'technology' };
      case '/api/keywords/search':
        return { keywords: ['test'], language_code: 'en' };
      default:
        return {};
    }
  };

  const testAllEndpoints = async () => {
    setIsTesting(true);
    for (const endpoint of filteredEndpoints) {
      await testEndpoint(endpoint);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setIsTesting(false);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'testing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Testing</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getProviderStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{API_ENDPOINTS.length}</div>
            <p className="text-xs text-muted-foreground">
              Available API endpoints
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {endpoints.filter(ep => ep.status === 'online').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Endpoints responding
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.length}</div>
            <p className="text-xs text-muted-foreground">
              External services
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {endpoints.filter(ep => ep.responseTime).length > 0 
                ? Math.round(endpoints.filter(ep => ep.responseTime).reduce((acc, ep) => acc + (ep.responseTime || 0), 0) / endpoints.filter(ep => ep.responseTime).length)
                : 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Providers Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Providers Status
          </CardTitle>
          <CardDescription>
            Monitor the status of external API providers and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {providers.map((provider, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{provider.name}</h4>
                  <p className="text-sm text-muted-foreground">{provider.type}</p>
                  <p className="text-xs text-muted-foreground">{provider.endpoints} endpoints</p>
                </div>
                {getProviderStatusIcon(provider.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            API Endpoints
          </CardTitle>
          <CardDescription>
            Test and monitor all available API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Category:</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button 
                onClick={testAllEndpoints} 
                disabled={isTesting}
                variant="outline"
                size="sm"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing All...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Test All Endpoints
                  </>
                )}
              </Button>
            </div>

            {/* Endpoints List */}
            <div className="space-y-2">
              {filteredEndpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {endpoint.path}
                      </code>
                      {getStatusIcon(endpoint.status)}
                      {getStatusBadge(endpoint.status)}
                    </div>
                    
                    <h4 className="font-medium">{endpoint.name}</h4>
                    <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    
                    {endpoint.responseTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Response time: {endpoint.responseTime}ms
                      </p>
                    )}
                    
                    {endpoint.lastChecked && (
                      <p className="text-xs text-muted-foreground">
                        Last checked: {new Date(endpoint.lastChecked).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testEndpoint(endpoint)}
                      disabled={endpoint.status === 'testing'}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            API Documentation
          </CardTitle>
          <CardDescription>
            Quick reference for API usage and authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Most endpoints require authentication via NextAuth.js session. 
                POST endpoints typically require JSON payloads with appropriate data structures.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  All endpoints use session-based authentication. Make sure you're logged in before making requests.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Rate Limits</h4>
                <p className="text-sm text-muted-foreground">
                  API calls are rate-limited. Avoid rapid successive requests to prevent throttling.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
