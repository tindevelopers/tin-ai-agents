/**
 * Platform Adapter Registry
 * Manages registration and instantiation of platform adapters
 */

import { PlatformAdapter } from '../types/platform-adapters';
import { WordPressAdapter } from '../adapters/wordpress-adapter';
import { MediumAdapter } from '../adapters/medium-adapter';

// Registry of available platform adapters
const PLATFORM_ADAPTERS = new Map<string, new () => PlatformAdapter>();

// Register built-in adapters
PLATFORM_ADAPTERS.set('wordpress', WordPressAdapter);
PLATFORM_ADAPTERS.set('medium', MediumAdapter);

// Future adapters can be registered here:
// PLATFORM_ADAPTERS.set('webflow', WebflowAdapter);
// PLATFORM_ADAPTERS.set('shopify', ShopifyAdapter);
// PLATFORM_ADAPTERS.set('blogger', BloggerAdapter);
// PLATFORM_ADAPTERS.set('ghost', GhostAdapter);
// PLATFORM_ADAPTERS.set('linkedin', LinkedInAdapter);

export class PlatformAdapterRegistry {
  
  /**
   * Get list of all available platform names
   */
  static getAvailablePlatforms(): string[] {
    return Array.from(PLATFORM_ADAPTERS.keys());
  }

  /**
   * Check if a platform adapter is available
   */
  static isPlatformSupported(platform: string): boolean {
    return PLATFORM_ADAPTERS.has(platform.toLowerCase());
  }

  /**
   * Get a platform adapter instance
   */
  static getAdapter(platform: string): PlatformAdapter {
    const platformKey = platform.toLowerCase();
    const AdapterClass = PLATFORM_ADAPTERS.get(platformKey);
    
    if (!AdapterClass) {
      throw new Error(`Platform adapter not found: ${platform}. Available platforms: ${this.getAvailablePlatforms().join(', ')}`);
    }

    return new AdapterClass();
  }

  /**
   * Register a new platform adapter
   */
  static registerAdapter(platform: string, adapterClass: new () => PlatformAdapter): void {
    const platformKey = platform.toLowerCase();
    
    if (PLATFORM_ADAPTERS.has(platformKey)) {
      console.warn(`Platform adapter for ${platform} already exists and will be overwritten`);
    }

    PLATFORM_ADAPTERS.set(platformKey, adapterClass);
    console.log(`Registered platform adapter: ${platform}`);
  }

  /**
   * Get platform capabilities without instantiating adapter
   */
  static getPlatformCapabilities(platform: string) {
    const adapter = this.getAdapter(platform);
    return adapter.capabilities;
  }

  /**
   * Get all platform capabilities
   */
  static getAllPlatformCapabilities() {
    const capabilities = new Map();
    
    for (const platform of this.getAvailablePlatforms()) {
      try {
        capabilities.set(platform, this.getPlatformCapabilities(platform));
      } catch (error) {
        console.error(`Error getting capabilities for ${platform}:`, error);
      }
    }

    return capabilities;
  }

  /**
   * Find platforms that support specific features
   */
  static findPlatformsWithFeature(feature: keyof import('../types/universal-content').PlatformCapabilities): string[] {
    const supportedPlatforms: string[] = [];

    for (const platform of this.getAvailablePlatforms()) {
      try {
        const capabilities = this.getPlatformCapabilities(platform);
        if (capabilities[feature]) {
          supportedPlatforms.push(platform);
        }
      } catch (error) {
        console.error(`Error checking feature ${feature} for ${platform}:`, error);
      }
    }

    return supportedPlatforms;
  }

  /**
   * Validate that required platforms are available
   */
  static validatePlatforms(platforms: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    platforms.forEach(platform => {
      if (this.isPlatformSupported(platform)) {
        valid.push(platform);
      } else {
        invalid.push(platform);
      }
    });

    return { valid, invalid };
  }

