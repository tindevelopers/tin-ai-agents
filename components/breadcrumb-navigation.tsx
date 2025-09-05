
'use client';

import { ChevronRight, Home, PenTool, FileText, Sparkles, Plus, CheckCircle, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function BreadcrumbNavigation({ items, className = '' }: BreadcrumbNavigationProps) {
  if (items.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-2">
            {item.onClick ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={item.onClick}
                className={`h-auto p-1 text-sm font-medium transition-colors ${
                  item.isActive 
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 mr-1" />}
                {item.label}
              </Button>
            ) : (
              <span className={`flex items-center gap-1 font-medium ${
                item.isActive ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </span>
            )}
            
            {!isLast && (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Helper hook to manage breadcrumb state across the app
export function useBreadcrumb() {
  const buildBreadcrumb = (
    currentTab: string,
    editingPostTitle?: string,
    onNavigateHome?: () => void,
    onNavigateToPosts?: () => void
  ): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        icon: Home,
        onClick: onNavigateHome,
      }
    ];

    // Add tab-specific breadcrumb for new navigation structure
    switch (currentTab) {
      case 'dashboard':
        items[0].isActive = true;
        break;
        
      case 'create-post':
        if (editingPostTitle) {
          items.push({
            label: 'My Posts',
            icon: FileText,
            onClick: onNavigateToPosts,
          });
          items.push({
            label: `Editing: "${editingPostTitle}"`,
            icon: PenTool,
            isActive: true,
          });
        } else {
          items.push({
            label: 'Create Post',
            icon: Plus,
            isActive: true,
          });
        }
        break;
        
      case 'my-posts':
        items.push({
          label: 'My Posts',
          icon: FileText,
          isActive: true,
        });
        break;
        
      case 'published':
        items.push({
          label: 'Published',
          icon: CheckCircle,
          isActive: true,
        });
        break;
        
      case 'drafts':
        items.push({
          label: 'Drafts',
          icon: Edit3,
          isActive: true,
        });
        break;
    }

    return items;
  };

  return { buildBreadcrumb };
}
