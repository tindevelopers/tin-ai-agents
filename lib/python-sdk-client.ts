/**
 * Python SDK API Client
 * 
 * This client interfaces with the Python Blog Writer SDK deployed on Railway.
 * It provides type-safe methods for blog generation, SEO analysis, and content management.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Environment configuration
const PYTHON_SDK_URL = process.env.NEXT_PUBLIC_PYTHON_SDK_URL || 'https://sdk-ai-blog-writer-python-production.up.railway.app';

// Type definitions for the Python SDK
export interface BlogGenerationRequest {
  topic: string;
  keywords?: string[];
  tone?: 'professional' | 'casual' | 'instructional' | 'persuasive' | 'entertaining';
  length?: 'short' | 'medium' | 'long' | 'very_long';
  format?: 'markdown' | 'html';
  target_audience?: string;
  focus_keyword?: string;
  include_introduction?: boolean;
  include_conclusion?: boolean;
  include_faq?: boolean;
  include_toc?: boolean;
  word_count_target?: number;
  custom_instructions?: string;
  enable_ai_enhancement?: boolean;
  enable_seo_optimization?: boolean;
  enable_quality_analysis?: boolean;
}

export interface BlogPost {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  author: string;
  categories: string[];
  tags: string[];
  status: 'draft' | 'published';
  featured_image?: string;
  created_at: string;
  updated_at?: string;
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
}

export interface SEOMetrics {
  overall_seo_score: number;
  word_count: number;
  reading_time_minutes: number;
  keyword_density: Record<string, number>;
  recommendations: string[];
}

export interface ContentQuality {
  readability_score: number;
  flesch_reading_ease: number;
  flesch_kincaid_grade: number;
}

export interface BlogGenerationResult {
  success: boolean;
  blog_post: BlogPost;
  seo_metrics: SEOMetrics;
  content_quality: ContentQuality;
  generation_time: number;
  ai_enhanced: boolean;
  provider_used?: string;
}

export interface APIConfig {
  api_title: string;
  api_version: string;
  features: {
    ai_enhancement: boolean;
    seo_optimization: boolean;
    quality_analysis: boolean;
    dataforseo_integration: boolean;
  };
  ai_providers: {
    openai: boolean;
    anthropic: boolean;
    azure_openai: boolean;
  };
  default_settings: {
    tone: string;
    length: string;
    enable_seo_optimization: boolean;
    enable_quality_analysis: boolean;
  };
}

export interface AIHealthStatus {
  overall_status: 'healthy' | 'degraded' | 'down';
  providers: Record<string, {
    status: 'healthy' | 'degraded' | 'down';
    response_time?: number;
    last_check: string;
  }>;
}

export interface KeywordAnalysis {
  keyword: string;
  difficulty: number;
  search_volume: number;
  competition: string;
  cpc: number;
  suggestions: string[];
}

/**
 * Python SDK API Client Class
 */
export class PythonSDKClient {
  private client: AxiosInstance;

  constructor(baseURL: string = PYTHON_SDK_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 120000, // 2 minutes for blog generation
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Python SDK API Error:', error.response?.data || error.message);
        throw new Error(
          error.response?.data?.detail || 
          error.response?.data?.message || 
          error.message || 
          'Unknown API error'
        );
      }
    );
  }

  /**
   * Generate a blog post using the Python SDK
   */
  async generateBlogPost(request: BlogGenerationRequest): Promise<BlogGenerationResult> {
    try {
      const response: AxiosResponse<BlogGenerationResult> = await this.client.post(
        '/api/v1/blog/generate',
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Blog generation failed: ${error}`);
    }
  }

  /**
   * Get API configuration and feature status
   */
  async getConfig(): Promise<APIConfig> {
    try {
      const response: AxiosResponse<APIConfig> = await this.client.get('/api/v1/config');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch API config: ${error}`);
    }
  }

  /**
   * Check AI providers health status
   */
  async checkAIHealth(): Promise<AIHealthStatus> {
    try {
      const response: AxiosResponse<AIHealthStatus> = await this.client.get('/api/v1/ai/health');
      return response.data;
    } catch (error) {
      throw new Error(`AI health check failed: ${error}`);
    }
  }

  /**
   * Analyze keywords for SEO
   */
  async analyzeKeywords(keywords: string[]): Promise<KeywordAnalysis[]> {
    try {
      const response: AxiosResponse<{ keywords: KeywordAnalysis[] }> = await this.client.post(
        '/api/v1/keywords/analyze',
        { keywords }
      );
      return response.data.keywords;
    } catch (error) {
      throw new Error(`Keyword analysis failed: ${error}`);
    }
  }

  /**
   * Extract keywords from existing content
   */
  async extractKeywords(content: string): Promise<string[]> {
    try {
      const response: AxiosResponse<{ keywords: string[] }> = await this.client.post(
        '/api/v1/keywords/extract',
        { content }
      );
      return response.data.keywords;
    } catch (error) {
      throw new Error(`Keyword extraction failed: ${error}`);
    }
  }

  /**
   * Get keyword suggestions for a topic
   */
  async suggestKeywords(topic: string): Promise<string[]> {
    try {
      const response: AxiosResponse<{ keywords: string[] }> = await this.client.post(
        '/api/v1/keywords/suggest',
        { topic }
      );
      return response.data.keywords;
    } catch (error) {
      throw new Error(`Keyword suggestion failed: ${error}`);
    }
  }

  /**
   * Analyze existing content for SEO and quality
   */
  async analyzeContent(content: string): Promise<{
    seo_metrics: SEOMetrics;
    content_quality: ContentQuality;
  }> {
    try {
      const response = await this.client.post('/api/v1/analyze', { content });
      return response.data;
    } catch (error) {
      throw new Error(`Content analysis failed: ${error}`);
    }
  }

  /**
   * Optimize existing content for SEO
   */
  async optimizeContent(content: string, keywords?: string[]): Promise<{
    optimized_content: string;
    seo_metrics: SEOMetrics;
    changes_made: string[];
  }> {
    try {
      const response = await this.client.post('/api/v1/optimize', { 
        content,
        keywords 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Content optimization failed: ${error}`);
    }
  }

  /**
   * Health check for the API
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error}`);
    }
  }
}

// Create a singleton instance
export const pythonSDK = new PythonSDKClient();

// Export utility functions
export const convertToPythonSDKRequest = (blogPost: any): BlogGenerationRequest => {
  return {
    topic: blogPost.title || blogPost.topic,
    keywords: blogPost.keywords || [],
    tone: blogPost.tone || 'professional',
    length: blogPost.length || 'medium',
    target_audience: blogPost.target_audience,
    custom_instructions: blogPost.custom_instructions,
    enable_ai_enhancement: true,
    enable_seo_optimization: true,
    enable_quality_analysis: true,
  };
};

export const convertFromPythonSDKResult = (result: BlogGenerationResult): any => {
  return {
    id: Date.now().toString(), // Generate temporary ID
    title: result.blog_post.title,
    content: result.blog_post.content,
    keywords: result.blog_post.meta_keywords || [],
    status: 'ready_to_publish',
    createdAt: new Date(),
    updatedAt: new Date(),
    seo_score: result.seo_metrics.overall_seo_score,
    word_count: result.seo_metrics.word_count,
    reading_time: result.seo_metrics.reading_time_minutes,
    readability_score: result.content_quality.readability_score,
    meta_description: result.blog_post.meta_description,
    excerpt: result.blog_post.excerpt,
    slug: result.blog_post.slug,
    categories: result.blog_post.categories,
    tags: result.blog_post.tags,
  };
};
