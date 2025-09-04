
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lightbulb, Sparkles, Tag, Users, Search, Bookmark, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { ContentIdea, KeywordCluster } from '@/lib/types';
import { toast } from 'sonner';

export default function ContentIdeas() {
  const [savedKeywordSets, setSavedKeywordSets] = useState<KeywordCluster[]>([]);
  const [selectedKeywordSet, setSelectedKeywordSet] = useState<string>('');
  const [industry, setIndustry] = useState('');
  const [audience, setAudience] = useState('');
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
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

  const generateIdeas = async () => {
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
      const response = await fetch('/api/content/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords: selectedSet.keywords, 
          industry: industry || 'general', 
          audience: audience || 'general audience' 
        }),
      });
      
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setIdeas(data.ideas || []);
      toast.success(`Generated ${data.ideas?.length || 0} content ideas from "${selectedSet.name}"`);
    } catch (error) {
      console.error('Error generating content ideas:', error);
      toast.error('Failed to generate content ideas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedKeywordSets();
  }, []);

  const selectedSet = savedKeywordSets.find(set => set.id === selectedKeywordSet);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'how-to': 'bg-blue-100 text-blue-800',
      'listicle': 'bg-green-100 text-green-800',
      'comparison': 'bg-orange-100 text-orange-800',
      'news': 'bg-red-100 text-red-800',
      'guide': 'bg-purple-100 text-purple-800',
      'case-study': 'bg-indigo-100 text-indigo-800',
      'opinion': 'bg-yellow-100 text-yellow-800',
      'tutorial': 'bg-teal-100 text-teal-800',
    };
    return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-800';
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
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Content Ideas Generator
            </CardTitle>
            <CardDescription>
              Generate creative content ideas based on your saved keyword research and target audience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedKeywordSets.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No keyword sets found</h3>
                <p className="text-gray-600 mb-4">You need saved keyword sets to generate content ideas</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Follow these steps:</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>1. Go to <strong>Keyword Research</strong> tab</p>
                    <p>2. Search and save keyword sets</p>
                    <p>3. Return here to generate content ideas</p>
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
                      <Target className="w-4 h-4 text-blue-600" />
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
                      Industry/Niche
                    </label>
                    <Input
                      placeholder="e.g., technology, health, finance"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Target Audience
                    </label>
                    <Input
                      placeholder="e.g., small business owners, beginners"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={generateIdeas}
                  disabled={loading || !selectedKeywordSet}
                  className="w-full"
                >
                  {loading ? 'Generating Ideas...' : 'Generate Content Ideas'}
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {ideas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Content Ideas ({ideas.length})
            </h3>
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              From: {selectedSet?.name}
            </Badge>
          </div>
          <div className="grid gap-4">
            {ideas.map((idea, index) => (
              <motion.div
                key={`${idea.title}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg leading-tight pr-4">
                        {idea.title}
                      </CardTitle>
                      {idea.category && (
                        <Badge className={getCategoryColor(idea.category)}>
                          {idea.category}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      {idea.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {idea.keywords?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Tag className="w-4 h-4" />
                            Target Keywords
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {idea.keywords.map((keyword, keyIndex) => (
                              <Badge 
                                key={`${keyword}-${keyIndex}`}
                                variant="outline"
                                className="text-xs"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Content Idea #{index + 1}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {ideas.length === 0 && selectedKeywordSet && !loading && savedKeywordSets.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Lightbulb className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Ideas</h3>
            <p className="text-gray-600 text-center">
              Click "Generate Content Ideas" to create engaging content suggestions based on your selected keywords.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
