"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Maximize2, 
  Minimize2, 
  X, 
  Wand2, 
  BarChart3, 
  Target, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Save,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

import { 
  pythonSDK, 
  BlogGenerationRequest, 
  BlogGenerationResult,
  convertToPythonSDKRequest,
  convertFromPythonSDKResult,
  APIConfig,
  AIHealthStatus
} from '@/lib/python-sdk-client';

interface EnhancedContentEditorProps {
  onSave?: (content: any) => void;
  initialContent?: any;
  className?: string;
}

export default function EnhancedContentEditor({ 
  onSave, 
  initialContent,
  className = "" 
}: EnhancedContentEditorProps) {
  // UI State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Content State
  const [blogPost, setBlogPost] = useState({
    title: initialContent?.title || '',
    content: initialContent?.content || '',
    keywords: initialContent?.keywords || [],
    tone: initialContent?.tone || 'professional',
    length: initialContent?.length || 'medium',
    target_audience: initialContent?.target_audience || '',
    custom_instructions: initialContent?.custom_instructions || '',
  });

  // Generation State
  const [generationResult, setGenerationResult] = useState<BlogGenerationResult | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  
  // SDK State
  const [sdkConfig, setSdkConfig] = useState<APIConfig | null>(null);
  const [aiHealth, setAiHealth] = useState<AIHealthStatus | null>(null);
  const [sdkStatus, setSdkStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Advanced Options
  const [advancedOptions, setAdvancedOptions] = useState({
    enable_ai_enhancement: true,
    enable_seo_optimization: true,
    enable_quality_analysis: true,
    include_introduction: true,
    include_conclusion: true,
    include_faq: false,
    include_toc: true,
    word_count_target: undefined as number | undefined,
  });

  // Initialize SDK and check status
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setSdkStatus('loading');
        
        // Check health and get config in parallel
        const [healthResult, configResult] = await Promise.all([
          pythonSDK.checkAIHealth().catch(() => null),
          pythonSDK.getConfig().catch(() => null),
        ]);

        setAiHealth(healthResult);
        setSdkConfig(configResult);
        setSdkStatus('ready');

        toast.success('Python SDK connected successfully!');
      } catch (error) {
        console.error('SDK initialization failed:', error);
        setSdkStatus('error');
        toast.error('Failed to connect to Python SDK');
      }
    };

    initializeSDK();
  }, []);

  // Handle keyword input
  const handleAddKeyword = () => {
    if (keywordInput.trim() && !blogPost.keywords.includes(keywordInput.trim())) {
      setBlogPost(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setBlogPost(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  // Generate blog post using Python SDK
  const handleGenerate = async () => {
    if (!blogPost.title.trim()) {
      toast.error('Please enter a blog topic/title');
      return;
    }

    setIsGenerating(true);
    try {
      const request: BlogGenerationRequest = {
        topic: blogPost.title,
        keywords: blogPost.keywords,
        tone: blogPost.tone as any,
        length: blogPost.length as any,
        target_audience: blogPost.target_audience || undefined,
        custom_instructions: blogPost.custom_instructions || undefined,
        ...advancedOptions,
      };

      const result = await pythonSDK.generateBlogPost(request);
      setGenerationResult(result);

      // Update the blog post with generated content
      setBlogPost(prev => ({
        ...prev,
        content: result.blog_post.content,
        title: result.blog_post.title,
        keywords: result.blog_post.meta_keywords || prev.keywords,
      }));

      setActiveTab('preview');
      toast.success(`Blog post generated in ${result.generation_time.toFixed(2)}s!`);
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(`Generation failed: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save content
  const handleSave = () => {
    if (generationResult) {
      const savedContent = convertFromPythonSDKResult(generationResult);
      onSave?.(savedContent);
      toast.success('Blog post saved successfully!');
    } else {
      // Save current content as draft
      const draftContent = {
        ...blogPost,
        id: Date.now().toString(),
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      onSave?.(draftContent);
      toast.success('Draft saved successfully!');
    }
  };

  // Suggest keywords
  const handleSuggestKeywords = async () => {
    if (!blogPost.title.trim()) {
      toast.error('Please enter a topic first');
      return;
    }

    try {
      const suggestions = await pythonSDK.suggestKeywords(blogPost.title);
      setBlogPost(prev => ({
        ...prev,
        keywords: [...new Set([...prev.keywords, ...suggestions.slice(0, 5)])]
      }));
      toast.success(`Added ${suggestions.length} keyword suggestions`);
    } catch (error) {
      console.error('Keyword suggestion failed:', error);
      toast.error('Failed to get keyword suggestions');
    }
  };

  // Render SDK status
  const renderSDKStatus = () => {
    if (sdkStatus === 'loading') {
      return (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Connecting to Python SDK...</AlertTitle>
          <AlertDescription>Initializing AI-powered blog generation</AlertDescription>
        </Alert>
      );
    }

    if (sdkStatus === 'error') {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>SDK Connection Failed</AlertTitle>
          <AlertDescription>
            Unable to connect to the Python SDK. Some features may be unavailable.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Python SDK Ready</AlertTitle>
        <AlertDescription>
          AI-powered generation with {aiHealth?.providers ? Object.keys(aiHealth.providers).length : 0} AI providers available
        </AlertDescription>
      </Alert>
    );
  };

  // Render metrics
  const renderMetrics = () => {
    if (!generationResult) return null;

    const { seo_metrics, content_quality } = generationResult;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              SEO Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seo_metrics.overall_seo_score}/100</div>
            <Progress value={seo_metrics.overall_seo_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Readability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{content_quality.readability_score}/100</div>
            <Progress value={content_quality.readability_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Reading Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seo_metrics.reading_time_minutes}min</div>
            <div className="text-sm text-muted-foreground">{seo_metrics.word_count} words</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const containerClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-background p-6 overflow-auto"
    : `${className}`;

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Enhanced Blog Writer</h2>
          {generationResult?.ai_enhanced && (
            <Badge variant="secondary">AI Enhanced</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!blogPost.content.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>

          {isFullscreen ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(false)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          
          {isFullscreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* SDK Status */}
      <div className="mb-6">
        {renderSDKStatus()}
      </div>

      {/* Metrics */}
      {generationResult && (
        <div className="mb-6">
          {renderMetrics()}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blog Configuration</CardTitle>
              <CardDescription>Configure your blog post settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Topic/Title</Label>
                <Input
                  id="title"
                  value={blogPost.title}
                  onChange={(e) => setBlogPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter your blog topic or title..."
                />
              </div>

              <div>
                <Label>Keywords</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Add keyword..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  />
                  <Button onClick={handleAddKeyword} size="sm">Add</Button>
                  <Button 
                    onClick={handleSuggestKeywords} 
                    size="sm" 
                    variant="outline"
                    disabled={!blogPost.title.trim()}
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Suggest
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {blogPost.keywords.map((keyword, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="cursor-pointer"
                      onClick={() => handleRemoveKeyword(keyword)}
                    >
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={blogPost.tone} onValueChange={(value) => setBlogPost(prev => ({ ...prev, tone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="instructional">Instructional</SelectItem>
                      <SelectItem value="persuasive">Persuasive</SelectItem>
                      <SelectItem value="entertaining">Entertaining</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="length">Length</Label>
                  <Select value={blogPost.length} onValueChange={(value) => setBlogPost(prev => ({ ...prev, length: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (300-500 words)</SelectItem>
                      <SelectItem value="medium">Medium (500-1000 words)</SelectItem>
                      <SelectItem value="long">Long (1000-2000 words)</SelectItem>
                      <SelectItem value="very_long">Very Long (2000+ words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="audience">Target Audience (Optional)</Label>
                <Input
                  id="audience"
                  value={blogPost.target_audience}
                  onChange={(e) => setBlogPost(prev => ({ ...prev, target_audience: e.target.value }))}
                  placeholder="e.g., Software developers, Marketing professionals..."
                />
              </div>

              <div>
                <Label htmlFor="instructions">Custom Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  value={blogPost.custom_instructions}
                  onChange={(e) => setBlogPost(prev => ({ ...prev, custom_instructions: e.target.value }))}
                  placeholder="Any specific requirements or instructions..."
                  rows={3}
                />
              </div>

              {/* Advanced Options */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-medium">Advanced Options</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ai-enhancement"
                      checked={advancedOptions.enable_ai_enhancement}
                      onCheckedChange={(checked) => setAdvancedOptions(prev => ({ ...prev, enable_ai_enhancement: checked }))}
                    />
                    <Label htmlFor="ai-enhancement" className="text-sm">AI Enhancement</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="seo-optimization"
                      checked={advancedOptions.enable_seo_optimization}
                      onCheckedChange={(checked) => setAdvancedOptions(prev => ({ ...prev, enable_seo_optimization: checked }))}
                    />
                    <Label htmlFor="seo-optimization" className="text-sm">SEO Optimization</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-toc"
                      checked={advancedOptions.include_toc}
                      onCheckedChange={(checked) => setAdvancedOptions(prev => ({ ...prev, include_toc: checked }))}
                    />
                    <Label htmlFor="include-toc" className="text-sm">Table of Contents</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-faq"
                      checked={advancedOptions.include_faq}
                      onCheckedChange={(checked) => setAdvancedOptions(prev => ({ ...prev, include_faq: checked }))}
                    />
                    <Label htmlFor="include-faq" className="text-sm">FAQ Section</Label>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !blogPost.title.trim() || sdkStatus !== 'ready'}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Blog Post
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Content Panel */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Generated Content</CardTitle>
              <CardDescription>
                {generationResult ? 'AI-generated blog content' : 'Content will appear here after generation'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showPreview && blogPost.content ? (
                <div className="prose max-w-none">
                  <ReactMarkdown>{blogPost.content}</ReactMarkdown>
                </div>
              ) : (
                <Textarea
                  value={blogPost.content}
                  onChange={(e) => setBlogPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Generated content will appear here..."
                  className={`min-h-[400px] ${isFullscreen ? 'min-h-[60vh]' : ''}`}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SEO Recommendations */}
      {generationResult?.seo_metrics.recommendations && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              SEO Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {generationResult.seo_metrics.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
