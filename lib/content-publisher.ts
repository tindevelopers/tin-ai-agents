import axios, { AxiosResponse } from 'axios';

// Types based on the AI Content Publisher SDK documentation
export interface AIContent {
  type: 'blog' | 'faq' | 'article' | 'product-description' | 'landing-page';
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
}

export interface ContentImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  order: number;
}

export interface ProductSpecification {
  name: string;
  value: string;
  order?: number;
}

export interface PublishResult {
  success: boolean;
  message: string;
  contentId?: string;
  url?: string;
  errors?: string[];
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
  }>;
}

export interface BatchPublishOptions {
  concurrency?: number;
  stopOnError?: boolean;
}

export interface WebflowConfig {
  apiKey: string;
  siteId: string;
  defaultCollectionId?: string;
}

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  password: string;
  defaultCategory?: string;
  defaultAuthor?: number;
}

export interface PublisherConfig {
  webflow?: WebflowConfig;
  wordpress?: WordPressConfig;
  retryConfig?: {
    maxRetries: number;
    backoffMs: number;
  };
  timeout?: number;
}

export class AIContentPublisher {
  private webflowConfig?: WebflowConfig;
  private wordpressConfig?: WordPressConfig;
  private retryConfig = { maxRetries: 3, backoffMs: 1000 };
  private timeout = 30000;

  constructor(config?: PublisherConfig) {
    if (config) {
      this.webflowConfig = config.webflow;
      this.wordpressConfig = config.wordpress;
      this.retryConfig = config.retryConfig || this.retryConfig;
      this.timeout = config.timeout || this.timeout;
    }
  }

