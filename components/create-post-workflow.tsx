

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, ArrowLeft, Search, Lightbulb, PenTool, CheckCircle, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Import existing components
import KeywordSearch from '@/components/keyword-search';
import ContentIdeas from '@/components/content-ideas';
import ContentEditor from '@/components/content-editor';

type WorkflowStep = 'research' | 'strategy' | 'create';

interface WorkflowData {
  selectedKeywords: string[];
  contentIdea?: any;
  title?: string;
}

export default function CreatePostWorkflow() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('research');
  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    selectedKeywords: []
  });
  const [completedSteps, setCompletedSteps] = useState<WorkflowStep[]>([]);

  useEffect(() => {
    // Listen for keyword research completion
    const handleKeywordsSelected = (event: CustomEvent) => {
      const keywords = event.detail.keywords;
      setWorkflowData(prev => ({ ...prev, selectedKeywords: keywords }));
      if (keywords.length > 0 && !completedSteps.includes('research')) {
        setCompletedSteps(prev => [...prev, 'research']);
        toast.success(`Selected ${keywords.length} keywords for your blog post!`);
      }
    };

    // Listen for content idea selection
    const handleContentIdeaSelected = (event: CustomEvent) => {
      const contentIdea = event.detail.idea;
      setWorkflowData(prev => ({ ...prev, contentIdea, title: contentIdea.title }));
      if (contentIdea && !completedSteps.includes('strategy')) {
        setCompletedSteps(prev => [...prev, 'strategy']);
        toast.success('Content strategy selected! Ready to create your post.');
      }
    };

    // Listen for successful content creation
    const handleContentCreated = (event: CustomEvent) => {
      if (!completedSteps.includes('create')) {
        setCompletedSteps(prev => [...prev, 'create']);
        toast.success('Blog post created successfully!');
      }
    };

    window.addEventListener('keywordsSelectedForPost', handleKeywordsSelected as EventListener);
    window.addEventListener('contentIdeaSelected', handleContentIdeaSelected as EventListener);
    window.addEventListener('contentCreated', handleContentCreated as EventListener);

    return () => {
      window.removeEventListener('keywordsSelectedForPost', handleKeywordsSelected as EventListener);
      window.removeEventListener('contentIdeaSelected', handleContentIdeaSelected as EventListener);
      window.removeEventListener('contentCreated', handleContentCreated as EventListener);
    };
  }, [completedSteps]);

  const steps = [
    {
      id: 'research' as WorkflowStep,
      title: 'Keyword Research',
      description: 'Find the right keywords to target',
      icon: Search,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'strategy' as WorkflowStep,
      title: 'Content Strategy',
      description: 'Generate content ideas and structure',
      icon: Lightbulb,
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'create' as WorkflowStep,
      title: 'Create Content',
      description: 'Write your AI-powered blog post',
      icon: PenTool,
      color: 'from-green-500 to-green-600',
    },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'research':
        return workflowData.selectedKeywords.length > 0;
      case 'strategy':
        return !!workflowData.contentIdea;
      case 'create':
        return completedSteps.includes('create');
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex].id;
      
      // Prepare data for the next step
      if (currentStep === 'research' && nextStep === 'strategy') {
        // Pass keywords to content ideas component
        localStorage.setItem('selectedKeywordsForIdeas', JSON.stringify(workflowData.selectedKeywords));
      } else if (currentStep === 'strategy' && nextStep === 'create') {
        // Pass content idea to editor
        localStorage.setItem('contentIdeaData', JSON.stringify(workflowData.contentIdea));
      }
      
      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'research':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Step 1: Find Your Keywords</h4>
              <p className="text-blue-700 text-sm">
                Start by researching keywords relevant to your blog topic. Good SEO begins with understanding what your audience is searching for.
              </p>
            </div>
            <KeywordResearchForWorkflow
              onKeywordsSelected={(keywords: string[]) => {
                setWorkflowData(prev => ({ ...prev, selectedKeywords: keywords }));
                window.dispatchEvent(new CustomEvent('keywordsSelectedForPost', { 
                  detail: { keywords } 
                }));
              }}
              selectedKeywords={workflowData.selectedKeywords}
            />
          </div>
        );
      case 'strategy':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Step 2: Plan Your Content</h4>
              <p className="text-purple-700 text-sm">
                Based on your keywords, we'll generate content ideas, titles, and structural suggestions for your blog post.
              </p>
              {workflowData.selectedKeywords.length > 0 && (
                <div className="mt-3">
                  <span className="text-purple-700 text-sm font-medium">Target Keywords: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {workflowData.selectedKeywords.slice(0, 5).map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                        {keyword}
                      </Badge>
                    ))}
                    {workflowData.selectedKeywords.length > 5 && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        +{workflowData.selectedKeywords.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            <ContentIdeasForWorkflow
              keywords={workflowData.selectedKeywords}
              onIdeaSelected={(idea: any) => {
                setWorkflowData(prev => ({ ...prev, contentIdea: idea, title: idea.title }));
                window.dispatchEvent(new CustomEvent('contentIdeaSelected', { 
                  detail: { idea } 
                }));
              }}
              selectedIdea={workflowData.contentIdea}
            />
          </div>
        );
      case 'create':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Step 3: Create Your Content</h4>
              <p className="text-green-700 text-sm">
                Now it's time to write! Use our AI-powered editor to create high-quality content based on your research and strategy.
              </p>
              {workflowData.title && (
                <div className="mt-3">
                  <span className="text-green-700 text-sm font-medium">Blog Post Title: </span>
                  <span className="text-green-800 font-medium">{workflowData.title}</span>
                </div>
              )}
            </div>
            <ContentEditor />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Progress Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Post</h2>
            <p className="text-gray-600">Follow the research-driven workflow to create high-quality content</p>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            Step {currentStepIndex + 1} of {steps.length}
          </Badge>
        </div>

        <div className="space-y-4">
          <Progress value={progress} className="w-full" />
          
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = completedSteps.includes(step.id);
              const isPast = index < currentStepIndex;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 ${
                    isActive ? 'text-blue-600' : 
                    isCompleted || isPast ? 'text-green-600' : 
                    'text-gray-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-blue-100' :
                    isCompleted || isPast ? 'bg-green-100' :
                    'bg-gray-100'
                  }`}>
                    {isCompleted || isPast ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs opacity-75">{step.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <div className="p-6">
            {renderStepContent()}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Target className="w-4 h-4" />
          Research-driven workflow ensures better SEO results
        </div>
        
        <Button
          onClick={handleNext}
          disabled={!canProceedToNext() || currentStepIndex === steps.length - 1}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Specialized wrapper for KeywordSearch component in the workflow
function KeywordResearchForWorkflow({ 
  onKeywordsSelected, 
  selectedKeywords 
}: { 
  onKeywordsSelected: (keywords: string[]) => void;
  selectedKeywords: string[];
}) {
  return (
    <div>
      <KeywordSearch />
      {selectedKeywords.length > 0 && (
        <Card className="mt-4 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-green-900">
                  {selectedKeywords.length} Keywords Selected
                </div>
                <div className="text-sm text-green-700">
                  Ready to move to content strategy
                </div>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Specialized wrapper for ContentIdeas component in the workflow  
function ContentIdeasForWorkflow({ 
  keywords, 
  onIdeaSelected,
  selectedIdea
}: { 
  keywords: string[];
  onIdeaSelected: (idea: any) => void;
  selectedIdea?: any;
}) {
  if (keywords.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6 text-center">
          <Lightbulb className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="font-medium text-yellow-900 mb-2">Keywords Required</h3>
          <p className="text-yellow-700 text-sm">
            Please go back to the keyword research step and select keywords first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <ContentIdeas />
      {selectedIdea && (
        <Card className="mt-4 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-green-900">
                  Content Strategy Selected
                </div>
                <div className="text-sm text-green-700">
                  "{selectedIdea.title || 'Content idea'}" - Ready to create content
                </div>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