  /**
   * Get recommended platforms based on content requirements
   */
  static getRecommendedPlatforms(requirements: {
    needsInternalLinks?: boolean;
    needsCustomSlugs?: boolean;
    needsImageGalleries?: boolean;
    needsScheduling?: boolean;
    maxContentLength?: number;
    needsSEOControl?: boolean;
  }): string[] {
    const recommended: string[] = [];

    for (const platform of this.getAvailablePlatforms()) {
      try {
        const capabilities = this.getPlatformCapabilities(platform);
        let score = 0;

        // Check requirements
        if (requirements.needsInternalLinks && capabilities.supportsInternalLinks) score += 2;
        if (requirements.needsCustomSlugs && capabilities.supportsCustomSlugs) score += 1;
        if (requirements.needsImageGalleries && capabilities.supportsImageGalleries) score += 1;
        if (requirements.needsScheduling && capabilities.supportsScheduling) score += 1;
        if (requirements.needsSEOControl && capabilities.supportsMetaDescription) score += 2;

        // Check content length compatibility
        if (requirements.maxContentLength && capabilities.maxContentLength) {
          if (capabilities.maxContentLength >= requirements.maxContentLength) {
            score += 1;
          } else {
            score -= 2; // Penalize if content won't fit
          }
        }

        // Recommend platforms with good scores
        if (score >= 3) {
          recommended.push(platform);
        }
      } catch (error) {
        console.error(`Error evaluating ${platform}:`, error);
      }
    }

    // Sort by capabilities (more capable platforms first)
    return recommended.sort((a, b) => {
      const capA = this.getPlatformCapabilities(a);
      const capB = this.getPlatformCapabilities(b);
      
      // Simple scoring based on number of supported features
      const scoreA = Object.values(capA).filter(v => v === true).length;
      const scoreB = Object.values(capB).filter(v => v === true).length;
      
      return scoreB - scoreA;
    });
  }
}

/**
 * Platform Adapter Factory
 * Simplified factory for creating adapters
 */
export class PlatformAdapterFactory {
  
  /**
   * Create adapter instance with error handling
   */
  static create(platform: string): PlatformAdapter | null {
    try {
      return PlatformAdapterRegistry.getAdapter(platform);
    } catch (error) {
      console.error(`Failed to create adapter for platform ${platform}:`, error);
      return null;
    }
  }

  /**
   * Create multiple adapters
   */
  static createMultiple(platforms: string[]): Map<string, PlatformAdapter> {
    const adapters = new Map<string, PlatformAdapter>();

    platforms.forEach(platform => {
      const adapter = this.create(platform);
      if (adapter) {
        adapters.set(platform, adapter);
      }
    });

    return adapters;
  }

  /**
   * Create adapters with validation
   */
  static createWithValidation(platforms: string[]): {
    adapters: Map<string, PlatformAdapter>;
    errors: string[];
  } {
    const adapters = new Map<string, PlatformAdapter>();
    const errors: string[] = [];

    platforms.forEach(platform => {
      try {
        const adapter = PlatformAdapterRegistry.getAdapter(platform);
        adapters.set(platform, adapter);
      } catch (error) {
        errors.push(`Failed to create adapter for ${platform}: ${error}`);
      }
    });

    return { adapters, errors };
  }
}

/**
 * Utility functions for platform management
 */
export class PlatformUtils {
  
  /**
   * Compare platform capabilities
   */
  static comparePlatforms(platform1: string, platform2: string) {
    const cap1 = PlatformAdapterRegistry.getPlatformCapabilities(platform1);
    const cap2 = PlatformAdapterRegistry.getPlatformCapabilities(platform2);

    const comparison = {
      platform1: platform1,
      platform2: platform2,
      differences: [] as string[],
      advantages1: [] as string[],
      advantages2: [] as string[]
    };

    // Compare key features
    const features: (keyof import('../types/universal-content').PlatformCapabilities)[] = [
      'supportsInternalLinks',
      'supportsCustomSlugs',
      'supportsCategories',
      'supportsTags',
      'supportsFeaturedImages',
      'supportsImageGalleries',
      'supportsCustomFields',
      'supportsScheduling',
      'supportsDrafts',
      'supportsMetaDescription'
    ];

    features.forEach(feature => {
      if (cap1[feature] !== cap2[feature]) {
        comparison.differences.push(feature);
        
        if (cap1[feature] && !cap2[feature]) {
          comparison.advantages1.push(feature);
        } else if (!cap1[feature] && cap2[feature]) {
          comparison.advantages2.push(feature);
        }
      }
    });

    return comparison;
  }