  /**
   * Configure Webflow publishing
   */
  async configureWebflow(apiKey: string, siteId: string, defaultCollectionId?: string): Promise<void> {
    this.webflowConfig = {
      apiKey,
      siteId,
      defaultCollectionId
    };

    // Test the connection
    try {
      await this.testWebflowConnection();
    } catch (error) {
      throw new Error(`Failed to configure Webflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Configure WordPress publishing
   */
  async configureWordPress(siteUrl: string, username: string, password: string, options?: { defaultCategory?: string; defaultAuthor?: number }): Promise<void> {
    this.wordpressConfig = {
      siteUrl,
      username,
      password,
      defaultCategory: options?.defaultCategory,
      defaultAuthor: options?.defaultAuthor
    };

    // Test the connection
    try {
      await this.testWordPressConnection();
    } catch (error) {
      throw new Error(`Failed to configure WordPress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test Webflow connection
   */
  private async testWebflowConnection(): Promise<boolean> {
    if (!this.webflowConfig) {
      throw new Error('Webflow not configured');
    }

    try {
      const response = await axios.get(`https://api.webflow.com/sites/${this.webflowConfig.siteId}`, {
        headers: {
          'Authorization': `Bearer ${this.webflowConfig.apiKey}`,
          'Accept-Version': '1.0.0'
        },
        timeout: this.timeout
      });

      return response.status === 200;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Webflow API error: ${error.response?.data?.msg || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Test WordPress connection
   */
  private async testWordPressConnection(): Promise<boolean> {
    if (!this.wordpressConfig) {
      throw new Error('WordPress not configured');
    }

    try {
      const auth = Buffer.from(`${this.wordpressConfig.username}:${this.wordpressConfig.password}`).toString('base64');
      const response = await axios.get(`${this.wordpressConfig.siteUrl}/wp-json/wp/v2/posts?per_page=1`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });

      return response.status === 200;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`WordPress API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate content before publishing
   */
  validateContent(content: AIContent): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];
    const warnings: Array<{ field: string; message: string }> = [];

    // Required fields
    if (!content.title || content.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required' });
    }

    if (!content.content || content.content.trim().length === 0) {
      errors.push({ field: 'content', message: 'Content is required' });
    }

    if (!content.type) {
      errors.push({ field: 'type', message: 'Content type is required' });
    }

    // Warnings
    if (!content.excerpt) {
      warnings.push({ field: 'excerpt', message: 'Excerpt is recommended for better SEO' });
    }

    if (!content.tags || content.tags.length === 0) {
      warnings.push({ field: 'tags', message: 'Tags are recommended for better discoverability' });
    }

    if (!content.seo?.metaDescription) {
      warnings.push({ field: 'seo.metaDescription', message: 'Meta description is recommended for SEO' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Publish content to a specific platform
   */
  async publish(content: AIContent, platform: 'webflow' | 'wordpress'): Promise<PublishResult> {
    // Validate content first
    const validation = this.validateContent(content);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Content validation failed',
        errors: validation.errors.map(e => `${e.field}: ${e.message}`)
      };
    }

    try {
      if (platform === 'webflow') {
        return await this.publishToWebflow(content);
      } else if (platform === 'wordpress') {
        return await this.publishToWordPress(content);
      } else {
        return {
          success: false,
          message: 'Unsupported platform',
          errors: [`Platform '${platform}' is not supported`]
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Publishing failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Publish to multiple platforms
   */
  async publishToMultiple(content: AIContent, platforms: Array<'webflow' | 'wordpress'>): Promise<{ [platform: string]: PublishResult }> {
    const results: { [platform: string]: PublishResult } = {};

    // Publish to all platforms in parallel
    const publishPromises = platforms.map(async (platform) => {
      const result = await this.publish(content, platform);
      results[platform] = result;
      return { platform, result };
    });

    await Promise.all(publishPromises);
    return results;
  }

  /**
   * Batch publish multiple content items
   */
  async batchPublish(
    contentItems: AIContent[],
    platform: 'webflow' | 'wordpress',
    options: BatchPublishOptions = {}
  ): Promise<PublishResult[]> {
    const { concurrency = 3, stopOnError = false } = options;
    const results: PublishResult[] = [];

    // Process in batches
    for (let i = 0; i < contentItems.length; i += concurrency) {
      const batch = contentItems.slice(i, i + concurrency);
      const batchPromises = batch.map(content => this.publish(content, platform));

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Check if any failed and stopOnError is true
        if (stopOnError && batchResults.some(result => !result.success)) {
          break;
        }
      } catch (error) {
        if (stopOnError) {
          throw error;
        }
        // Continue with next batch if stopOnError is false
        results.push({
          success: false,
          message: 'Batch failed',
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }

    return results;
  }

  /**
   * Publish to Webflow
   */
  private async publishToWebflow(content: AIContent): Promise<PublishResult> {
    if (!this.webflowConfig) {
      throw new Error('Webflow not configured');
    }

    try {
      // Convert our content to Webflow format
      const webflowData = this.convertToWebflowFormat(content);

      const response = await axios.post(
        `https://api.webflow.com/collections/${this.webflowConfig.defaultCollectionId}/items`,
        webflowData,
        {
          headers: {
            'Authorization': `Bearer ${this.webflowConfig.apiKey}`,
            'Accept-Version': '1.0.0',
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      return {
        success: true,
        message: 'Published to Webflow successfully',
        contentId: response.data._id,
        url: response.data.slug ? `https://${this.webflowConfig.siteId}.webflow.io/${response.data.slug}` : undefined
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Webflow API error: ${error.response?.data?.msg || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Publish to WordPress
   */
  private async publishToWordPress(content: AIContent): Promise<PublishResult> {
    if (!this.wordpressConfig) {
      throw new Error('WordPress not configured');
    }

    try {
      // Convert our content to WordPress format
      const wordpressData = this.convertToWordPressFormat(content);

      const auth = Buffer.from(`${this.wordpressConfig.username}:${this.wordpressConfig.password}`).toString('base64');
      const response = await axios.post(
        `${this.wordpressConfig.siteUrl}/wp-json/wp/v2/posts`,
        wordpressData,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      return {
        success: true,
        message: 'Published to WordPress successfully',
        contentId: response.data.id.toString(),
        url: response.data.link
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`WordPress API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Convert content to Webflow format
   */
  private convertToWebflowFormat(content: AIContent): any {
    return {
      fields: {
        name: content.title,
        'post-body': content.content,
        'post-summary': content.excerpt,
        slug: content.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        _archived: false,
        _draft: content.status === 'draft'
      }
    };
  }

  /**
   * Convert content to WordPress format
   */
  private convertToWordPressFormat(content: AIContent): any {
    return {
      title: content.title,
      content: content.content,
      excerpt: content.excerpt,
      status: content.status || 'draft',
      author: this.wordpressConfig?.defaultAuthor || 1,
      categories: content.categories || [this.wordpressConfig?.defaultCategory || 'Uncategorized'],
      tags: content.tags || [],
      meta: {
        _yoast_wpseo_title: content.seo?.metaTitle,
        _yoast_wpseo_metadesc: content.seo?.metaDescription,
        _yoast_wpseo_focuskw: content.seo?.keywords?.[0]
      }
    };
  }
}

// Helper function to create a publisher instance with environment variables
export function createPublisherFromEnv(): AIContentPublisher {
  const publisher = new AIContentPublisher();

  // Configure from environment variables
  if (process.env.WEBFLOW_API_KEY && process.env.WEBFLOW_SITE_ID) {
    publisher.configureWebflow(
      process.env.WEBFLOW_API_KEY,
      process.env.WEBFLOW_SITE_ID,
      process.env.WEBFLOW_COLLECTION_ID
    );
  }

  if (process.env.WORDPRESS_SITE_URL && process.env.WORDPRESS_USERNAME && process.env.WORDPRESS_PASSWORD) {
    publisher.configureWordPress(
      process.env.WORDPRESS_SITE_URL,
      process.env.WORDPRESS_USERNAME,
      process.env.WORDPRESS_PASSWORD,
      {
        defaultCategory: process.env.WORDPRESS_DEFAULT_CATEGORY,
        defaultAuthor: process.env.WORDPRESS_DEFAULT_AUTHOR ? parseInt(process.env.WORDPRESS_DEFAULT_AUTHOR) : undefined
      }
    );
  }

  return publisher;
}
