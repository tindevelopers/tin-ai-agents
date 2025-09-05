
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Calendar, Tag, Eye, Edit, Trash2, Plus, Search, Filter, TrendingUp, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import { BlogPost } from '@/lib/types';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const ContentEditor = dynamic(() => import('@/components/content-editor'), { ssr: false });

interface DashboardViewProps {
  onCreateNewPost: () => void;
}

export default function DashboardView({ onCreateNewPost }: DashboardViewProps) {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      console.log('📚 Dashboard: Fetching blog posts...');
      const response = await fetch('/api/blog/list');
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Failed to fetch blog posts:', data);
        setBlogPosts([]);
        return;
      }
      
      console.log('✅ Dashboard: Blog posts fetched:', data.blogPosts?.length || 0);
      setBlogPosts(data.blogPosts || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setBlogPosts([]);
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
      const editData = {
        id: post.id,
        title: post.title,
        content: post.content,
        keywords: post.keywords,
        status: post.status
      };
      
      console.log('📝 Dashboard: Preparing post for editing:', editData);
      localStorage.setItem('editPostData', JSON.stringify(editData));
      
      setSelectedPost(post);
      setShowEditModal(true);
      
      toast.success('✏️ Post loaded for editing!');
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

  const duplicatePost = (post: BlogPost) => {
    const duplicateData = {
      title: `Copy of ${post.title}`,
      content: post.content,
      keywords: post.keywords,
      status: 'draft' as const
    };
    
    localStorage.setItem('contentIdeaData', JSON.stringify(duplicateData));
    onCreateNewPost();
    toast.success('Post duplicated! Ready to edit the copy.');
  };

  // Filter posts based on search and status
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalPosts = blogPosts.length;
  const draftPosts = blogPosts.filter(p => p.status === 'draft').length;
  const publishedPosts = blogPosts.filter(p => p.status === 'published').length;
  const totalWords = blogPosts.reduce((total, post) => total + (post.content?.split(' ')?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-gray-600">Ready to create amazing content?</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{totalPosts}</p>
                <p className="text-xs text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Edit className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{draftPosts}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{publishedPosts}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <PenTool className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{totalWords.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Words</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 items-center justify-between"
      >
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border rounded-md bg-white text-sm"
          >
            <option value="all">All Posts</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
          </select>
        </div>
        
        <Button 
          onClick={onCreateNewPost}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Post
        </Button>
      </motion.div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No posts found' : 'No blog posts yet'}
              </h3>
              <p className="text-gray-600 text-center mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start creating amazing content with AI assistance!'
                }
              </p>
              {(!searchTerm && filterStatus === 'all') && (
                <Button 
                  onClick={onCreateNewPost}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Post
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 line-clamp-2">{post.title}</CardTitle>
                      <CardDescription className="mb-3 line-clamp-3">
                        {post.content ? 
                          `${post.content.substring(0, 120)}...` : 
                          'No content preview available'
                        }
                      </CardDescription>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
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
                    <Badge className={getStatusColor(post.status)}>
                      {post.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {post.keywords && post.keywords.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <div className="flex flex-wrap gap-1">
                        {post.keywords.slice(0, 3).map((keyword, keyIndex) => (
                          <Badge 
                            key={`${keyword}-${keyIndex}`}
                            variant="outline"
                            className="text-xs"
                          >
                            {keyword}
                          </Badge>
                        ))}
                        {post.keywords.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{post.keywords.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
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
                      onClick={() => duplicatePost(post)}
                      title="Duplicate post"
                    >
                      <FileText className="w-4 h-4" />
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
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Preview Modal */}
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
                <Button variant="outline" onClick={() => setShowPreview(false)}>
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

      {/* Edit Modal */}
      {showEditModal && selectedPost && (
        <EditPostModal 
          post={selectedPost}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPost(null);
            fetchBlogPosts(); // Refresh posts after edit
          }}
        />
      )}
    </div>
  );
}

// Edit Modal Component with real ContentEditor
function EditPostModal({ post, onClose }: { post: BlogPost; onClose: () => void }) {
  const [isSaving, setIsSaving] = useState(false);

  // Listen for successful saves to close the modal
  const handleSaveSuccess = () => {
    toast.success('Post updated successfully!');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Post</h2>
              <p className="text-sm text-gray-600">{post.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <ContentEditor />
          </div>
        </div>
      </div>
    </div>
  );
}
