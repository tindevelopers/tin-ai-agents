
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Tag, Eye, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BlogPost } from '@/lib/types';
import { toast } from 'sonner';

export default function BlogList() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      console.log('📚 Fetching blog posts...');
      const response = await fetch('/api/blog/list');
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Failed to fetch blog posts:', data);
        setBlogPosts([]);
        return;
      }
      
      console.log('✅ Blog posts fetched:', data.blogPosts?.length || 0);
      setBlogPosts(data.blogPosts || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Use completely deterministic date formatting to avoid hydration issues
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}, ${year}`;
  };

  const getStatusColor = (status: string) => {
    return status === 'published' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const viewPost = (post: BlogPost) => {
    setSelectedPost(post);
    setShowPreview(true);
  };

  const editPost = (post: BlogPost) => {
    try {
      // Save post data to localStorage for the content editor
      const editData = {
        id: post.id,
        title: post.title,
        content: post.content,
        keywords: post.keywords,
        status: post.status
      };
      
      console.log('📝 Saving edit data to localStorage:', editData);
      localStorage.setItem('editPostData', JSON.stringify(editData));
      
      // Dispatch a custom event to notify the content editor
      window.dispatchEvent(new CustomEvent('postEditRequested', { detail: editData }));
      
      toast.success('✏️ Post loaded for editing! Switch to "Content Editor" tab to continue.', {
        duration: 5000,
      });
    } catch (error) {
      console.error('❌ Error preparing post for editing:', error);
      toast.error('Failed to prepare post for editing. Please try again.');
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
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
        throw new Error(result.error || 'Failed to delete post');
      }

      if (result.success) {
        toast.success('Blog post deleted successfully!');
        setBlogPosts(prev => prev.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(`Failed to delete post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedPost(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                  <FileText className="w-5 h-5 text-slate-600" />
                  Your Blog Posts ({blogPosts.length})
                </CardTitle>
                <CardDescription>
                  Manage your saved blog posts and drafts
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchBlogPosts}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {blogPosts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No blog posts yet</h3>
            <p className="text-gray-600 text-center">
              Start by creating content using the Content Editor to see your posts here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {blogPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                      <CardDescription className="mb-3">
                        {post.content ? 
                          `${post.content.substring(0, 150)}...` : 
                          'No content preview available'
                        }
                      </CardDescription>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(post.updatedAt.toString())}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {post.content?.split(' ')?.length || 0} words
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <Badge className={getStatusColor(post.status)}>
                        {post.status}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewPost(post)}
                          title="View post"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => editPost(post)}
                          title="Edit post"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deletePost(post.id)}
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
                    <Badge className={getStatusColor(selectedPost.status)}>
                      {selectedPost.status}
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
