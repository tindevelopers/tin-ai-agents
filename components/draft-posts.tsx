
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Tag, Eye, Edit, Trash2, Edit3, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { BlogPost } from '@/lib/types';
import { toast } from 'sonner';

export default function DraftPosts() {
  const [draftPosts, setDraftPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchDraftPosts();
  }, []);

  const fetchDraftPosts = async () => {
    try {
      console.log('📚 Fetching draft posts...');
      const response = await fetch('/api/blog/list');
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Failed to fetch blog posts:', data);
        setDraftPosts([]);
        return;
      }
      
      // Filter only draft posts
      const drafts = (data.blogPosts || []).filter((post: BlogPost) => post.status === 'draft');
      console.log('✅ Draft posts fetched:', drafts.length);
      setDraftPosts(drafts);
    } catch (error) {
      console.error('Error fetching draft posts:', error);
      setDraftPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}, ${year}`;
  };

  const viewPost = (post: BlogPost) => {
    setSelectedPost(post);
    setShowPreview(true);
  };

  const editPost = (post: BlogPost) => {
    try {
      const editData = {
        id: post.id,
        title: post.title,
        content: post.content,
        keywords: post.keywords,
        status: post.status,
        isEditing: true, // Flag to indicate this is editing, not creating new
        skipWorkflow: true // Skip the workflow and go directly to editor
      };
      
      console.log('📝 Loading draft post for direct editing:', editData);
      localStorage.setItem('editPostData', JSON.stringify(editData));
      
      // Dispatch event to switch to content editor directly (skip workflow)
      window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 'create-post', skipWorkflow: true } }));
      window.dispatchEvent(new CustomEvent('postEditRequested', { detail: editData }));
      
      toast.success('✏️ Opening draft in editor...');
    } catch (error) {
      console.error('❌ Error preparing draft for editing:', error);
      toast.error('Failed to load draft for editing. Please try again.');
    }
  };

  const publishPost = async (postId: string, title: string) => {
    if (!confirm(`Are you sure you want to publish "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/blog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          status: 'published',
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish post');
      }

      if (result.success) {
        toast.success('🚀 Post published successfully!');
        setDraftPosts(prev => prev.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error(`Failed to publish post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deletePost = async (postId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the draft "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/blog/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete draft');
      }

      if (result.success) {
        toast.success('🗑️ Draft deleted successfully!');
        setDraftPosts(prev => prev.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error(`Failed to delete draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedPost(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-yellow-600" />
                  Draft Posts ({draftPosts.length})
                </CardTitle>
                <CardDescription>
                  Work-in-progress blog posts and drafts
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchDraftPosts}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {draftPosts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Edit3 className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No draft posts yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Your work-in-progress blog posts will appear here.
            </p>
            <Button 
              onClick={() => window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 'create-post' } }))}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Start Writing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {draftPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-yellow-500">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-xl font-bold text-gray-900 leading-tight pr-4">
                          {post.title}
                        </CardTitle>
                        <Badge className="bg-yellow-100 text-yellow-800 font-medium px-3 py-1 text-xs uppercase tracking-wide">
                          Draft
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                        {post.content ? 
                          `${post.content.substring(0, 180)}...` : 
                          'No content preview available'
                        }
                      </CardDescription>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Updated {formatDate(post.updatedAt.toString())}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{post.content?.split(' ')?.length || 0} words</span>
                        </div>
                        <div className="text-gray-400">
                          • ~{Math.ceil((post.content?.split(' ')?.length || 0) / 200)} min read
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[150px]">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => editPost(post)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Continue Writing
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => publishPost(post.id, post.title)}
                        className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Publish
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => viewPost(post)}
                        className="w-full hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => deletePost(post.id, post.title)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {post.keywords && post.keywords.length > 0 && (
                  <CardContent>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Keywords:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.keywords.map((keyword, keyIndex) => (
                        <Badge 
                          key={`${keyword}-${keyIndex}`}
                          variant="outline"
                          className="text-xs"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Blog Post Preview Modal */}
      {showPreview && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPost.title}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(selectedPost.updatedAt.toString())}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {selectedPost.content?.split(' ')?.length || 0} words
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Draft
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" onClick={closePreview}>
                  Close
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap">{selectedPost.content}</div>
              </div>
              {selectedPost.keywords && selectedPost.keywords.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Keywords:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
