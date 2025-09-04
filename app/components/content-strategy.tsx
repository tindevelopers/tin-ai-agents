
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Target, FileText, CheckCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { ContentStrategy } from '@/lib/types';

export default function ContentStrategyGenerator() {
  const [mainKeyword, setMainKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [contentType, setContentType] = useState('blog post');
  const [targetAudience, setTargetAudience] = useState('');
  const [strategy, setStrategy] = useState<ContentStrategy | null>(null);
  const [loading, setLoading] = useState(false);

  const generateStrategy = async () => {
    if (!mainKeyword.trim()) return;
    
    setLoading(true);
    try {
      const secondaryKeywordArray = secondaryKeywords 
        ? secondaryKeywords.split(',').map(k => k.trim()).filter(k => k)
        : [];
      
      const response = await fetch('/api/content/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainKeyword,
          secondaryKeywords: secondaryKeywordArray,
          contentType,
          targetAudience,
        }),
      });
      
      const data = await response.json();
      setStrategy(data.strategy || null);
    } catch (error) {
      console.error('Error generating strategy:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Content Strategy Generator
            </CardTitle>
            <CardDescription>
              Create comprehensive content strategies with SEO recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Main Keyword *
                </label>
                <Input
                  placeholder="e.g., digital marketing strategy"
                  value={mainKeyword}
                  onChange={(e) => setMainKeyword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Secondary Keywords
                </label>
                <Input
                  placeholder="e.g., SEO, social media, content marketing"
                  value={secondaryKeywords}
                  onChange={(e) => setSecondaryKeywords(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Content Type
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                >
                  <option value="blog post">Blog Post</option>
                  <option value="how-to guide">How-to Guide</option>
                  <option value="listicle">Listicle</option>
                  <option value="case study">Case Study</option>
                  <option value="comparison">Comparison</option>
                  <option value="tutorial">Tutorial</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Target Audience
                </label>
                <Input
                  placeholder="e.g., small business owners, marketers"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={generateStrategy}
              disabled={loading || !mainKeyword.trim()}
              className="w-full"
            >
              {loading ? 'Generating Strategy...' : 'Generate Content Strategy'}
              <Settings className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {strategy && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Content Strategy Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Main Focus
                  </h4>
                  <Badge variant="secondary" className="text-sm">
                    {strategy.mainKeyword}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Target Audience
                  </h4>
                  <p className="text-gray-700">{strategy.targetAudience}</p>
                </div>
              </div>

              {strategy.secondaryKeywords && strategy.secondaryKeywords.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Secondary Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {strategy.secondaryKeywords.map((keyword, index) => (
                      <Badge key={`${keyword}-${index}`} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Content Type</h4>
                  <Badge className="bg-blue-100 text-blue-800">
                    {strategy.contentType}
                  </Badge>
                </div>
                {strategy.wordCount && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Recommended Length</h4>
                    <p className="text-gray-700">{strategy.wordCount}</p>
                  </div>
                )}
              </div>

              {strategy.tone && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Writing Tone</h4>
                  <Badge className="bg-purple-100 text-purple-800">
                    {strategy.tone}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {strategy.contentStructure && strategy.contentStructure.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Content Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {strategy.contentStructure.map((section, index) => (
                    <div key={`section-${index}`} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{section}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {strategy.seoTips && strategy.seoTips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  SEO Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {strategy.seoTips.map((tip, index) => (
                    <div key={`tip-${index}`} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {!strategy && mainKeyword && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Settings className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              Enter your main keyword and click "Generate Content Strategy" to get comprehensive recommendations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
