
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Tag, Eye, Edit, Trash2, Plus, X, ArrowRight, CheckCircle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { BlogPost } from '@/lib/types';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

// Dynamic import to prevent SSR issues
const ContentEditor = dynamic(() => import('@/components/content-editor'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
});

export default function BlogList() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingModalPost, setEditingModalPost] = useState<BlogPost | null>(null);

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
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'ready_to_publish':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'ready_to_publish':
        return 'Ready to Publish';
      case 'published':
        return 'Published';
      default:
        return 'Draft';
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
      
      console.log('📝 Loading post for direct editing:', editData);
      localStorage.setItem('editPostData', JSON.stringify(editData));
      
      // Dispatch event to switch to content editor directly (skip workflow)
      window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 'create-post', skipWorkflow: true } }));
      window.dispatchEvent(new CustomEvent('postEditRequested', { detail: editData }));
      
      toast.success('✏️ Opening post in editor...');
    } catch (error) {
      console.error('❌ Error preparing post for editing:', error);
      toast.error('Failed to prepare post for editing. Please try again.');
    }
  };

  const editPostInModal = (post: BlogPost) => {
    try {
      // Save post data to localStorage for the content editor
      const editData = {
        id: post.id,
        title: post.title,
        content: post.content,
        keywords: post.keywords,
        status: post.status
      };
      
      console.log('📝 Loading post data for modal editing:', editData);
      localStorage.setItem('editPostData', JSON.stringify(editData));
      
      // Dispatch a custom event to notify the content editor
      window.dispatchEvent(new CustomEvent('postEditRequested', { detail: editData }));
      
      // Open the modal
      setEditingModalPost(post);
      setShowEditModal(true);
      
      toast.success('✏️ Post loaded for editing in modal!');
    } catch (error) {
      console.error('❌ Error preparing post for modal editing:', error);
      toast.error('Failed to load post for editing. Please try again.');
    }
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
        setBlogPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, status: newStatus, updatedAt: new Date() }
              : post
          )
        );
        
        toast.success(`✅ Post status updated to ${getStatusDisplayName(newStatus)}!`);
      }
    } catch (error) {
      console.error('❌ Error updating post status:', error);
      toast.error('Failed to update post status. Please try again.');
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'draft':
        return 'ready_to_publish';
      case 'ready_to_publish':
        return 'published';
      default:
        return 'draft';
    }
  };

  const getPreviousStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'published':
        return 'ready_to_publish';
      case 'ready_to_publish':
        return 'draft';
      default:
        return 'draft';
    }
  };

  const getStageProgressText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'draft':
        return 'Mark Ready to Publish';
      case 'ready_to_publish':
        return 'Publish Now';
      case 'published':
        return 'Move to Draft';
      default:
        return 'Next Stage';
    }
  };

  const getStageRegressText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'published':
        return 'Unpublish';
      case 'ready_to_publish':
        return 'Back to Draft';
      default:
        return 'Previous Stage';
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

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingModalPost(null);
    
    // Clear editing data from localStorage to prevent conflicts
    localStorage.removeItem('editPostData');
    
    // Dispatch event to clear the content editor
    window.dispatchEvent(new CustomEvent('createNewPost'));
    
    // Refresh the post list in case changes were made
    fetchBlogPosts();
  };

  const createNewPost = () => {
    // Clear any existing edit data
    localStorage.removeItem('editPostData');
    
    // Dispatch event to clear content editor
    window.dispatchEvent(new CustomEvent('createNewPost'));
    
    toast.success('🚀 Ready to create a new post! Switch to "Content Editor" tab to start writing.', {
      duration: 4000,
    });
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
              <div className="flex items-center gap-3">
                <Button 
                  onClick={createNewPost}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Post
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchBlogPosts}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {blogPosts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No blog posts yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Start by creating your first blog post to see it appear here.
            </p>
            <Button 
              onClick={createNewPost}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Post
            </Button>
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
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-xl font-bold text-gray-900 leading-tight pr-4">
                          {post.title}
                        </CardTitle>
                        <Badge className={`${getStatusColor(post.status)} font-medium px-3 py-1 text-xs uppercase tracking-wide`}>
                          {getStatusDisplayName(post.status)}
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
                      {/* Stage Management Buttons */}
                      <div className="flex gap-1">
                        {post.status !== 'published' && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => updatePostStatus(post.id, getNextStatus(post.status))}
                            className={`flex-1 text-xs ${
                              post.status === 'ready_to_publish' 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {post.status === 'ready_to_publish' ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <ArrowRight className="w-3 h-3 mr-1" />
                            )}
                            {getStageProgressText(post.status)}
                          </Button>
                        )}
                        {post.status !== 'draft' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => updatePostStatus(post.id, getPreviousStatus(post.status))}
                            className="flex-1 text-xs text-gray-600 hover:text-gray-700"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            {getStageRegressText(post.status)}
                          </Button>
                        )}
                      </div>
                      
                      {/* Regular Action Buttons */}
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => editPostInModal(post)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Continue Writing
                      </Button>
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
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => deletePost(post.id)}
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
                    <Badge className={getStatusColor(selectedPost.status)}>
                      {getStatusDisplayName(selectedPost.status)}
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

      {/* Edit Post Modal with Scrollable Content */}
      {showEditModal && editingModalPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full h-[95vh] flex flex-col relative">
            {/* Modal Header - Fixed */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-white relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Post</h2>
                  <p className="text-lg text-gray-600 mt-1 truncate max-w-md">{editingModalPost.title}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={closeEditModal}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Close
                </Button>
              </div>
            </div>
            
            {/* Modal Content - Scrollable with proper height calculation */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden modal-content-scroll min-h-0">
              <div className="p-6 h-full">
                <ContentEditor />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
