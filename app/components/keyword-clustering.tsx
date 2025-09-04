
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Hash, Sparkles, Target, BookOpen, Search, Bookmark, Save, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { KeywordCluster } from '@/lib/types';
import { toast } from 'sonner';

interface ClusterResult {
  name: string;
  keywords: string[];
  description: string;
}

export default function KeywordClustering() {
  const [savedKeywordSets, setSavedKeywordSets] = useState<KeywordCluster[]>([]);
  const [selectedKeywordSet, setSelectedKeywordSet] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generatedClusters, setGeneratedClusters] = useState<ClusterResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedClusterToSave, setSelectedClusterToSave] = useState<ClusterResult | null>(null);

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

  const generateClusters = async () => {
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
      const response = await fetch('/api/keywords/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: selectedSet.keywords }),
      });
      
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setGeneratedClusters(data.clusters || []);
      toast.success(`Generated ${data.clusters?.length || 0} clusters from "${selectedSet.name}"`);
    } catch (error) {
      console.error('Error clustering keywords:', error);
      toast.error('Failed to cluster keywords');
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
      'border-pink-200 bg-pink-50',
      'border-indigo-200 bg-indigo-50',
      'border-yellow-200 bg-yellow-50',
      'border-teal-200 bg-teal-50'
    ];
    return colors[index % colors.length];
  };

  const saveCluster = async (cluster: ClusterResult) => {
    setSaving(true);
    try {
      const response = await fetch('/api/keywords/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords: cluster.keywords,
          name: `${cluster.name} Cluster`,
          description: `Clustered keywords: ${cluster.description}`
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`"${cluster.name}" cluster saved successfully!`);
        loadSavedKeywordSets(); // Refresh the saved keyword sets
      } else {
        toast.error(data.error || 'Failed to save cluster');
      }
    } catch (error) {
      console.error('Error saving cluster:', error);
      toast.error('Failed to save cluster');
    } finally {
      setSaving(false);
    }
  };

  const saveAllClusters = async () => {
    if (generatedClusters.length === 0) return;
    
    setSaving(true);
    try {
      let savedCount = 0;
      for (const cluster of generatedClusters) {
        const response = await fetch('/api/keywords/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            keywords: cluster.keywords,
            name: `${cluster.name} Cluster`,
            description: `Auto-generated cluster: ${cluster.description}`
          }),
        });
        
        const data = await response.json();
        if (data.success) {
          savedCount++;
        }
      }
      
      if (savedCount === generatedClusters.length) {
        toast.success(`All ${savedCount} clusters saved successfully!`);
        loadSavedKeywordSets();
      } else {
        toast.error(`Only ${savedCount}/${generatedClusters.length} clusters saved`);
      }
    } catch (error) {
      console.error('Error saving all clusters:', error);
      toast.error('Failed to save clusters');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSavedKeywordSets();
  }, []);

  const selectedSet = savedKeywordSets.find(set => set.id === selectedKeywordSet);

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
              Group keywords from your saved research into semantic clusters for better content organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedKeywordSets.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No keyword sets found</h3>
                <p className="text-gray-600 mb-4">You need to search and save keywords first before clustering them</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Follow these steps:</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>1. Go to <strong>Keyword Research</strong> tab</p>
                    <p>2. Search for keywords in your niche</p>
                    <p>3. Select and save keyword sets</p>
                    <p>4. Return here to cluster them</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Keyword Set to Cluster
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
                    <h4 className="font-medium text-gray-900 mb-2">
                      Selected: {selectedSet.name}
                    </h4>
                    {selectedSet.description && (
                      <p className="text-sm text-gray-600 mb-3">{selectedSet.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {selectedSet.keywords.slice(0, 15).map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {selectedSet.keywords.length > 15 && (
                        <Badge variant="secondary" className="text-xs">
                          +{selectedSet.keywords.length - 15} more
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Total keywords: {selectedSet.keywords.length}
                    </p>
                  </div>
                )}

                <Button 
                  onClick={generateClusters}
                  disabled={loading || !selectedKeywordSet}
                  className="w-full"
                >
                  {loading ? 'Clustering Keywords...' : 'Generate Clusters'}
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {generatedClusters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Generated Clusters ({generatedClusters.length})
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                From: {selectedSet?.name}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={saveAllClusters}
                disabled={saving}
                className="flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                {saving ? 'Saving...' : 'Save All Clusters'}
              </Button>
            </div>
          </div>
          
          <div className="grid gap-4">
            {generatedClusters.map((cluster, index) => (
              <motion.div
                key={`${cluster.name}-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${getClusterColor(index)} border-2 hover:shadow-lg transition-all duration-300`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getClusterColor(index).includes('blue') ? 'bg-blue-500' : 
                          getClusterColor(index).includes('green') ? 'bg-green-500' :
                          getClusterColor(index).includes('purple') ? 'bg-purple-500' :
                          getClusterColor(index).includes('orange') ? 'bg-orange-500' :
                          getClusterColor(index).includes('pink') ? 'bg-pink-500' :
                          getClusterColor(index).includes('indigo') ? 'bg-indigo-500' :
                          getClusterColor(index).includes('yellow') ? 'bg-yellow-500' : 'bg-teal-500'
                        }`} />
                        {cluster.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {cluster.keywords?.length || 0} keywords
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => saveCluster(cluster)}
                          disabled={saving}
                          className="flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </Button>
                      </div>
                    </div>
                    {cluster.description && (
                      <CardDescription className="text-sm">
                        {cluster.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {cluster.keywords?.map?.((keyword, keyIndex) => (
                        <Badge 
                          key={`${keyword}-${keyIndex}`}
                          variant="secondary"
                          className="hover:scale-105 transition-transform cursor-pointer"
                        >
                          {keyword}
                        </Badge>
                      )) || []}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              Content Strategy Insights
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="font-medium mb-1">Cluster Distribution:</p>
                <ul className="space-y-1">
                  {generatedClusters.map((cluster, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        getClusterColor(index).includes('blue') ? 'bg-blue-500' : 
                        getClusterColor(index).includes('green') ? 'bg-green-500' :
                        getClusterColor(index).includes('purple') ? 'bg-purple-500' :
                        getClusterColor(index).includes('orange') ? 'bg-orange-500' :
                        getClusterColor(index).includes('pink') ? 'bg-pink-500' :
                        getClusterColor(index).includes('indigo') ? 'bg-indigo-500' :
                        getClusterColor(index).includes('yellow') ? 'bg-yellow-500' : 'bg-teal-500'
                      }`} />
                      {cluster.name}: {cluster.keywords?.length} keywords
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Content Recommendations:</p>
                <ul className="space-y-1 text-sm">
                  <li>• Create separate content pieces for each cluster</li>
                  <li>• Use cluster themes as content pillars</li>
                  <li>• Target one primary keyword per cluster in each post</li>
                  <li>• Include secondary keywords naturally in content</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {savedKeywordSets.length > 0 && generatedClusters.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Layers className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Cluster</h3>
            <p className="text-gray-600 text-center mb-4">
              Select a keyword set from your previous research and generate intelligent clusters to organize your content strategy.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Bookmark className="w-4 h-4" />
              {savedKeywordSets.length} saved keyword sets available
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
