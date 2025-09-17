'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Share2, 
  Calendar, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Instagram, 
  Globe,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface SocialConfig {
  id: string;
  platform_type: string;
  name: string;
  account_handle?: string;
  is_active: boolean;
}

interface SocialMediaPublisherProps {
  blogId: string;
  blogTitle: string;
  blogContent: string;
  blogExcerpt?: string;
  featuredImage?: string;
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORM_ICONS = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  tumblr: Globe,
};

const PLATFORM_COLORS = {
  linkedin: 'bg-blue-600',
  twitter: 'bg-black',
  facebook: 'bg-blue-500',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  tumblr: 'bg-indigo-600',
};

const PLATFORM_NAMES = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tumblr: 'Tumblr',
};

export default function SocialMediaPublisher({
  blogId,
  blogTitle,
  blogContent,
  blogExcerpt,
  featuredImage,
  isOpen,
  onClose,
}: SocialMediaPublisherProps) {
  const [configs, setConfigs] = useState<SocialConfig[]>([]);
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Publishing options
  const [publishNow, setPublishNow] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [customContent, setCustomContent] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      fetchConfigs();
    }
  }, [isOpen]);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/social/configs');
      if (response.ok) {
        const data = await response.json();
        const activeConfigs = data.configs?.filter((config: SocialConfig) => config.is_active) || [];
        setConfigs(activeConfigs);
        
        // Auto-select all active configs
        setSelectedConfigs(activeConfigs.map((config: SocialConfig) => config.id));
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

  const generateDefaultContent = (platform: string) => {
    const maxLength = platform === 'twitter' ? 240 : 500; // Leave room for links/hashtags
    const excerpt = blogExcerpt || blogContent.substring(0, 200) + '...';
    
    let content = `${blogTitle}\n\n${excerpt}`;
    
    if (content.length > maxLength) {
      content = content.substring(0, maxLength - 3) + '...';
    }
    
    return content;
  };

  const handleConfigToggle = (configId: string) => {
    setSelectedConfigs(prev => 
      prev.includes(configId) 
        ? prev.filter(id => id !== configId)
        : [...prev, configId]
    );
  };

  const handleTestContent = async () => {
    if (selectedConfigs.length === 0) {
      toast.error('Please select at least one platform to test');
      return;
    }

    setPublishing(true);
    setPublishResults([]);

    try {
      // Get platform names from selected configs
      const platformNames = configs
        .filter(config => selectedConfigs.includes(config.id))
        .map(config => config.platform_type);

      const response = await fetch('/api/content/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            type: 'social-post',
            title: blogTitle,
            content: customContent[platformNames[0]] || blogContent,
            excerpt: blogExcerpt,
            tags: blogContent.match(/#\w+/g)?.map(tag => tag.substring(1)) || [],
            images: featuredImage ? [{ url: featuredImage, alt: blogTitle }] : undefined,
            hashtags: blogContent.match(/#\w+/g)?.map(tag => tag.substring(1)) || []
          },
          platforms: platformNames
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // Transform test results to match publishResults format
          const testResults = result.results.map((r: any) => ({
            platform: r.platform,
            status: r.success ? 'tested' : 'incompatible',
            test_score: r.score,
            issues: r.issues,
            suggestions: r.suggestions,
            config_name: configs.find(c => c.platform_type === r.platform)?.name || r.platform
          }));
          
          setPublishResults(testResults);
          setShowResults(true);
          
          const compatibleCount = result.summary.compatible_platforms;
          const avgScore = result.summary.average_score;
          
          if (result.recommendations.ready_to_publish) {
            toast.success(`Content tested successfully! ${compatibleCount} platforms compatible. Average score: ${avgScore}/100`);
          } else {
            toast.warning(`Content needs optimization. ${compatibleCount} platforms compatible. Average score: ${avgScore}/100`);
          }
        } else {
          toast.error(result.error || 'Content testing failed');
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to test content');
      }
    } catch (error) {
      console.error('Error testing content:', error);
      toast.error('Failed to test content');
    } finally {
      setPublishing(false);
    }
  };

  const handlePublish = async () => {
    if (selectedConfigs.length === 0) {
      toast.error('Please select at least one platform to publish to');
      return;
    }

    if (!publishNow && (!scheduledDate || !scheduledTime)) {
      toast.error('Please set a scheduled date and time');
      return;
    }

    setPublishing(true);
    setPublishResults([]);

    try {
      const scheduledFor = !publishNow 
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : undefined;

      const response = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blog_id: blogId,
          social_config_ids: selectedConfigs,
          content_type: 'post',
          scheduled_for: scheduledFor,
          custom_content: customContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPublishResults(data.results || []);
        setShowResults(true);
        
        if (data.success) {
          toast.success(data.message || 'Published successfully!');
          
          // Show test scores if available
          const withScores = data.results.filter((r: any) => r.test_score);
          if (withScores.length > 0) {
            const avgScore = withScores.reduce((sum: number, r: any) => sum + r.test_score, 0) / withScores.length;
            toast.info(`Content quality score: ${Math.round(avgScore)}/100`);
          }
        } else {
          toast.error(data.message || 'Some publications failed');
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to publish');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Failed to publish to social media');
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = () => {
    setShowResults(false);
    setPublishResults([]);
    setSelectedConfigs([]);
    setCustomContent({});
    setPublishNow(true);
    setScheduledDate('');
    setScheduledTime('');
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Publish to Social Media
          </DialogTitle>
          <DialogDescription>
            Share your blog post across your connected social media platforms
          </DialogDescription>
        </DialogHeader>

        {showResults ? (
          // Results View
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Publishing Results</h3>
              <Button variant="outline" onClick={() => setShowResults(false)}>
                Back to Publisher
              </Button>
            </div>
            
            <div className="space-y-3">
              {publishResults.map((result, index) => {
                const Icon = PLATFORM_ICONS[result.platform as keyof typeof PLATFORM_ICONS] || Globe;
                const isSuccess = result.status === 'published' || result.status === 'scheduled';
                const isTested = result.status === 'tested';
                const isIncompatible = result.status === 'incompatible';
                
                return (
                  <Card key={index} className={`border-l-4 ${
                    isSuccess ? 'border-l-green-500' : 
                    isTested ? 'border-l-blue-500' :
                    isIncompatible ? 'border-l-orange-500' :
                    'border-l-red-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            PLATFORM_COLORS[result.platform as keyof typeof PLATFORM_COLORS] || 'bg-gray-500'
                          } text-white`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium">
                              {result.config_name} ({PLATFORM_NAMES[result.platform as keyof typeof PLATFORM_NAMES]})
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {result.status === 'published' && 'Published successfully'}
                              {result.status === 'scheduled' && `Scheduled for ${result.scheduled_for}`}
                              {result.status === 'tested' && `Content tested - Score: ${result.test_score}/100`}
                              {result.status === 'incompatible' && 'Content not compatible'}
                              {result.status === 'failed' && result.error}
                            </div>
                            
                            {/* Test Score Badge */}
                            {result.test_score && (
                              <Badge 
                                variant={result.test_score >= 80 ? 'default' : result.test_score >= 60 ? 'secondary' : 'destructive'}
                                className="mt-1"
                              >
                                Score: {result.test_score}/100
                              </Badge>
                            )}
                            
                            {/* Issues and Suggestions */}
                            {result.issues && result.issues.length > 0 && (
                              <div className="mt-2 text-xs text-red-600">
                                <strong>Issues:</strong> {result.issues.slice(0, 2).join(', ')}
                                {result.issues.length > 2 && '...'}
                              </div>
                            )}
                            
                            {result.suggestions && result.suggestions.length > 0 && (
                              <div className="mt-1 text-xs text-blue-600">
                                <strong>Suggestions:</strong> {result.suggestions.slice(0, 2).join(', ')}
                                {result.suggestions.length > 2 && '...'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isSuccess ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : isTested ? (
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                          ) : isIncompatible ? (
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          
                          {result.published_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(result.published_url, '_blank')}
                            >
                              View Post
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          // Publishing Form
          <div className="space-y-6">
            {configs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Share2 className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No Social Media Configurations
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                    You need to configure at least one social media platform before publishing.
                  </p>
                  <Button onClick={handleClose}>
                    Configure Platforms
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Platform Selection */}
                <div>
                  <Label className="text-base font-medium mb-4 block">
                    Select Platforms ({selectedConfigs.length} selected)
                  </Label>
                  <div className="grid gap-3">
                    {configs.map((config) => {
                      const Icon = PLATFORM_ICONS[config.platform_type as keyof typeof PLATFORM_ICONS] || Globe;
                      const platformColor = PLATFORM_COLORS[config.platform_type as keyof typeof PLATFORM_COLORS] || 'bg-gray-500';
                      const platformName = PLATFORM_NAMES[config.platform_type as keyof typeof PLATFORM_NAMES] || config.platform_type;
                      const isSelected = selectedConfigs.includes(config.id);
                      
                      return (
                        <div
                          key={config.id}
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                          onClick={() => handleConfigToggle(config.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleConfigToggle(config.id)}
                          />
                          
                          <div className={`p-2 rounded-lg ${platformColor} text-white`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium">{config.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {platformName}
                              {config.account_handle && ` • ${config.account_handle}`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Publishing Schedule */}
                <div>
                  <Label className="text-base font-medium mb-4 block">Publishing Schedule</Label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={publishNow}
                          onChange={() => setPublishNow(!publishNow)}
                        />
                        <Label>Publish now</Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={!publishNow}
                          onChange={() => setPublishNow(!publishNow)}
                        />
                        <Label>Schedule for later</Label>
                      </div>
                    </div>
                    
                    {!publishNow && (
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="time">Time</Label>
                          <Input
                            id="time"
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Content */}
                {selectedConfigs.length > 0 && (
                  <div>
                    <Label className="text-base font-medium mb-4 block">
                      Custom Content (Optional)
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Customize the content for each platform. Leave blank to use auto-generated content.
                    </p>
                    
                    <div className="space-y-4">
                      {selectedConfigs.map((configId) => {
                        const config = configs.find(c => c.id === configId);
                        if (!config) return null;
                        
                        const Icon = PLATFORM_ICONS[config.platform_type as keyof typeof PLATFORM_ICONS] || Globe;
                        const platformName = PLATFORM_NAMES[config.platform_type as keyof typeof PLATFORM_NAMES] || config.platform_type;
                        const defaultContent = generateDefaultContent(config.platform_type);
                        
                        return (
                          <div key={configId}>
                            <Label className="flex items-center gap-2 mb-2">
                              <Icon className="w-4 h-4" />
                              {config.name} ({platformName})
                            </Label>
                            <Textarea
                              placeholder={`Default: ${defaultContent.substring(0, 100)}...`}
                              value={customContent[config.platform_type] || ''}
                              onChange={(e) => setCustomContent(prev => ({
                                ...prev,
                                [config.platform_type]: e.target.value
                              }))}
                              rows={3}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestContent}
                    disabled={publishing || selectedConfigs.length === 0}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Test Content
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={publishing || selectedConfigs.length === 0}
                    className="flex items-center gap-2"
                  >
                    {publishing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Publishing...
                      </>
                    ) : publishNow ? (
                      <>
                        <Send className="w-4 h-4" />
                        Publish Now
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        Schedule Post
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