  /**
   * Get platform compatibility matrix
   */
  static getCompatibilityMatrix() {
    const platforms = PlatformAdapterRegistry.getAvailablePlatforms();
    const matrix: Record<string, Record<string, boolean>> = {};

    platforms.forEach(platform => {
      matrix[platform] = {};
      const capabilities = PlatformAdapterRegistry.getPlatformCapabilities(platform);
      
      // For now, simple compatibility based on shared features
      platforms.forEach(otherPlatform => {
        if (platform === otherPlatform) {
          matrix[platform][otherPlatform] = true;
        } else {
          const otherCapabilities = PlatformAdapterRegistry.getPlatformCapabilities(otherPlatform);
          
          // Calculate compatibility score based on shared features
          const sharedFeatures = Object.keys(capabilities).filter(key => 
            capabilities[key as keyof typeof capabilities] === 
            otherCapabilities[key as keyof typeof otherCapabilities]
          );
          
          const totalFeatures = Object.keys(capabilities).length;
          const compatibilityScore = sharedFeatures.length / totalFeatures;
          
          matrix[platform][otherPlatform] = compatibilityScore > 0.7; // 70% compatibility threshold
        }
      });
    });

    return matrix;
  }

  /**
   * Get content adaptation complexity score
   */
  static getAdaptationComplexity(fromPlatform: string, toPlatform: string): number {
    const fromCap = PlatformAdapterRegistry.getPlatformCapabilities(fromPlatform);
    const toCap = PlatformAdapterRegistry.getPlatformCapabilities(toPlatform);

    let complexity = 0;

    // Internal links complexity
    if (fromCap.supportsInternalLinks && !toCap.supportsInternalLinks) {
      complexity += 3; // High complexity - need to convert or remove internal links
    }

    // Content format complexity
    if (fromCap.supportsMarkdownContent && !toCap.supportsMarkdownContent) {
      complexity += 2; // Medium complexity - need to convert markdown to HTML
    }

    if (!fromCap.supportsMarkdownContent && toCap.supportsMarkdownContent) {
      complexity += 2; // Medium complexity - need to convert HTML to markdown
    }

    // Image complexity
    if (fromCap.supportsImageGalleries && !toCap.supportsImageGalleries) {
      complexity += 2; // Medium complexity - need to flatten galleries
    }

    // Content length constraints
    if (fromCap.maxContentLength && toCap.maxContentLength) {
      if (!fromCap.maxContentLength && toCap.maxContentLength) {
        complexity += 1; // Low complexity - might need to truncate
      }
    }

    // SEO features
    if (fromCap.supportsMetaDescription && !toCap.supportsMetaDescription) {
      complexity += 1; // Low complexity - meta description will be ignored
    }

    return Math.min(complexity, 10); // Cap at 10
  }

  /**
   * Get best platform for specific use case
   */
  static getBestPlatformFor(useCase: 'seo' | 'engagement' | 'corporate' | 'personal' | 'ecommerce'): string[] {
    const platforms = PlatformAdapterRegistry.getAvailablePlatforms();
    const recommendations: { platform: string; score: number }[] = [];

    platforms.forEach(platform => {
      const capabilities = PlatformAdapterRegistry.getPlatformCapabilities(platform);
      let score = 0;

      switch (useCase) {
        case 'seo':
          if (capabilities.supportsMetaDescription) score += 3;
          if (capabilities.supportsCustomSlugs) score += 2;
          if (capabilities.supportsInternalLinks) score += 3;
          if (capabilities.supportsStructuredData) score += 2;
          break;

        case 'engagement':
          if (platform === 'medium') score += 4; // Medium is built for engagement
          if (capabilities.supportsTags) score += 2;
          if (capabilities.supportsFeaturedImages) score += 1;
          break;

        case 'corporate':
          if (capabilities.supportsCustomFields) score += 2;
          if (capabilities.supportsScheduling) score += 2;
          if (capabilities.supportsVersioning) score += 1;
          if (capabilities.supportsCollaborativeEditing) score += 1;
          break;

        case 'personal':
          if (platform === 'medium') score += 3; // Good for personal brands
          if (capabilities.supportsDrafts) score += 1;
          if (!capabilities.supportsCustomFields) score += 1; // Simpler is better
          break;

        case 'ecommerce':
          if (capabilities.supportsCustomFields) score += 3;
          if (capabilities.supportsImageGalleries) score += 2;
          if (capabilities.supportsStructuredData) score += 2;
          break;
      }

      recommendations.push({ platform, score });
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .map(r => r.platform);
  }
}
