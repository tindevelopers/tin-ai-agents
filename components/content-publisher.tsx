'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Globe, Send, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PublishResult {
  success: boolean;
  message: string;
  contentId?: string;
  url?: string;
  errors?: string[];
}

interface ValidationError {
  field: string;
  message: string;
}

interface ContentPublisherProps {
  blogId?: string;
  title?: string;
  onPublishSuccess?: (results: { [platform: string]: PublishResult }) => void;
}

export function ContentPublisher({ blogId, title, onPublishSuccess }: ContentPublisherProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [webflowConfig, setWebflowConfig] = useState({
    apiKey: '',
    siteId: '',
    collectionId: ''
  });
  const [wordpressConfig, setWordpressConfig] = useState({
    siteUrl: '',
    username: '',
    password: '',
    defaultCategory: 'AI Generated'
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<{ [platform: string]: PublishResult } | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationError[]>([]);

  const platforms = [
    { id: 'webflow', name: 'Webflow', icon: Globe, description: 'Publish to Webflow CMS' },
    { id: 'wordpress', name: 'WordPress', icon: Send, description: 'Publish to WordPress site' }
  ];

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform to publish to.');
      return;
    }

    setIsPublishing(true);
    setPublishResults(null);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      const requestBody = {
        blogId,
        platforms: selectedPlatforms,
        ...(selectedPlatforms.includes('webflow') && {
          webflowConfig: {
            apiKey: webflowConfig.apiKey,
            siteId: webflowConfig.siteId,
            collectionId: webflowConfig.collectionId || undefined
          }
        }),
        ...(selectedPlatforms.includes('wordpress') && {
          wordpressConfig: {
            siteUrl: wordpressConfig.siteUrl,
            username: wordpressConfig.username,
            password: wordpressConfig.password,
            defaultCategory: wordpressConfig.defaultCategory
          }
        })
      };

      const response = await fetch('/api/content/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.validationErrors) {
        setValidationErrors(result.validationErrors);
      }
      
      if (result.validationWarnings) {
        setValidationWarnings(result.validationWarnings);
      }

      if (result.results) {
        setPublishResults(result.results);
        if (onPublishSuccess && result.success) {
          onPublishSuccess(result.results);
        }
      }

      if (!response.ok) {
        throw new Error(result.error || 'Publishing failed');
      }

    } catch (error) {
      console.error('Publishing error:', error);
      setPublishResults({
        error: {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const renderPlatformConfig = (platform: string) => {
    if (platform === 'webflow') {
      return (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Webflow Configuration</CardTitle>
            <CardDescription>Configure your Webflow API settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="webflow-api-key">API Key</Label>
              <Input
                id="webflow-api-key"
                type="password"
                placeholder="Your Webflow API key"
                value={webflowConfig.apiKey}
                onChange={(e) => setWebflowConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="webflow-site-id">Site ID</Label>
              <Input
                id="webflow-site-id"
                placeholder="Your Webflow site ID"
                value={webflowConfig.siteId}
                onChange={(e) => setWebflowConfig(prev => ({ ...prev, siteId: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="webflow-collection-id">Collection ID (Optional)</Label>
              <Input
                id="webflow-collection-id"
                placeholder="Your Webflow collection ID"
                value={webflowConfig.collectionId}
                onChange={(e) => setWebflowConfig(prev => ({ ...prev, collectionId: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
      );
    }

    if (platform === 'wordpress') {
      return (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">WordPress Configuration</CardTitle>
            <CardDescription>Configure your WordPress site settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="wp-site-url">Site URL</Label>
              <Input
                id="wp-site-url"
                placeholder="https://yoursite.com"
                value={wordpressConfig.siteUrl}
                onChange={(e) => setWordpressConfig(prev => ({ ...prev, siteUrl: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="wp-username">Username</Label>
              <Input
                id="wp-username"
                placeholder="WordPress username"
                value={wordpressConfig.username}
                onChange={(e) => setWordpressConfig(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="wp-password">Application Password</Label>
              <Input
                id="wp-password"
                type="password"
                placeholder="WordPress application password"
                value={wordpressConfig.password}
                onChange={(e) => setWordpressConfig(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="wp-category">Default Category</Label>
              <Input
                id="wp-category"
                placeholder="AI Generated"
                value={wordpressConfig.defaultCategory}
                onChange={(e) => setWordpressConfig(prev => ({ ...prev, defaultCategory: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Content Publisher
        </CardTitle>
        <CardDescription>
          {blogId ? `Publish "${title}" to your content management systems` : 'Publish content to multiple platforms'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Selection */}
        <div>
          <Label className="text-base font-medium">Select Publishing Platforms</Label>
          <div className="mt-3 space-y-3">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);
              
              return (
                <div key={platform.id} className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={platform.id}
                      checked={isSelected}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                    />
                    <Label
                      htmlFor={platform.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{platform.name}</span>
                      <span className="text-sm text-muted-foreground">- {platform.description}</span>
                    </Label>
                  </div>
                  
                  {isSelected && renderPlatformConfig(platform.id)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Validation Errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    <strong>{error.field}:</strong> {error.message}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Recommendations:</div>
              <ul className="list-disc list-inside space-y-1">
                {validationWarnings.map((warning, index) => (
                  <li key={index} className="text-sm">
                    <strong>{warning.field}:</strong> {warning.message}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Publish Results */}
        {publishResults && (
          <div className="space-y-3">
            <Label className="text-base font-medium">Publishing Results</Label>
            {Object.entries(publishResults).map(([platform, result]) => (
              <Card key={platform} className={`border ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <Badge variant={result.success ? 'default' : 'destructive'}>
                        {platform}
                      </Badge>
                    </div>
                    <span className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.success ? 'Published' : 'Failed'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{result.message}</p>
                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline mt-1 block"
                    >
                      View Published Content →
                    </a>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-medium text-red-700">Errors:</div>
                      <ul className="list-disc list-inside text-sm text-red-600 ml-2">
                        {result.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Publish Button */}
        <Button
          onClick={handlePublish}
          disabled={isPublishing || selectedPlatforms.length === 0}
          className="w-full"
          size="lg"
        >
          {isPublishing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Publishing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Publish to {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
