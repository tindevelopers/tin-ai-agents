
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { TopicSuggestion } from '@/lib/types';

export default function TopicSuggestions() {
  const [niche, setNiche] = useState('');
  const [keywords, setKeywords] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const generateTopics = async () => {
    if (!niche.trim()) return;
    
    setLoading(true);
    try {
      const keywordArray = keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : [];
      
      const response = await fetch('/api/topics/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, keywords: keywordArray, difficulty }),
      });
      
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Error generating topics:', error);
    } finally {
      setLoading(false);
    }
  };

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
              Get specific topic ideas with unique angles for your content calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Niche/Industry *
                </label>
                <Input
                  placeholder="e.g., sustainable technology"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Target Keywords
                </label>
                <Input
                  placeholder="e.g., renewable energy, solar panels"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Content Difficulty Level
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy (Beginner-friendly)</option>
                <option value="medium">Medium (Intermediate)</option>
                <option value="hard">Hard (Advanced/Expert)</option>
              </select>
            </div>
            <Button 
              onClick={generateTopics}
              disabled={loading || !niche.trim()}
              className="w-full"
            >
              {loading ? 'Generating Topics...' : 'Generate Topic Suggestions'}
              <TrendingUp className="w-4 h-4 ml-2" />
            </Button>
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
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Topic Suggestions ({topics.length})
          </h3>
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
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {topic.estimatedLength}
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

      {topics.length === 0 && niche && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              Enter your niche above and click "Generate Topic Suggestions" to get specific content ideas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
