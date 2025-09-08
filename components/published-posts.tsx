
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Tag, Eye, Edit, Archive, CheckCircle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { BlogPost } from '@/lib/types';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function PublishedPosts() {
  const [publishedPosts, setPublishedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchPublishedPosts();
  }, []);

  const fetchPublishedPosts = async () => {
    try {
      console.log('📚 Fetching published posts...');
      const response = await fetch('/api/blog/list');
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Failed to fetch blog posts:', data);
        setPublishedPosts([]);
        return;
      }
      
      // Filter only published posts
      const published = (data.blogPosts || []).filter((post: BlogPost) => post.status === 'published');
      console.log('✅ Published posts fetched:', published.length);
      setPublishedPosts(published);
    } catch (error) {
      console.error('Error fetching published posts:', error);
      setPublishedPosts([]);
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

  const updatePostStatus = async (postId: string, newStatus: 'draft' | 'ready_to_publish' | 'published') => {
    try {
      const response = await fetch('/api/blog/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, status: newStatus }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update post status');
      }

      if (result.success) {
        // Update the local state
        setPublishedPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, status: newStatus, updatedAt: new Date() }
              : post
          ).filter(post => post.status === 'published') // Keep only published posts in this view
        );
        
        toast.success(`✅ Post status updated to ${newStatus === 'ready_to_publish' ? 'Ready to Publish' : 'Draft'}!`);
      }
    } catch (error) {
      console.error('❌ Error updating post status:', error);
      toast.error('Failed to update post status. Please try again.');
    }
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
      
      console.log('📝 Loading published post for direct editing:', editData);
      localStorage.setItem('editPostData', JSON.stringify(editData));
      
      // Dispatch event to switch to content editor directly (skip workflow)
      window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 'create-post', skipWorkflow: true } }));
      window.dispatchEvent(new CustomEvent('postEditRequested', { detail: editData }));
      
      toast.success('✏️ Opening post in editor...');
    } catch (error) {
      console.error('❌ Error preparing published post for editing:', error);
      toast.error('Failed to load post for editing. Please try again.');
    }
  };

  const archivePost = async (postId: string) => {
    if (!confirm('Are you sure you want to archive this published post?')) {
      return;
    }

    try {
      const response = await fetch('/api/blog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          status: 'archived',
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to archive post');
      }

      if (result.success) {
        toast.success('📦 Post archived successfully!');
        setPublishedPosts(prev => prev.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Error archiving post:', error);
      toast.error(`Failed to archive post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedPost(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Published Posts ({publishedPosts.length})
                </CardTitle>
                <CardDescription>
                  Your live, published blog content
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchPublishedPosts}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {publishedPosts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No published posts yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Your published blog posts will appear here once you publish them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {publishedPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-xl font-bold text-gray-900 leading-tight pr-4">
                          {post.title}
                        </CardTitle>
                        <Badge className="bg-green-100 text-green-800 font-medium px-3 py-1 text-xs uppercase tracking-wide">
                          Published
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
                          <span>Published {formatDate(post.updatedAt.toString())}</span>
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
                      {/* Stage Management Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updatePostStatus(post.id, 'ready_to_publish')}
                        className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Unpublish
                      </Button>
                      
                      {/* Regular Action Buttons */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => viewPost(post)}
                        className="w-full hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Post
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => editPost(post)}
                        className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-gray-600 hover:text-gray-700 hover:bg-gray-50 border-gray-200"
                        onClick={() => archivePost(post.id)}
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
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
                    <Badge className="bg-green-100 text-green-800">
                      Published
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
                <ReactMarkdown
                  components={{
                    img: ({ node, ...props }) => (
                      <img
                        {...props}
                        className="max-w-full h-auto rounded-lg border shadow-sm"
                        style={{ maxHeight: '400px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzEgOTFMMjAwIDEyMEwyMjkgOTFMMjgwIDE0MlYxODBIMjgwVjE4MEgyODBWMTgwSDI4MFYxODBIMTIwVjE0MkwxNzEgOTFaIiBmaWxsPSIjOUNBM0FGIi8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjkwIiByPSIxMCIgZmlsbD0iIzlDQTNBRiIvPgo8dGV4dCB4PSIyMDAiIHk9IjIxMCIgZmlsbD0iIzlDQTNBRiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIExvYWRpbmcuLi48L3RleHQ+Cjwvc3ZnPgo=';
                        }}
                      />
                    )
                  }}
                >
                  {selectedPost.content}
                </ReactMarkdown>
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
