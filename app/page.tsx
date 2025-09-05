
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BreadcrumbNavigation, { useBreadcrumb } from '@/components/breadcrumb-navigation';
import { 
  PenTool, 
  Search, 
  Layers, 
  Lightbulb, 
  BookOpen, 
  Settings,
  FileText,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';

// Dynamic imports for components with animations to prevent hydration issues
const KeywordSearch = dynamic(() => import('@/components/keyword-search'), { ssr: false });
const KeywordClustering = dynamic(() => import('@/components/keyword-clustering'), { ssr: false });
const ContentIdeas = dynamic(() => import('@/components/content-ideas'), { ssr: false });
const TopicSuggestions = dynamic(() => import('@/components/topic-suggestions'), { ssr: false });
const ContentEditor = dynamic(() => import('@/components/content-editor'), { ssr: false });
const ContentStrategyGenerator = dynamic(() => import('@/components/content-strategy'), { ssr: false });
const BlogList = dynamic(() => import('@/components/blog-list'), { ssr: false });

type TabType = 'overview' | 'keywords' | 'clustering' | 'ideas' | 'topics' | 'strategy' | 'editor' | 'blog-list';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'keywords', label: 'Keyword Research', icon: Search },
  { id: 'clustering', label: 'Clustering', icon: Layers },
  { id: 'ideas', label: 'Content Ideas', icon: Lightbulb },
  { id: 'topics', label: 'Topic Suggestions', icon: BookOpen },
  { id: 'strategy', label: 'Strategy', icon: Settings },
  { id: 'editor', label: 'Content Editor', icon: PenTool },
  { id: 'blog-list', label: 'My Posts', icon: FileText },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editingPostTitle, setEditingPostTitle] = useState<string>('');
  const { buildBreadcrumb } = useBreadcrumb();

  // Listen for editing state changes from localStorage and events
  useEffect(() => {
    const updateEditingState = () => {
      const editPostData = localStorage.getItem('editPostData');
      if (editPostData) {
        try {
          const postData = JSON.parse(editPostData);
          setEditingPostTitle(postData.title || '');
        } catch (error) {
          console.error('Error parsing edit post data:', error);
          setEditingPostTitle('');
        }
      } else {
        setEditingPostTitle('');
      }
    };

    // Initial check
    updateEditingState();

    // Listen for localStorage changes and custom events
    const handleEditRequest = () => updateEditingState();
    const handleCreateNewPost = () => setEditingPostTitle('');
    const handleNavigateToTab = (event: CustomEvent) => {
      const { tab } = event.detail;
      if (tab && tabs.find(t => t.id === tab)) {
        setActiveTab(tab as TabType);
      }
    };
    
    window.addEventListener('postEditRequested', handleEditRequest);
    window.addEventListener('createNewPost', handleCreateNewPost);
    window.addEventListener('navigateToTab', handleNavigateToTab as EventListener);
    window.addEventListener('storage', updateEditingState);

    return () => {
      window.removeEventListener('postEditRequested', handleEditRequest);
      window.removeEventListener('createNewPost', handleCreateNewPost);
      window.removeEventListener('navigateToTab', handleNavigateToTab as EventListener);
      window.removeEventListener('storage', updateEditingState);
    };
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'keywords':
        return <KeywordSearch />;
      case 'clustering':
        return <KeywordClustering />;
      case 'ideas':
        return <ContentIdeas />;
      case 'topics':
        return <TopicSuggestions />;
      case 'strategy':
        return <ContentStrategyGenerator />;
      case 'editor':
        return <ContentEditor />;
      case 'blog-list':
        return <BlogList />;
      default:
        return <OverviewContent setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <PenTool className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI BlogWriter Pro</h1>
                <p className="text-sm text-gray-600">Intelligent Content Creation</p>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI-Powered
            </Badge>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Breadcrumb Navigation */}
      {activeTab !== 'overview' && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <BreadcrumbNavigation
              items={buildBreadcrumb(
                activeTab,
                editingPostTitle,
                () => setActiveTab('overview'),
                () => setActiveTab('blog-list')
              )}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}

function OverviewContent({ setActiveTab }: { setActiveTab: (tab: TabType) => void }) {
  const features = [
    {
      icon: Search,
      title: 'Keyword Research',
      description: 'Discover high-value keywords with search volume and difficulty analysis',
      color: 'bg-blue-500',
      tab: 'keywords' as TabType,
    },
    {
      icon: Layers,
      title: 'Keyword Clustering',
      description: 'Group keywords into semantic clusters for better content organization',
      color: 'bg-purple-500',
      tab: 'clustering' as TabType,
    },
    {
      icon: Lightbulb,
      title: 'Content Ideas',
      description: 'Generate creative content ideas based on your target keywords',
      color: 'bg-yellow-500',
      tab: 'ideas' as TabType,
    },
    {
      icon: BookOpen,
      title: 'Topic Suggestions',
      description: 'Get specific topic ideas with unique angles for your content',
      color: 'bg-indigo-500',
      tab: 'topics' as TabType,
    },
    {
      icon: Settings,
      title: 'Content Strategy',
      description: 'Create comprehensive content strategies with SEO recommendations',
      color: 'bg-blue-600',
      tab: 'strategy' as TabType,
    },
    {
      icon: PenTool,
      title: 'AI Content Editor',
      description: 'Generate and edit high-quality blog content with AI assistance',
      color: 'bg-emerald-500',
      tab: 'editor' as TabType,
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
        <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          AI-Powered Content Creation
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
          Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Exceptional</span> Blog Content
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          From keyword research to content creation, streamline your blog writing process with intelligent AI tools designed for modern content creators.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button 
            size="lg" 
            onClick={() => setActiveTab('editor')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
          >
            Start Writing
            <PenTool className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setActiveTab('keywords')}
            className="px-8 py-3 text-lg"
          >
            Keyword Research
            <Search className="w-5 h-5 ml-2" />
          </Button>
        </div>
        </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="group cursor-pointer"
              onClick={() => setActiveTab(feature.tab)}
            >
              <Card className="h-full border-2 border-transparent group-hover:border-gray-200 group-hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
                    Explore Feature
                    <TrendingUp className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold mb-2">AI-Powered</div>
            <div className="text-blue-200">Content Generation</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">SEO</div>
            <div className="text-blue-200">Optimized Content</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">Smart</div>
            <div className="text-blue-200">Keyword Research</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">Streamlined</div>
            <div className="text-blue-200">Workflow</div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Follow these steps to create your first AI-generated blog post
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Research Keywords</h4>
                  <p className="text-gray-600 text-sm">Start by finding relevant keywords for your topic using our keyword research tool.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Plan Content Strategy</h4>
                  <p className="text-gray-600 text-sm">Generate content ideas and develop a comprehensive strategy for your blog post.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Create Content</h4>
                  <p className="text-gray-600 text-sm">Use our AI content editor to generate and refine your blog post with streaming AI assistance.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      
    </div>
  );
}
