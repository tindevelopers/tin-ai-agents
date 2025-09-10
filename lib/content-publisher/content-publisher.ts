import { 
  AIContent, 
  PublishResult, 
  ValidationResult, 
  PlatformConfig,
  ContentTestResult,
  WebflowConfig,
  SocialMediaConfig 
} from './types';
import { WebflowPublisher } from './platforms/webflow-publisher';
import { SocialMediaPublisher } from './platforms/social-media-publisher';
import { ContentValidator } from './content-validator';
import { ContentTester } from './content-tester';

export class AIContentPublisher {
  private platforms: Map<string, any> = new Map();
  private validator: ContentValidator;
  private tester: ContentTester;

  constructor() {
    this.validator = new ContentValidator();
    this.tester = new ContentTester();
  }

  // Platform Configuration
  async configureWebflow(apiKey: string, siteId: string, collectionId?: string): Promise<void> {
    const config: WebflowConfig = { apiKey, siteId, collectionId };
    const publisher = new WebflowPublisher(config);
    this.platforms.set('webflow', publisher);
  }

  async configureSocialMedia(platform: string, config: SocialMediaConfig): Promise<void> {
    const publisher = new SocialMediaPublisher(platform, config);
    this.platforms.set(platform, publisher);
  }

  // Content Validation
  validateContent(content: AIContent): ValidationResult {
    return this.validator.validate(content);
  }

  // Content Testing
  async testContentForPlatform(content: AIContent, platform: string): Promise<ContentTestResult> {
    return this.tester.testForPlatform(content, platform);
  }

  async testContentForMultiplePlatforms(content: AIContent, platforms: string[]): Promise<ContentTestResult[]> {
    const results: ContentTestResult[] = [];
    
    for (const platform of platforms) {
      const result = await this.testContentForPlatform(content, platform);
      results.push(result);
    }
    
    return results;
  }

  getBestPlatformsForContent(content: AIContent, platforms: string[]): string[] {
    // This would analyze content and return best platforms
    // For now, return all platforms
    return platforms;
  }

  // Publishing Methods
  async publish(content: AIContent, platform: string): Promise<PublishResult> {
    try {
      // Validate content first
      const validation = this.validateContent(content);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Content validation failed',
          errors: validation.errors.map(e => e.message)
        };
      }

      // Get platform publisher
      const publisher = this.platforms.get(platform);
      if (!publisher) {
        return {
          success: false,
          message: `Platform '${platform}' not configured`,
          errors: [`No publisher found for platform: ${platform}`]
        };
      }

      // Test content compatibility (optional)
      const testResult = await this.testContentForPlatform(content, platform);
      if (!testResult.isCompatible) {
        return {
          success: false,
          message: 'Content not compatible with platform',
          errors: testResult.issues,
          warnings: testResult.suggestions
        };
      }

      // Publish content
      const result = await publisher.publish(content);
      return result;

    } catch (error) {
      return {
        success: false,
        message: 'Publishing failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async publishToMultiple(content: AIContent, platforms: string[]): Promise<Record<string, PublishResult>> {
    const results: Record<string, PublishResult> = {};
    
    // Publish to all platforms in parallel
    const publishPromises = platforms.map(async (platform) => {
      const result = await this.publish(content, platform);
      return { platform, result };
    });

    const publishResults = await Promise.allSettled(publishPromises);
    
    publishResults.forEach((promiseResult, index) => {
      const platform = platforms[index];
      
      if (promiseResult.status === 'fulfilled') {
        results[platform] = promiseResult.value.result;
      } else {
        results[platform] = {
          success: false,
          message: 'Publishing failed',
          errors: [promiseResult.reason?.message || 'Unknown error']
        };
      }
    });

    return results;
  }

  async batchPublish(
    contentItems: AIContent[], 
    platform: string, 
    options: { concurrency?: number; stopOnError?: boolean } = {}
  ): Promise<PublishResult[]> {
    const { concurrency = 3, stopOnError = false } = options;
    const results: PublishResult[] = [];
    
    // Process in batches
    for (let i = 0; i < contentItems.length; i += concurrency) {
      const batch = contentItems.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (content) => {
        return this.publish(content, platform);
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const promiseResult of batchResults) {
        if (promiseResult.status === 'fulfilled') {
          results.push(promiseResult.value);
          
          // Stop on error if configured
          if (stopOnError && !promiseResult.value.success) {
            return results;
          }
        } else {
          const errorResult: PublishResult = {
            success: false,
            message: 'Batch publishing failed',
            errors: [promiseResult.reason?.message || 'Unknown error']
          };
          results.push(errorResult);
          
          if (stopOnError) {
            return results;
          }
        }
      }
    }

    return results;
  }

  // Platform Management
  getPlatforms(): string[] {
    return Array.from(this.platforms.keys());
  }

  isPlatformConfigured(platform: string): boolean {
    return this.platforms.has(platform);
  }

  async testPlatformConnection(platform: string): Promise<PublishResult> {
    const publisher = this.platforms.get(platform);
    if (!publisher) {
      return {
        success: false,
        message: `Platform '${platform}' not configured`
      };
    }

    if (typeof publisher.testConnection === 'function') {
      return await publisher.testConnection();
    }

    return {
      success: true,
      message: `Platform '${platform}' is configured`
    };
  }
}
