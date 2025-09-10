'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube,
  Send,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface WebflowConfig {
  id: string;
  name: string;
  platform_type: string;
  site_id?: string;
  collection_id?: string;
  is_active: boolean;
}

interface BlogPost {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export default function WebflowTestPublisher() {
  const [configs, setConfigs] = useState<WebflowConfig[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [selectedBlogPost, setSelectedBlogPost] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Webflow configurations
      const configsResponse = await fetch('/api/cms/configs?platform=webflow');
      if (configsResponse.ok) {
        const configsData = await configsResponse.json();
        setConfigs(configsData.configs || []);
      }

      // Fetch blog posts
      const postsResponse = await fetch('/api/blog/list');
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setBlogPosts(postsData.posts || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTestPublish = async (useExistingPost: boolean = false) => {
    if (!selectedConfig) {
      toast.error('Please select a Webflow configuration');
      return;
    }

    if (useExistingPost && !selectedBlogPost) {
      toast.error('Please select a blog post to publish');
      return;
    }

    setIsPublishing(true);
    setPublishResult(null);

    try {
      const response = await fetch('/api/cms/test-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cms_config_id: selectedConfig,
          blog_post_id: useExistingPost ? selectedBlogPost : null,
        }),
      });

      const result = await response.json();
      setPublishResult(result);

      if (result.success) {
        toast.success('Test blog post published successfully to Webflow!');
      } else {
        toast.error(result.error || 'Failed to publish test post');
      }
    } catch (error) {
      console.error('Error publishing test post:', error);
      toast.error('Failed to publish test post');
      setPublishResult({
        success: false,
        error: 'Network error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsPublishing(false);
    }
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Webflow Publishing Test
          </CardTitle>
          <CardDescription>
            Test your Webflow integration by publishing a sample blog post to your CMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {configs.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Webflow Configurations
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You need to set up a Webflow configuration before testing.
              </p>
              <Button onClick={() => window.location.href = '/settings/webflow'}>
                Configure Webflow
              </Button>
            </div>
          ) : (
            <>
              {/* Configuration Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Webflow Configuration
                </label>
                <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a Webflow configuration" />
                  </SelectTrigger>
                  <SelectContent>
                    {configs.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        <div className="flex items-center gap-2">
                          <span>{config.name}</span>
                          <Badge variant={config.is_active ? "default" : "secondary"}>
                            {config.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Blog Post Selection (Optional) */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Blog Post (Optional)
                </label>
                <Select value={selectedBlogPost} onValueChange={setSelectedBlogPost}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an existing blog post or leave empty for test post" />
                  </SelectTrigger>
                  <SelectContent>
                    {blogPosts.map((post) => (
                      <SelectItem key={post.id} value={post.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-xs">{post.title}</span>
                          <Badge variant="outline">{post.status}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to publish a generated test post
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleTestPublish(false)}
                  disabled={isPublishing || !selectedConfig}
                  className="flex items-center gap-2"
                >
                  {isPublishing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                  Publish Test Post
                </Button>

                {selectedBlogPost && (
                  <Button
                    onClick={() => handleTestPublish(true)}
                    disabled={isPublishing || !selectedConfig}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isPublishing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Publish Selected Post
                  </Button>
                )}
              </div>

              {/* Results */}
              {publishResult && (
                <Card className={`border-l-4 ${
                  publishResult.success 
                    ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      {publishResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          publishResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                        }`}>
                          {publishResult.success ? 'Success!' : 'Error'}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          publishResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                        }`}>
                          {publishResult.message || publishResult.error}
                        </p>

                        {publishResult.success && publishResult.result && (
                          <div className="mt-3 space-y-2">
                            <div className="text-sm">
                              <strong>External ID:</strong> {publishResult.result.external_id}
                            </div>
                            {publishResult.result.published_url && (
                              <div className="text-sm">
                                <strong>Published URL:</strong>{' '}
                                <a
                                  href={publishResult.result.published_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                                >
                                  View Post <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                            <div className="text-sm">
                              <strong>Blog Post:</strong> {publishResult.result.blog_post?.title}
                            </div>
                          </div>
                        )}

                        {publishResult.details && (
                          <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                            <strong>Details:</strong> {publishResult.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
