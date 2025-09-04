
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Sparkles, Tag, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { ContentIdea } from '@/lib/types';

export default function ContentIdeas() {
  const [keywords, setKeywords] = useState('');
  const [industry, setIndustry] = useState('');
  const [audience, setAudience] = useState('');
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(false);

  const generateIdeas = async () => {
    if (!keywords.trim()) return;
    
    setLoading(true);
    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      
      const response = await fetch('/api/content/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keywordArray, industry, audience }),
      });
      
      const data = await response.json();
      setIdeas(data.ideas || []);
    } catch (error) {
      console.error('Error generating content ideas:', error);
    } finally {
      setLoading(false);
    }
  };

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
              Generate creative content ideas based on keywords and target audience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Keywords *
                </label>
                <Input
                  placeholder="e.g., SEO, content marketing"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Industry
                </label>
                <Input
                  placeholder="e.g., technology, health"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Target Audience
                </label>
                <Input
                  placeholder="e.g., small business owners"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={generateIdeas}
              disabled={loading || !keywords.trim()}
              className="w-full"
            >
              {loading ? 'Generating Ideas...' : 'Generate Content Ideas'}
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
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
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Content Ideas ({ideas.length})
          </h3>
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

      {ideas.length === 0 && keywords && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Lightbulb className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              Enter your keywords above and click "Generate Content Ideas" to get creative suggestions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
