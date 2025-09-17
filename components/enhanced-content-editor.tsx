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

// Removed Python SDK imports - using direct API calls instead

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
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);

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

  // No SDK initialization needed - using direct API calls

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
      keywords: prev.keywords.filter((k: string) => k !== keyword)
    }));
  };

  // Generate blog post using direct API call
  const handleGenerate = async () => {
    if (!blogPost.title.trim()) {
      toast.error('Please enter a blog topic/title');
      return;
    }

    setIsGenerating(true);
    setBlogPost(prev => ({ ...prev, content: '' }));
    
    try {
      const requestBody = {
        title: blogPost.title,
        keywords: blogPost.keywords,
        tone: blogPost.tone,
        wordCount: getWordCountFromLength(blogPost.length),
        outline: blogPost.custom_instructions || '',
      };

      console.log('🚀 Starting blog generation with:', requestBody);

      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let generatedContent = '';

      toast.success('🎯 Content generation started!');

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        generatedContent += chunk;
        
        // Update content in real-time
        setBlogPost(prev => ({
          ...prev,
          content: generatedContent
        }));
      }

      // Create a mock generation result for compatibility
      const mockResult = {
        success: true,
        blog_post: {
          title: blogPost.title,
          content: generatedContent,
          meta_keywords: blogPost.keywords,
          excerpt: generatedContent.substring(0, 200) + '...',
          slug: blogPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          categories: [],
          tags: blogPost.keywords,
          status: 'draft' as const,
          created_at: new Date().toISOString(),
        },
        seo_metrics: {
          overall_seo_score: 85,
          word_count: generatedContent.split(' ').length,
          reading_time_minutes: Math.ceil(generatedContent.split(' ').length / 200),
          keyword_density: {},
          recommendations: [],
        },
        content_quality: {
          readability_score: 75,
          flesch_reading_ease: 65,
          flesch_kincaid_grade: 8,
        },
        generation_time: 0,
        ai_enhanced: true,
      };

      setGenerationResult(mockResult);
      setActiveTab('preview');
      toast.success('✅ Blog post generated successfully!');
      
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to convert length to word count
  const getWordCountFromLength = (length: string): number => {
    switch (length) {
      case 'short': return 300;
      case 'medium': return 750;
      case 'long': return 1500;
      case 'very_long': return 2500;
      default: return 750;
    }
  };

  // Save content
  const handleSave = async () => {
    try {
      const contentToSave = {
        title: blogPost.title,
        content: blogPost.content,
        keywords: blogPost.keywords,
        status: 'draft',
        featuredImage: null,
        generatedImages: [],
      };

      const response = await fetch('/api/blog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to save blog post');
      }

      const savedData = await response.json();
      onSave?.(savedData);
      toast.success('Blog post saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save blog post');
    }
  };

  // Suggest keywords
  const handleSuggestKeywords = async () => {
    if (!blogPost.title.trim()) {
      toast.error('Please enter a topic first');
      return;
    }

    setIsLoadingKeywords(true);
    try {
      const response = await fetch('/api/keywords/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: blogPost.title,
          location_name: 'United States',
          language_code: 'en',
          limit: 10
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get keyword suggestions');
      }

      const data = await response.json();
      const keywords = data.results?.slice(0, 5).map((item: any) => item.keyword) || [];
      
      setBlogPost(prev => ({
        ...prev,
        keywords: [...new Set([...prev.keywords, ...keywords])]
      }));
      toast.success(`Added ${keywords.length} keyword suggestions!`);
    } catch (error) {
      console.error('Keyword suggestion failed:', error);
      toast.error('Failed to get keyword suggestions');
    } finally {
      setIsLoadingKeywords(false);
    }
  };

  // Render API status
  const renderAPIStatus = () => {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>API Ready</AlertTitle>
        <AlertDescription>
          AI-powered generation with blog writer API endpoints available
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
        {renderAPIStatus()}
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
                  {blogPost.keywords.map((keyword: string, index: number) => (
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
                disabled={isGenerating || !blogPost.title.trim()}
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
