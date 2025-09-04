
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Target, Clock, TrendingUp, Search, Bookmark, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import { TopicSuggestion, KeywordCluster } from '@/lib/types';
import { toast } from 'sonner';

export default function TopicSuggestions() {
  const [savedKeywordSets, setSavedKeywordSets] = useState<KeywordCluster[]>([]);
  const [selectedKeywordSet, setSelectedKeywordSet] = useState<string>('');
  const [niche, setNiche] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Load saved keyword sets on component mount
  const loadSavedKeywordSets = async () => {
    try {
      const response = await fetch('/api/keywords/save');
      const data = await response.json();
      setSavedKeywordSets(data.clusters || []);
    } catch (error) {
      console.error('Error loading saved keyword sets:', error);
    }
  };

  const generateTopics = async () => {
    if (!selectedKeywordSet) {
      toast.error('Please select a keyword set first');
      return;
    }
    
    const selectedSet = savedKeywordSets.find(set => set.id === selectedKeywordSet);
    if (!selectedSet || !selectedSet.keywords.length) {
      toast.error('Selected keyword set is empty');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/topics/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          niche: niche || 'general', 
          keywords: selectedSet.keywords, 
          difficulty 
        }),
      });
      
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setTopics(data.topics || []);
      toast.success(`Generated ${data.topics?.length || 0} topic suggestions from "${selectedSet.name}"`);
    } catch (error) {
      console.error('Error generating topics:', error);
      toast.error('Failed to generate topic suggestions');
    } finally {
      setLoading(false);
    }
  };

  const createBlogFromTopic = (topic: TopicSuggestion) => {
    // Store the topic data for the content editor
    localStorage.setItem('contentIdeaData', JSON.stringify({
      title: topic.topic,
      description: topic.angle,
      keywords: topic.targetKeywords || [],
      difficulty: topic.difficulty,
      estimatedLength: topic.estimatedLength,
      from: 'topic-suggestion'
    }));
    
    // Navigate to content editor tab
    const contentEditorTab = document.querySelector('[data-tab="editor"]') as HTMLElement;
    contentEditorTab?.click();
    
    toast.success('Topic loaded in editor!');
  };

  useEffect(() => {
    loadSavedKeywordSets();
  }, []);

  const selectedSet = savedKeywordSets.find(set => set.id === selectedKeywordSet);

  const getDifficultyColor = (diff: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      hard: 'bg-red-100 text-red-800',
    };
    return colors[diff] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Topic Suggestions
            </CardTitle>
            <CardDescription>
              Get specific topic ideas with unique angles based on your saved keyword research
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedKeywordSets.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No keyword sets found</h3>
                <p className="text-gray-600 mb-4">You need saved keyword sets to generate topic suggestions</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Follow these steps:</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>1. Go to <strong>Keyword Research</strong> tab</p>
                    <p>2. Search and save keyword sets</p>
                    <p>3. Return here to generate topic suggestions</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Keyword Set *
                  </label>
                  <Select value={selectedKeywordSet} onValueChange={setSelectedKeywordSet}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a saved keyword set..." />
                    </SelectTrigger>
                    <SelectContent>
                      {savedKeywordSets.map((set) => (
                        <SelectItem key={set.id} value={set.id}>
                          {set.name} ({set.keywords.length} keywords)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSet && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-600" />
                      Selected: {selectedSet.name}
                    </h4>
                    {selectedSet.description && (
                      <p className="text-sm text-gray-600 mb-3">{selectedSet.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {selectedSet.keywords.slice(0, 12).map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {selectedSet.keywords.length > 12 && (
                        <Badge variant="secondary" className="text-xs">
                          +{selectedSet.keywords.length - 12} more
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Total keywords: {selectedSet.keywords.length}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Niche/Industry
                    </label>
                    <Input
                      placeholder="e.g., sustainable technology, health & wellness"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Content Difficulty Level
                    </label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy (Beginner-friendly)</SelectItem>
                        <SelectItem value="medium">Medium (Intermediate)</SelectItem>
                        <SelectItem value="hard">Hard (Advanced/Expert)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={generateTopics}
                  disabled={loading || !selectedKeywordSet}
                  className="w-full"
                >
                  {loading ? 'Generating Topics...' : 'Generate Topic Suggestions'}
                  <TrendingUp className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {topics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Topic Suggestions ({topics.length})
            </h3>
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              From: {selectedSet?.name}
            </Badge>
          </div>
          <div className="grid gap-4">
            {topics.map((topic, index) => (
              <motion.div
                key={`${topic.topic}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-indigo-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg leading-tight pr-4">
                        {topic.topic}
                      </CardTitle>
                      <Badge className={getDifficultyColor(topic.difficulty)}>
                        {topic.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      <strong>Unique Angle:</strong> {topic.angle}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Target className="w-4 h-4" />
                          Target Keywords
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {topic.targetKeywords?.map?.((keyword, keyIndex) => (
                            <Badge 
                              key={`${keyword}-${keyIndex}`}
                              variant="outline"
                              className="text-xs"
                            >
                              {keyword}
                            </Badge>
                          )) || []}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {topic.estimatedLength}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => createBlogFromTopic(topic)}
                          className="flex items-center gap-1"
                        >
                          <PenTool className="w-3 h-3" />
                          Generate Blog
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {topics.length === 0 && selectedKeywordSet && !loading && savedKeywordSets.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Topics</h3>
            <p className="text-gray-600 text-center">
              Click "Generate Topic Suggestions" to create specific topic ideas based on your selected keywords.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
