
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, Search, Lightbulb, PenTool, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamic imports for the workflow components
const KeywordSearch = dynamic(() => import('@/components/keyword-search'), { ssr: false });
const ContentIdeas = dynamic(() => import('@/components/content-ideas'), { ssr: false });
const ContentEditor = dynamic(() => import('@/components/content-editor'), { ssr: false });

interface NewPostModalProps {
  step: 'keywords' | 'strategy' | 'editor';
  onStepChange: (step: 'keywords' | 'strategy' | 'editor') => void;
  onClose: () => void;
}

const steps = [
  { id: 'keywords', label: 'Keywords & Topic', icon: Search, description: 'Find the perfect keywords for your content' },
  { id: 'strategy', label: 'Content Strategy', icon: Lightbulb, description: 'Generate ideas and plan your content' },
  { id: 'editor', label: 'Write & Publish', icon: PenTool, description: 'Create your blog post with AI assistance' },
];

export default function NewPostModal({ step, onStepChange, onClose }: NewPostModalProps) {
  const [canProceedToNext, setCanProceedToNext] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const currentStepIndex = steps.findIndex(s => s.id === step);
  const currentStep = steps[currentStepIndex];
  
  const canGoNext = currentStepIndex < steps.length - 1;
  const canGoPrev = currentStepIndex > 0;

  const handleNext = () => {
    if (canGoNext) {
      // Mark current step as completed
      setCompletedSteps(prev => [...prev, step]);
      const nextStep = steps[currentStepIndex + 1];
      onStepChange(nextStep.id as any);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      const prevStep = steps[currentStepIndex - 1];
      onStepChange(prevStep.id as any);
    }
  };

  const handleStepClick = (stepId: string) => {
    onStepChange(stepId as any);
  };

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);
  const isStepActive = (stepId: string) => stepId === step;

  const renderStepContent = () => {
    switch (step) {
      case 'keywords':
        return (
          <div className="h-full">
            <KeywordSearch />
          </div>
        );
      case 'strategy':
        return (
          <div className="h-full">
            <ContentIdeas />
          </div>
        );
      case 'editor':
        return (
          <div className="h-full">
            <ContentEditor />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Create New Blog Post</h1>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isCompleted = isStepCompleted(stepItem.id);
              const isActive = isStepActive(stepItem.id);
              
              return (
                <div key={stepItem.id} className="flex items-center flex-1">
                  <button
                    onClick={() => handleStepClick(stepItem.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all w-full text-left ${
                      isActive 
                        ? 'bg-blue-50 border-2 border-blue-200' 
                        : isCompleted
                        ? 'bg-green-50 border-2 border-green-200 hover:bg-green-100'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${
                        isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-600'
                      }`}>
                        {stepItem.label}
                      </p>
                      <p className={`text-xs ${
                        isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {stepItem.description}
                      </p>
                    </div>
                  </button>
                  
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-gray-400 mx-2 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Step {currentStepIndex + 1} of {steps.length}
              </Badge>
              <span className="text-sm text-gray-600">{currentStep.description}</span>
            </div>
            
            <div className="flex items-center gap-3">
              {canGoPrev && (
                <Button variant="outline" onClick={handlePrev}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              )}
              
              {canGoNext ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={onClose}>
                  Done
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
