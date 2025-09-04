
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Hash, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { KeywordCluster } from '@/lib/types';

export default function KeywordClustering() {
  const [inputKeywords, setInputKeywords] = useState('');
  const [clusters, setClusters] = useState<KeywordCluster[]>([]);
  const [loading, setLoading] = useState(false);

  const generateClusters = async () => {
    if (!inputKeywords.trim()) return;
    
    setLoading(true);
    try {
      const keywords = inputKeywords.split(',').map(k => k.trim()).filter(k => k);
      
      const response = await fetch('/api/keywords/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords }),
      });
      
      const data = await response.json();
      setClusters(data.clusters || []);
    } catch (error) {
      console.error('Error clustering keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClusterColor = (index: number) => {
    const colors = [
      'border-blue-200 bg-blue-50',
      'border-green-200 bg-green-50', 
      'border-purple-200 bg-purple-50',
      'border-orange-200 bg-orange-50',
      'border-pink-200 bg-pink-50'
    ];
    return colors[index % colors.length];
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
              <Layers className="w-5 h-5 text-purple-600" />
              Keyword Clustering
            </CardTitle>
            <CardDescription>
              Group your keywords into semantic clusters for better content organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Keywords (comma-separated)
              </label>
              <textarea
                className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter keywords separated by commas, e.g., digital marketing, social media marketing, content marketing, email marketing, SEO optimization, search engine optimization"
                value={inputKeywords}
                onChange={(e) => setInputKeywords(e.target.value)}
              />
            </div>
            <Button 
              onClick={generateClusters}
              disabled={loading || !inputKeywords.trim()}
              className="w-full"
            >
              {loading ? 'Clustering Keywords...' : 'Generate Clusters'}
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {clusters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Keyword Clusters ({clusters.length})
          </h3>
          <div className="grid gap-4">
            {clusters.map((cluster, index) => (
              <motion.div
                key={`${cluster.name}-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${getClusterColor(index)} border-2`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{cluster.name}</CardTitle>
                    {cluster.description && (
                      <CardDescription>{cluster.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {cluster.keywords?.map?.((keyword, keyIndex) => (
                        <Badge 
                          key={`${keyword}-${keyIndex}`}
                          variant="secondary"
                          className="hover:scale-105 transition-transform"
                        >
                          {keyword}
                        </Badge>
                      )) || []}
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      {cluster.keywords?.length || 0} keywords in this cluster
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {clusters.length === 0 && inputKeywords && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Layers className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              Enter your keywords above and click "Generate Clusters" to see them organized into semantic groups.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
