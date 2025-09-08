
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, Target, BarChart3, Save, Bookmark, Trash2, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import { KeywordSuggestion, KeywordCluster } from '@/lib/types';
import { toast } from 'sonner';

export default function KeywordSearch() {
  const [query, setQuery] = useState('');
  const [niche, setNiche] = useState('');
  const [keywords, setKeywords] = useState<KeywordSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [savedClusters, setSavedClusters] = useState<KeywordCluster[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [clusterName, setClusterName] = useState('');
  const [clusterDescription, setClusterDescription] = useState('');

  const searchKeywords = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/keywords/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, niche }),
      });
      
      const data = await response.json();
      setKeywords(data.keywords || []);
    } catch (error) {
      console.error('Error searching keywords:', error);
      toast.error('Failed to search keywords');
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) 
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const loadSavedClusters = async () => {
    try {
      const response = await fetch('/api/keywords/save');
      const data = await response.json();
      setSavedClusters(data.clusters || []);
    } catch (error) {
      console.error('Error loading saved clusters:', error);
    }
  };

  const saveKeywords = async () => {
    if (selectedKeywords.length === 0) {
      toast.error('Please select keywords to save');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/keywords/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords: selectedKeywords,
          name: clusterName.trim() || `Keyword Set - ${new Date().toLocaleDateString()}`,
          description: clusterDescription.trim() || undefined
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Keywords saved successfully!');
        setSelectedKeywords([]);
        setClusterName('');
        setClusterDescription('');
        setSaveDialogOpen(false);
        loadSavedClusters();
      } else {
        toast.error(data.error || 'Failed to save keywords');
      }
    } catch (error) {
      console.error('Error saving keywords:', error);
      toast.error('Failed to save keywords');
    } finally {
      setSaving(false);
    }
  };

  const loadKeywordsFromCluster = (cluster: KeywordCluster) => {
    console.log('🔄 Loading keywords from cluster:', cluster.name, cluster.keywords);
    setSelectedKeywords(cluster.keywords);
    toast.success(`Loaded ${cluster.keywords.length} keywords from "${cluster.name}"`);
    
    // Switch to search tab to show the loaded keywords
    const searchTab = document.querySelector('[value="search"]') as HTMLElement;
    if (searchTab) {
      searchTab.click();
    }
  };

  useEffect(() => {
    loadSavedClusters();
  }, []);

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'bg-green-500';
    if (difficulty <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Keywords
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            Saved Keywords ({savedClusters.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  Keyword Research
                </CardTitle>
                <CardDescription>
                  Discover high-value keywords for your content strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Search Query *
                    </label>
                    <Input
                      placeholder="e.g., sustainable fashion trends"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Niche/Industry
                    </label>
                    <Input
                      placeholder="e.g., fashion, technology"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={searchKeywords}
                  disabled={loading || !query.trim()}
                  className="w-full"
                >
                  {loading ? 'Searching...' : 'Search Keywords'}
                  <Search className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {keywords.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Keyword Results ({keywords.length})
                      </CardTitle>
                      <CardDescription>
                        Click keywords to select them for saving or clustering
                      </CardDescription>
                    </div>
                    {selectedKeywords.length > 0 && (
                      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Save Selected ({selectedKeywords.length})
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Save Keyword Set</DialogTitle>
                            <DialogDescription>
                              Save your selected keywords for future use in content planning
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Name
                              </label>
                              <Input
                                placeholder="e.g., Fashion Marketing Keywords"
                                value={clusterName}
                                onChange={(e) => setClusterName(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Description (optional)
                              </label>
                              <Textarea
                                placeholder="Brief description of this keyword set..."
                                value={clusterDescription}
                                onChange={(e) => setClusterDescription(e.target.value)}
                                rows={3}
                              />
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Selected Keywords ({selectedKeywords.length}):
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {selectedKeywords.map((keyword) => (
                                  <Badge key={keyword} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={saveKeywords} disabled={saving}>
                              {saving ? 'Saving...' : 'Save Keywords'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {keywords.map((keyword, index) => (
                      <motion.div
                        key={`${keyword.keyword}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedKeywords.includes(keyword.keyword)
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleKeyword(keyword.keyword)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{keyword.keyword}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {keyword.relevance}/10
                            </Badge>
                            {selectedKeywords.includes(keyword.keyword) && (
                              <Badge className="bg-blue-600 text-white">Selected</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {keyword.searchVolume && (
                            <div className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              {keyword.searchVolume?.toLocaleString()} searches
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${getDifficultyColor(keyword.difficulty || 0)}`} />
                            Difficulty: {keyword.difficulty}/10
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {selectedKeywords.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Selected Keywords ({selectedKeywords.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedKeywords([])}
                          >
                            Clear All
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('keywordsSelectedForPost', { 
                                detail: { keywords: selectedKeywords } 
                              }));
                              toast.success(`Selected ${selectedKeywords.length} keywords for your blog post!`);
                            }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            Use for Post
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedKeywords.map((keyword) => (
                          <Badge 
                            key={keyword}
                            variant="secondary"
                            className="cursor-pointer hover:bg-red-100"
                            onClick={() => toggleKeyword(keyword)}
                          >
                            {keyword} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-purple-600" />
                  Saved Keyword Sets
                </CardTitle>
                <CardDescription>
                  Your saved keyword collections for content planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedClusters.length === 0 ? (
                  <div className="text-center py-8">
                    <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No saved keywords yet</h3>
                    <p className="text-gray-600 mb-4">Search for keywords and save them to see them here</p>
                    <Button variant="outline" onClick={() => (document.querySelector('[value="search"]') as HTMLElement)?.click()}>
                      Start Searching
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {savedClusters.map((cluster) => (
                      <motion.div
                        key={cluster.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">{cluster.name}</h3>
                            {cluster.description && (
                              <p className="text-sm text-gray-600">{cluster.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadKeywordsFromCluster(cluster)}
                              className="flex items-center gap-1"
                            >
                              <Target className="w-3 h-3" />
                              Load ({cluster.keywords.length})
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                console.log('🚀 Using keywords for post:', cluster.keywords);
                                
                                // Set the selected keywords state
                                setSelectedKeywords(cluster.keywords);
                                
                                // Dispatch event for workflow
                                const event = new CustomEvent('keywordsSelectedForPost', { 
                                  detail: { keywords: cluster.keywords } 
                                });
                                window.dispatchEvent(event);
                                console.log('📡 Event dispatched:', event);
                                
                                toast.success(`Using ${cluster.keywords.length} keywords from "${cluster.name}" for your blog post!`);
                                
                                // Optional: Switch to search tab to show selected keywords
                                setTimeout(() => {
                                  const searchTab = document.querySelector('[value="search"]') as HTMLElement;
                                  if (searchTab) {
                                    searchTab.click();
                                  }
                                }, 1000);
                              }}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-1"
                            >
                              <PenTool className="w-3 h-3" />
                              Use for Post
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cluster.keywords.slice(0, 10).map((keyword) => (
                            <Badge key={keyword} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {cluster.keywords.length > 10 && (
                            <Badge variant="secondary" className="text-xs">
                              +{cluster.keywords.length - 10} more
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span>Created: {new Date(cluster.createdAt).toLocaleDateString()}</span>
                          <span>{cluster.keywords.length} keywords</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
