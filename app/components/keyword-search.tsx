
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { KeywordSuggestion } from '@/lib/types';

export default function KeywordSearch() {
  const [query, setQuery] = useState('');
  const [niche, setNiche] = useState('');
  const [keywords, setKeywords] = useState<KeywordSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

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

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'bg-green-500';
    if (difficulty <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
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
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Keyword Results ({keywords.length})
              </CardTitle>
              <CardDescription>
                Click keywords to select them for clustering or content planning
              </CardDescription>
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
                        ? 'border-blue-500 bg-blue-50'
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedKeywords([])}
                    >
                      Clear All
                    </Button>
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
    </div>
  );
}
