
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PenTool, Save, Eye, Sparkles, Download, FileText, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export default function ContentEditor() {
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [outline, setOutline] = useState('');
  const [tone, setTone] = useState('professional');
  const [wordCount, setWordCount] = useState('800-1200');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [contentIdeaSource, setContentIdeaSource] = useState<any>(null);

  const generateContent = async () => {
    if (!title.trim()) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setContent('');
    
    try {
      const keywordArray = keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : [];
      
      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          keywords: keywordArray,
          outline,
          tone,
          wordCount,
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setGenerationProgress(100);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const textChunk = parsed.choices?.[0]?.delta?.content || '';
              if (textChunk) {
                buffer += textChunk;
                setContent(buffer);
                setGenerationProgress(prev => Math.min(prev + 1, 95));
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveContent = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title before saving');
      return;
    }
    
    if (!content.trim()) {
      toast.error('Please generate or enter content before saving');
      return;
    }

    try {
      const keywordArray = keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : [];
      
      toast.promise(
        (async () => {
          const response = await fetch('/api/blog/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: title.trim(),
              content: content.trim(),
              keywords: keywordArray,
              status: 'draft',
            }),
          });

          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(result.details || result.error || 'Failed to save content');
          }
          
          if (result.success) {
            console.log('✅ Blog post saved with ID:', result.blogPost?.id);
            return result;
          } else {
            throw new Error(result.error || 'Unknown error occurred');
          }
        })(),
        {
          loading: 'Saving your blog post...',
          success: (result) => {
            return `Blog post saved successfully! ID: ${result.blogPost?.id?.substring(0, 8)}...`;
          },
          error: (error) => {
            console.error('❌ Save error details:', error);
            return `Failed to save: ${error.message}`;
          }
        }
      );
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('An unexpected error occurred while saving');
    }
  };

  const downloadMarkdown = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${title || 'blog-post'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const clearContentIdeaData = () => {
    setContentIdeaSource(null);
    localStorage.removeItem('contentIdeaData');
  };

  // Check for pre-populated content idea data on component mount
  useEffect(() => {
    const contentIdeaData = localStorage.getItem('contentIdeaData');
    if (contentIdeaData) {
      try {
        const ideaData = JSON.parse(contentIdeaData);
        setTitle(ideaData.title || '');
        setKeywords(ideaData.keywords?.join(', ') || '');
        setOutline(ideaData.description || '');
        setContentIdeaSource(ideaData);
        
        toast.success('Content idea loaded! Ready to generate your blog post.');
      } catch (error) {
        console.error('Error parsing content idea data:', error);
        localStorage.removeItem('contentIdeaData');
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-emerald-600" />
              AI Content Editor
            </CardTitle>
            <CardDescription>
              Generate and edit high-quality blog content with AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contentIdeaSource && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Content loaded from idea: "{contentIdeaSource.title}"
                      </p>
                      <p className="text-xs text-blue-700">
                        Category: {contentIdeaSource.category} • Keywords: {contentIdeaSource.keywords?.length || 0}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearContentIdeaData}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Blog Post Title *
                </label>
                <Input
                  placeholder="Enter your blog post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Target Keywords
                </label>
                <Input
                  placeholder="keyword1, keyword2, keyword3"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Content Outline (Optional)
              </label>
              <Textarea
                placeholder="Provide an outline or key points you want to cover..."
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Writing Tone
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="formal">Formal</option>
                  <option value="conversational">Conversational</option>
                  <option value="technical">Technical</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Target Word Count
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={wordCount}
                  onChange={(e) => setWordCount(e.target.value)}
                >
                  <option value="500-800">500-800 words</option>
                  <option value="800-1200">800-1200 words</option>
                  <option value="1200-1800">1200-1800 words</option>
                  <option value="1800-2500">1800-2500 words</option>
                </select>
              </div>
            </div>

            <Button 
              onClick={generateContent}
              disabled={isGenerating || !title.trim()}
              className="w-full"
            >
              {isGenerating ? `Generating... ${generationProgress}%` : 'Generate Content'}
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>

            {isGenerating && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {content && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Generated Content
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {showPreview ? 'Edit' : 'Preview'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadMarkdown}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" onClick={saveContent}>
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
              <CardDescription>
                Word count: {content.split(' ').filter(word => word.length > 0).length} words
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="prose max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  placeholder="Generated content will appear here..."
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
