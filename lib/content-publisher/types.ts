// Content Publisher Types - Compatible with AI Content Publisher SDK

export interface AIContent {
  type: 'blog' | 'faq' | 'article' | 'product-description' | 'landing-page' | 'social-post' | 'social-story';
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  categories?: string[];
  status?: 'draft' | 'published' | 'scheduled';
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  images?: ContentImage[];
  publishDate?: Date;
  
  // Type-specific fields
  faqs?: FAQItem[];
  specifications?: ProductSpecification[];
  ctaText?: string;
  ctaUrl?: string;
  
  // Social media specific
  socialPlatforms?: string[];
  socialContent?: Record<string, string>;
  hashtags?: string[];
  mentions?: string[];
}

export interface ContentImage {
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface FAQItem {
  question: string;
  answer: string;
  order: number;
}

export interface ProductSpecification {
  name: string;
  value: string;
  unit?: string;
}

export interface PublishResult {
  success: boolean;
  message: string;
  contentId?: string;
  url?: string;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code?: string;
}

export interface PlatformConfig {
  platform: string;
  credentials: Record<string, any>;
  settings?: Record<string, any>;
}

export interface ContentTestResult {
  platform: string;
  isCompatible: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface ScheduleConfig {
  platforms: string[];
  frequency: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    time: string;
    timezone?: string;
    days?: string[];
  };
  autoTest: boolean;
  retryFailed: boolean;
}

export interface BulkPublishConfig {
  platforms: string[];
  concurrency: number;
  autoTest: boolean;
  retryFailed: boolean;
  stopOnError?: boolean;
}

export interface ContentManagerConfig {
  publisher: any;
  scheduleConfig?: ScheduleConfig;
  autoTest?: boolean;
  autoOptimize?: boolean;
}

// Platform-specific types
export interface WebflowConfig {
  apiKey: string;
  siteId: string;
  collectionId?: string;
}

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  password: string;
  defaultCategory?: string;
  defaultAuthor?: number;
}

export interface SocialMediaConfig {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'tumblr';
  credentials: {
    accessToken?: string;
    apiKey?: string;
    apiSecret?: string;
    userId?: string;
    [key: string]: any;
  };
}
