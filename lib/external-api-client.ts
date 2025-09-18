// External API Client for AI Blog Writer Service
// Replaces the local SDK with calls to the external API

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types for the external API
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
  faqs?: FAQItem[];
  specifications?: ProductSpecification[];
  ctaText?: string;
  ctaUrl?: string;
  socialPlatforms?: string[];
  socialContent?: Record<string, string>;
  hashtags?: string[];
  mentions?: string[];
}

export interface ContentImage {
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ProductSpecification {
  name: string;
  value: string;
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
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface ContentTestResult {
  platform: string;
  success: boolean;
  message: string;
  issues?: string[];
  suggestions?: string[];
}

export interface WebflowConfig {
  apiKey: string;
  siteId: string;
  collectionId?: string;
}

export interface SocialMediaConfig {
  platform: string;
  credentials: Record<string, any>;
}

export interface PlatformConfig {
  platform: string;
  config: WebflowConfig | SocialMediaConfig;
  type: 'cms' | 'social';
}

export class ExternalAPIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'https://api-ai-blog-writer-dev-613248238610.europe-west1.run.app') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Content Publishing Methods
  async publishContent(content: AIContent, platforms: string[]): Promise<Record<string, PublishResult>> {
    try {
      const response: AxiosResponse<Record<string, PublishResult>> = await this.client.post('/publish', {
        content,
        platforms
      });
      return response.data;
    } catch (error) {
      console.error('Error publishing content:', error);
      throw new Error(`Failed to publish content: ${error}`);
    }
  }

  async publishToWebflow(content: AIContent, config: WebflowConfig): Promise<PublishResult> {
    try {
      const response: AxiosResponse<PublishResult> = await this.client.post('/publish/webflow', {
        content,
        config
      });
      return response.data;
    } catch (error) {
      console.error('Error publishing to Webflow:', error);
      throw new Error(`Failed to publish to Webflow: ${error}`);
    }
  }

  async publishToSocialMedia(content: AIContent, platform: string, config: SocialMediaConfig): Promise<PublishResult> {
    try {
      const response: AxiosResponse<PublishResult> = await this.client.post(`/publish/social/${platform}`, {
        content,
        config
      });
      return response.data;
    } catch (error) {
      console.error(`Error publishing to ${platform}:`, error);
      throw new Error(`Failed to publish to ${platform}: ${error}`);
    }
  }

  // Content Validation
  async validateContent(content: AIContent): Promise<ValidationResult> {
    try {
      const response: AxiosResponse<ValidationResult> = await this.client.post('/validate', {
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error validating content:', error);
      throw new Error(`Failed to validate content: ${error}`);
    }
  }

  // Content Testing
  async testContentForPlatform(content: AIContent, platform: string): Promise<ContentTestResult> {
    try {
      const response: AxiosResponse<ContentTestResult> = await this.client.post('/test', {
        content,
        platform
      });
      return response.data;
    } catch (error) {
      console.error(`Error testing content for ${platform}:`, error);
      throw new Error(`Failed to test content for ${platform}: ${error}`);
    }
  }

  // Platform Configuration
  async configureWebflow(apiKey: string, siteId: string, collectionId?: string): Promise<void> {
    try {
      await this.client.post('/configure/webflow', {
        apiKey,
        siteId,
        collectionId
      });
    } catch (error) {
      console.error('Error configuring Webflow:', error);
      throw new Error(`Failed to configure Webflow: ${error}`);
    }
  }

  async configureSocialMedia(platform: string, config: SocialMediaConfig): Promise<void> {
    try {
      await this.client.post(`/configure/social/${platform}`, {
        config
      });
    } catch (error) {
      console.error(`Error configuring ${platform}:`, error);
      throw new Error(`Failed to configure ${platform}: ${error}`);
    }
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response: AxiosResponse<{ status: string; timestamp: string }> = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error checking API health:', error);
      throw new Error(`API health check failed: ${error}`);
    }
  }

  // Get API Documentation
  async getDocumentation(): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.get('/docs');
      return response.data;
    } catch (error) {
      console.error('Error fetching API documentation:', error);
      throw new Error(`Failed to fetch API documentation: ${error}`);
    }
  }
}

// Create a singleton instance
export const externalAPIClient = new ExternalAPIClient();

