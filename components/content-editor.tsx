
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PenTool, Save, Eye, Sparkles, Download, FileText, Info, Edit, ArrowLeft, Link, ExternalLink, Plus } from 'lucide-react';
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
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostSource, setEditingPostSource] = useState<any>(null);
  
  // Backlink functionality states
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [suggestedInternalLinks, setSuggestedInternalLinks] = useState<any[]>([]);
  const [suggestedExternalLinks, setSuggestedExternalLinks] = useState<any[]>([]);
  const [showBacklinkPanel, setShowBacklinkPanel] = useState(false);
  const [isGeneratingBacklinks, setIsGeneratingBacklinks] = useState(false);
  const [insertedLinks, setInsertedLinks] = useState<Set<number>>(new Set());
  const [contentTextareaRef, setContentTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  // Helper functions to dispatch content change events
  const dispatchContentChanged = () => {
    window.dispatchEvent(new CustomEvent('contentChanged'));
  };

  const dispatchContentSaved = () => {
    window.dispatchEvent(new CustomEvent('contentSaved'));
  };

  const generateBacklinkSuggestions = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please add title and content before generating backlinks');
      return;
    }

    setIsGeneratingBacklinks(true);
    setSuggestedInternalLinks([]);
    setSuggestedExternalLinks([]);
    setInsertedLinks(new Set()); // Reset inserted links tracking

    try {
      const response = await fetch('/api/blog/generate-backlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: content.substring(0, 1500), // Send first 1500 chars for analysis
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
          websiteUrl: websiteUrl || null
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.internalLinks) {
        setSuggestedInternalLinks(data.internalLinks);
      }
      if (data.externalLinks) {
        setSuggestedExternalLinks(data.externalLinks);
      }

      setShowBacklinkPanel(true);
      toast.success(`Generated ${(data.internalLinks?.length || 0) + (data.externalLinks?.length || 0)} backlink suggestions!`);
    } catch (error) {
      console.error('Error generating backlinks:', error);
      toast.error('Failed to generate backlink suggestions. Please try again.');
    } finally {
      setIsGeneratingBacklinks(false);
    }
  };

  const insertLinkIntoContent = (linkText: string, url: string, isExternal: boolean = false, linkIndex: number) => {
    const linkMarkdown = `[${linkText}](${url})${isExternal ? ' 🔗' : ''}`;
    
    // Find a good place to insert the link in the content
    const sentences = content.split('. ');
    let insertIndex = Math.floor(sentences.length / 2); // Insert around middle
    
    // Try to find a sentence that contains related keywords
    const keywordList = keywords.toLowerCase().split(',').map(k => k.trim());
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].toLowerCase();
      if (keywordList.some(keyword => sentence.includes(keyword))) {
        insertIndex = i + 1; // Insert after this sentence
        break;
      }
    }
    
    // Insert the link
    sentences.splice(insertIndex, 0, `\n\n${linkMarkdown}\n`);
    const newContent = sentences.join('. ').replace(/\.\s*\n\n\[/g, '.\n\n[');
    
    setContent(newContent);
    dispatchContentChanged();
    
    // Track inserted links for visual feedback
    setInsertedLinks(prev => new Set([...prev, linkIndex]));
    
    // Success feedback with more details
    toast.success(`✅ ${isExternal ? 'External' : 'Internal'} link inserted!`, {
      description: `"${linkText}" added to your content`,
      duration: 3000,
    });

    // Highlight the content area briefly
    if (contentTextareaRef) {
      contentTextareaRef.focus();
      contentTextareaRef.scrollTop = contentTextareaRef.scrollHeight * (insertIndex / sentences.length);
      
      // Brief highlight effect
      contentTextareaRef.style.boxShadow = '0 0 0 3px #10b981';
      setTimeout(() => {
        if (contentTextareaRef) {
          contentTextareaRef.style.boxShadow = '';
        }
      }, 1000);
    }
  };

  const insertLinkAtCursor = (linkText: string, url: string) => {
    const linkMarkdown = `[${linkText}](${url})`;
    
    // For now, append to the end - in a real implementation, you'd want to insert at cursor position
    const newContent = content + `\n\n${linkMarkdown}`;
    setContent(newContent);
    dispatchContentChanged();
    toast.success('Link inserted at the end of content!');
  };

  const generateContent = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title before generating content');
      return;
    }
    
    console.log('🚀 Starting content generation with:', { title, keywords, tone, wordCount });
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setContent('');
    
    try {
      const keywordArray = keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : [];
      
      const requestBody = {
        title,
        keywords: keywordArray,
        outline,
        tone,
        wordCount,
      };
      
      console.log('📤 Sending request to /api/blog/generate:', requestBody);
      
      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      toast.success('🎯 Content generation started!');

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
              toast.success('✅ Content generated successfully!');
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
              // Skip invalid JSON chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Content generation error:', error);
      toast.error(`Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setContent(''); // Clear any partial content
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
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
              id: editingPostId, // Include ID if editing existing post
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
            // Dispatch content saved event
            dispatchContentSaved();
            
            // Clear edit data after successful save
            if (editingPostId) {
              clearEditPostData();
            }
            
            // Show success message with action to view saved posts
            setTimeout(() => {
              toast.success('✨ Tip: Check "My Posts" tab to view your saved content!', {
                duration: 4000
              });
            }, 2000);
            
            const action = editingPostId ? 'updated' : 'saved';
            return `Blog post ${action} successfully! ID: ${result.blogPost?.id?.substring(0, 8)}...`;
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

  const clearEditPostData = () => {
    console.log('🗑️ Clearing edit post data');
    setEditingPostSource(null);
    setEditingPostId(null);
    localStorage.removeItem('editPostData');
    
    // Reset form fields when clearing edit data
    setTitle('');
    setContent('');
    setKeywords('');
    setOutline('');
    
    toast.success('✨ Edit mode cleared - ready for new content!');
  };

  const clearAllData = () => {
    console.log('🧹 Clearing all editor data...');
    // Clear all form fields
    setTitle('');
    setKeywords('');
    setOutline('');
    setTone('professional');
    setWordCount('800-1200');
    setContent('');
    
    // Clear state variables
    setEditingPostId(null);
    setEditingPostSource(null);
    setContentIdeaSource(null);
    setShowPreview(false);
    setIsGenerating(false);
    setGenerationProgress(0);
    
    // Clear localStorage
    localStorage.removeItem('editPostData');
    localStorage.removeItem('contentIdeaData');
  };

  const navigateToPostsList = () => {
    // Dispatch event to switch to My Posts tab
    window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 'my-posts' } }));
    toast.success('📋 Navigating to your posts...');
  };

  const loadEditPostData = (postData: any) => {
    try {
      console.log('📖 Loading edit post data:', postData);
      setEditingPostId(postData.id);
      setTitle(postData.title || '');
      setKeywords(Array.isArray(postData.keywords) ? postData.keywords.join(', ') : '');
      setContent(postData.content || '');
      setEditingPostSource(postData);
      
      // Clear any existing content idea data
      clearContentIdeaData();
      
      toast.success('✏️ Blog post loaded for editing!', {
        description: `Editing: ${postData.title || 'Untitled'}`
      });
    } catch (error) {
      console.error('❌ Error loading edit post data:', error);
      toast.error('Failed to load post for editing');
    }
  };

  // Check for pre-populated data on component mount
  useEffect(() => {
    console.log('🚀 Content Editor mounted, checking for saved data...');
    
    const contentIdeaData = localStorage.getItem('contentIdeaData');
    const editPostData = localStorage.getItem('editPostData');
    
    if (editPostData) {
      try {
        const postData = JSON.parse(editPostData);
        console.log('✅ Found edit post data in localStorage:', postData);
        loadEditPostData(postData);
      } catch (error) {
        console.error('❌ Error parsing edit post data:', error);
        localStorage.removeItem('editPostData');
        toast.error('Failed to load editing data - corrupted data removed');
      }
    } else if (contentIdeaData) {
      try {
        const ideaData = JSON.parse(contentIdeaData);
        console.log('✅ Found content idea data in localStorage:', ideaData);
        setTitle(ideaData.title || '');
        setKeywords(ideaData.keywords?.join(', ') || '');
        setOutline(ideaData.description || '');
        setContentIdeaSource(ideaData);
        
        toast.success('💡 Content idea loaded! Ready to generate your blog post.');
      } catch (error) {
        console.error('❌ Error parsing content idea data:', error);
        localStorage.removeItem('contentIdeaData');
        toast.error('Failed to load content idea - corrupted data removed');
      }
    } else {
      console.log('ℹ️ No saved data found in localStorage');
    }

    // Listen for real-time edit requests
    const handleEditRequest = (event: CustomEvent) => {
      console.log('🎯 Received edit request event:', event.detail);
      loadEditPostData(event.detail);
    };

    // Listen for create new post requests
    const handleCreateNewPost = () => {
      console.log('🆕 Received create new post request - clearing editor');
      clearAllData();
      toast.success('✨ Editor cleared! Ready to create a new post.');
    };

    window.addEventListener('postEditRequested', handleEditRequest as EventListener);
    window.addEventListener('createNewPost', handleCreateNewPost as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('postEditRequested', handleEditRequest as EventListener);
      window.removeEventListener('createNewPost', handleCreateNewPost as EventListener);
    };
  }, []);

  // Determine if we're in editing mode (skip generation UI)
  const isEditingMode = editingPostSource && editingPostId && content.trim();
  
  return (
    <div className="space-y-6 w-full">
      {/* Only show generation interface for NEW content creation */}
      {!isEditingMode && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-emerald-600" />
                    AI Content Generator
                  </CardTitle>
                  <CardDescription>
                    Generate high-quality blog content with AI assistance
                  </CardDescription>
                </div>
                {contentIdeaSource && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearContentIdeaData}
                    className="ml-4"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Clear Idea
                  </Button>
                )}
              </div>
            </CardHeader>
          <CardContent className="space-y-4">
            {editingPostSource && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        Editing existing post: "{editingPostSource.title}"
                      </p>
                      <p className="text-xs text-orange-700">
                        Status: {editingPostSource.status} • Words: {editingPostSource.content?.split(' ')?.length || 0}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearEditPostData}
                    className="text-orange-700 border-orange-300 hover:bg-orange-100"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
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
                  onChange={(e) => {
                    setTitle(e.target.value);
                    dispatchContentChanged();
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Target Keywords
                </label>
                <Input
                  placeholder="keyword1, keyword2, keyword3"
                  value={keywords}
                  onChange={(e) => {
                    setKeywords(e.target.value);
                    dispatchContentChanged();
                  }}
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
                onChange={(e) => {
                  setOutline(e.target.value);
                  dispatchContentChanged();
                }}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Website URL 
                  <span className="text-xs text-green-600 ml-1">(for real internal links)</span>
                </label>
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full"
                />
              </div>
            </div>

            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                generateContent();
              }}
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
      )}

      {/* Content Editor Section - Always show when editing, or when content exists */}
      {(content || isEditingMode) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isEditingMode ? 0 : 0.2 }}
          className="w-full"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5 text-blue-600" />
                    {isEditingMode ? 'Edit Content' : 'Generated Content'}
                  </CardTitle>
                  {isEditingMode && (
                    <CardDescription className="text-blue-600 font-medium">
                      ✏️ Editing: {title || 'Untitled Post'}
                    </CardDescription>
                  )}
                </div>
                {isEditingMode && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Navigate back to drafts tab
                      window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 'drafts' } }));
                    }}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Drafts
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick editing fields for existing posts */}
              {isEditingMode && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <Input
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        dispatchContentChanged();
                      }}
                      placeholder="Enter your blog post title"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma-separated)</label>
                    <Input
                      value={keywords}
                      onChange={(e) => {
                        setKeywords(e.target.value);
                        dispatchContentChanged();
                      }}
                      placeholder="keyword1, keyword2, keyword3"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website URL 
                      <span className="text-xs text-green-600 ml-1">(we'll crawl for real pages)</span>
                    </label>
                    <Input
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Optional AI Assist for editing mode */}
              {isEditingMode && (
                <div className="border border-dashed border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">✨ AI Assist (Optional)</h4>
                      <p className="text-xs text-gray-600">Want to regenerate or improve your content?</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('This will regenerate the content based on your title and keywords. Continue?')) {
                          generateContent();
                        }
                      }}
                      disabled={isGenerating || !title.trim()}
                      className="flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {isGenerating ? 'Regenerating...' : 'Regenerate Content'}
                    </Button>
                  </div>
                  {isGenerating && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowBacklinkPanel(!showBacklinkPanel);
                  }}
                  className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                >
                  <Link className="w-4 h-4 mr-1" />
                  Backlinks
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    generateBacklinkSuggestions();
                  }}
                  disabled={isGeneratingBacklinks || !title.trim() || !content.trim()}
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  {isGeneratingBacklinks ? 'Generating...' : 'Generate Links'}
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
                  {editingPostId ? 'Update' : 'Save'}
                </Button>
              </div>
            </CardContent>

            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Content Editor
                  </CardTitle>
                  <CardDescription>
                    Word count: {content.split(' ').filter(word => word.length > 0).length} words
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="prose max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <Textarea
                  ref={(el) => setContentTextareaRef(el)}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    dispatchContentChanged();
                  }}
                  className="min-h-[500px] font-mono text-sm transition-all duration-300"
                  placeholder={isEditingMode ? "Edit your content here..." : "Generated content will appear here..."}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Backlink Panel */}
      {showBacklinkPanel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5 text-purple-600" />
                  SEO Backlinks Manager
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      generateBacklinkSuggestions();
                    }}
                    disabled={isGeneratingBacklinks || !title.trim() || !content.trim()}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    {isGeneratingBacklinks ? 'Generating...' : 'Refresh Suggestions'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowBacklinkPanel(false);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
              <CardDescription>
                AI-generated backlink suggestions to improve your SEO and provide value to readers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!websiteUrl && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Website URL Required</span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    Add your website URL above to get internal link suggestions
                  </p>
                  <Input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full"
                  />
                </div>
              )}

              {/* Internal Links Section */}
              {suggestedInternalLinks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Link className="w-5 h-5 text-blue-600" />
                    Internal Links ({suggestedInternalLinks.length})
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      ✅ Real Pages
                    </span>
                  </h3>
                  <div className="grid gap-3">
                    {suggestedInternalLinks.map((link, index) => (
                      <div key={index} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-900 mb-1">{link.linkText}</h4>
                            <p className="text-sm text-blue-700 mb-2">{link.reason}</p>
                            <code className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {link.suggestedUrl}
                            </code>
                            {link.pageTitle && (
                              <p className="text-xs text-blue-600 mt-1">Suggested page: {link.pageTitle}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              insertLinkIntoContent(link.linkText, link.suggestedUrl, false, index);
                            }}
                            disabled={insertedLinks.has(index)}
                            className={`ml-3 transition-all duration-200 ${
                              insertedLinks.has(index)
                                ? 'bg-green-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {insertedLinks.has(index) ? (
                              <>
                                ✓ Inserted
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3 mr-1" />
                                Insert
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links Section */}
              {suggestedExternalLinks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-green-600" />
                    External Links ({suggestedExternalLinks.length})
                  </h3>
                  <div className="grid gap-3">
                    {suggestedExternalLinks.map((link, index) => (
                      <div key={index} className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-green-900 mb-1">{link.linkText}</h4>
                            <p className="text-sm text-green-700 mb-2">{link.reason}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {link.domain}
                              </code>
                              <Badge variant="outline" className="text-xs">
                                {link.type}
                              </Badge>
                            </div>
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-800 underline"
                            >
                              Preview: {link.url}
                            </a>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              insertLinkIntoContent(link.linkText, link.url, true, index + 1000);
                            }}
                            disabled={insertedLinks.has(index + 1000)}
                            className={`ml-3 transition-all duration-200 ${
                              insertedLinks.has(index + 1000)
                                ? 'bg-emerald-600 text-white'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {insertedLinks.has(index + 1000) ? (
                              <>
                                ✓ Inserted
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3 mr-1" />
                                Insert
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isGeneratingBacklinks && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 mb-2">Generating backlink suggestions...</p>
                  {websiteUrl && (
                    <p className="text-sm text-blue-600">
                      🕷️ Crawling your website to find real internal pages...
                    </p>
                  )}
                </div>
              )}

              {!isGeneratingBacklinks && suggestedInternalLinks.length === 0 && suggestedExternalLinks.length === 0 && (
                <div className="text-center py-8">
                  <Link className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No backlink suggestions yet</p>
                  <p className="text-sm text-gray-500">
                    Add content above and click "Generate Links" to get AI-powered backlink suggestions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
