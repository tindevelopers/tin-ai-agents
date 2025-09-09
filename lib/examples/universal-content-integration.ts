/**
 * Universal Content Integration Example
 * Demonstrates how to use the Universal Content system with multiple publishing platforms
 */

import { UniversalContentService } from '../services/universal-content.service';
import { PlatformAdapterRegistry, PlatformAdapterFactory } from '../services/platform-adapter-registry';
import { 
  UniversalContent, 
  ContentTransformationOptions,
  ValidationResult
} from '../types/universal-content';
import { 
  ProjectContext, 
  PublishingConfiguration,
  PublishingResult
} from '../types/platform-adapters';

// =============================================================================
// EXAMPLE USAGE CLASS
// =============================================================================

export class UniversalContentIntegrationExample {

  /**
   * Example 1: Convert existing BlogPost to Universal Content and analyze
   */
  static async exampleBasicConversion() {
    console.log('=== Example 1: Basic Content Conversion ===');

    // Simulate existing BlogPost from your database
    const existingBlogPost = {
      id: 'blog_123',
      title: 'The Ultimate Guide to Content Marketing Strategy',
      content: `# Introduction

Content marketing has become one of the most effective ways to reach your target audience in 2024. With the right strategy, you can build trust, generate leads, and grow your business.

## Why Content Marketing Works

Studies show that **content marketing costs 62% less** than traditional marketing while generating *3x more leads*. Here's why it's so effective:

- Builds trust and authority
- Provides value to your audience  
- Improves SEO rankings
- Generates qualified leads

### Getting Started

Before you create content, you need to understand your audience. Ask yourself:

1. Who are you trying to reach?
2. What problems do they have?
3. How can your content help solve those problems?

![Content Strategy Framework](https://example.com/images/content-strategy.jpg)

## Content Types That Work

Different types of content serve different purposes:

**Blog Posts**: Great for SEO and thought leadership
**Videos**: High engagement, perfect for social media
**Infographics**: Visual content that's easy to share
**Case Studies**: Proof of your expertise and results

For more information, check out our [complete guide](https://example.com/complete-guide) or visit our [services page](https://example.com/services).

## Conclusion

Content marketing isn't just about creating content—it's about creating the *right* content for your audience. Start with a clear strategy, focus on providing value, and the results will follow.

*Ready to get started? [Contact us today](https://example.com/contact) to learn how we can help you develop a winning content strategy.*`,
      keywords: '["content marketing", "digital marketing", "strategy", "lead generation", "SEO"]',
      status: 'published',
      slug: 'ultimate-guide-content-marketing-strategy',
      meta_description: 'Learn how to create a winning content marketing strategy that builds trust, generates leads, and grows your business. Complete guide with actionable tips.',
      featured_image: 'https://example.com/images/featured-content-marketing.jpg',
      author: 'Marketing Team',
      category: 'Marketing',
      tags: ['content-marketing', 'strategy', 'digital-marketing', 'lead-generation'],
      seo_title: 'Content Marketing Strategy Guide 2024 | Generate More Leads',
      excerpt: 'Discover the content marketing strategies that top companies use to generate 3x more leads while spending 62% less than traditional marketing.',
      published_at: new Date('2024-01-15'),
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-15')
    };

    try {
      // Convert to Universal Content
      const universalContent = UniversalContentService.fromBlogPost(existingBlogPost);
      console.log('✅ Successfully converted BlogPost to UniversalContent');
      console.log(`Title: ${universalContent.title}`);
      console.log(`Word Count: ${universalContent.content.split(/\s+/).length}`);
      console.log(`Keywords: ${universalContent.keywords.join(', ')}`);
      console.log(`Images: ${universalContent.bodyImages.length} body images`);
      console.log(`Internal Links: ${universalContent.internalLinkOpportunities.length}`);
      console.log(`External Links: ${universalContent.externalLinkTargets.length}`);

      // Analyze content quality
      const analysis = UniversalContentService.analyzeContent(universalContent);
      console.log('\n📊 Content Analysis:');
      console.log(`SEO Score: ${analysis.seoScore}/100`);
      console.log(`Readability Score: ${analysis.readabilityScore}/100`);
      console.log(`Reading Time: ${analysis.readingTime} minutes`);
      console.log(`Link Distribution: ${analysis.linkDistribution.totalLinks} total links`);

      // Validate content
      const validation = UniversalContentService.validateContent(universalContent);
      console.log('\n✅ Validation Results:');
      console.log(`Valid: ${validation.isValid}`);
      console.log(`Errors: ${validation.errors.length}`);
      console.log(`Warnings: ${validation.warnings.length}`);

      if (validation.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        validation.warnings.forEach(warning => {
          console.log(`- ${warning.field}: ${warning.message}`);
        });
      }

      return universalContent;

    } catch (error) {
      console.error('❌ Error in basic conversion:', error);
      throw error;
    }
  }

  /**
   * Example 2: Multi-platform publishing
   */
  static async exampleMultiPlatformPublishing(universalContent: UniversalContent) {
    console.log('\n=== Example 2: Multi-Platform Publishing ===');

    // Define project context
    const projectContext: ProjectContext = {
      projectId: 'project_123',
      projectName: 'Acme Digital Marketing',
      primaryWebsite: 'https://acme-digital.com',
      industry: 'Marketing',
      existingContent: {
        pillarPages: [
          {
            id: 'pillar_1',
            title: 'Complete Digital Marketing Guide',
            url: 'https://acme-digital.com/digital-marketing-guide',
            slug: 'digital-marketing-guide',
            keywords: ['digital marketing', 'online marketing'],
            contentType: 'pillar',
            linkPriority: 10
          }
        ],
        subArticles: [
          {
            id: 'article_1',
            title: 'SEO Best Practices',
            url: 'https://acme-digital.com/seo-best-practices',
            slug: 'seo-best-practices',
            keywords: ['SEO', 'search optimization'],
            contentType: 'support',
            linkPriority: 8
          }
        ],
        externalContent: [],
        linkableAssets: [
          {
            id: 'tool_1',
            title: 'Free SEO Audit Tool',
            url: 'https://acme-digital.com/seo-audit-tool',
            assetType: 'tool',
            linkValue: 9
          }
        ]
      },
      backlinkStrategy: {
        primaryTarget: 'https://acme-digital.com',
        linkingApproach: {
          strategy: 'moderate',
          internalLinkRatio: 0.7,
          externalLinkRatio: 0.3,
          corporateLinkRequirement: true,
          maxLinksPerArticle: 8
        },
        platformSpecificRules: [
          {
            platform: 'wordpress',
            allowInternalLinks: true,
            maxExternalLinks: 5,
            requiredLinks: ['https://acme-digital.com'],
            forbiddenLinks: [],
            linkAttributeRules: []
          },
          {
            platform: 'medium',
            allowInternalLinks: false,
            maxExternalLinks: 3,
            requiredLinks: ['https://acme-digital.com'],
            forbiddenLinks: ['medium.com'],
            linkAttributeRules: []
          }
        ],
        crossPlatformLinking: true,
        trackingParameters: {
          utmSource: 'blog',
          utmMedium: 'content',
          customParameters: {}
        }
      },
      contentStrategy: {
        contentGoals: [
          {
            type: 'awareness',
            priority: 1,
            targetMetrics: ['page_views', 'time_on_page'],
            measurementPeriod: 'monthly'
          }
        ],
        targetAudience: {
          demographics: {
            ageRange: '25-45',
            industry: ['marketing', 'small-business'],
            jobRoles: ['marketing-manager', 'business-owner'],
            experienceLevel: 'intermediate'
          },
          interests: ['digital marketing', 'content strategy', 'lead generation'],
          painPoints: ['low website traffic', 'poor conversion rates', 'limited marketing budget'],
          contentPreferences: [
            {
              format: 'long',
              style: 'educational',
              mediaTypes: ['text', 'images']
            }
          ],
          platforms: ['wordpress', 'medium', 'linkedin']
        },
        contentPillars: [
          {
            id: 'pillar_1',
            name: 'Content Marketing',
            description: 'Strategies and tactics for effective content marketing',
            keywords: ['content marketing', 'content strategy', 'content creation'],
            targetPages: 12,
            priority: 1,
            contentTypes: [
              {
                type: 'pillar',
                count: 2,
                averageWordCount: 3000,
                linkingStrategy: 'heavy'
              },
              {
                type: 'support',
                count: 10,
                averageWordCount: 1500,
                linkingStrategy: 'moderate'
              }
            ]
          }
        ],
        distributionStrategy: {
          platforms: [
            {
              platform: 'wordpress',
              contentTypes: ['pillar', 'support'],
              publishingFrequency: 'weekly',
              adaptationLevel: 'minimal',
              customization: {
                titleFormat: 'SEO-optimized',
                contentStructure: 'detailed',
                callToActionStyle: 'subtle',
                linkingApproach: 'heavy',
                imageStyle: 'professional'
              }
            },
            {
              platform: 'medium',
              contentTypes: ['support'],
              publishingFrequency: 'bi-weekly',
              adaptationLevel: 'moderate',
              customization: {
                titleFormat: 'engaging',
                contentStructure: 'conversational',
                callToActionStyle: 'medium-style',
                linkingApproach: 'minimal',
                imageStyle: 'engaging'
              }
            }
          ],
          publishingSchedule: {
            frequency: 'weekly',
            daysOfWeek: ['Tuesday', 'Thursday'],
            timeOfDay: '10:00 AM',
            timezone: 'EST'
          },
          crossPromotionRules: [
            {
              sourcePlatform: 'wordpress',
              targetPlatforms: ['medium'],
              promotionType: 'reference',
              delay: 7
            }
          ],
          contentSyndication: true
        },
        performanceMetrics: [
          {
            name: 'organic_traffic',
            type: 'traffic',
            target: 1000,
            measurement: 'monthly_sessions',
            reportingFrequency: 'monthly'
          }
        ]
      }
    };

    // Publishing configurations for different platforms
    const publishingConfigs = {
      wordpress: {
        platform: 'wordpress',
        credentials: {
          type: 'api_key' as const,
          credentials: {
            site_url: 'https://acme-digital.com',
            api_key: 'wp_api_key_123',
            username: 'content_manager'
          }
        },
        settings: {
          status: 'published' as const,
          author: 'Marketing Team',
          category: 'Content Marketing',
          visibility: 'public' as const,
          allowComments: true,
          featured: false
        },
        workflow: {
          requiresReview: false,
          autoPublish: true,
          schedulingEnabled: true,
          versionControl: true,
          backupEnabled: true,
          rollbackEnabled: true
        }
      },
      medium: {
        platform: 'medium',
        credentials: {
          type: 'token' as const,
          credentials: {
            access_token: 'medium_token_123',
            username: 'acme_digital'
          }
        },
        settings: {
          status: 'published' as const,
          author: 'Marketing Team',
          visibility: 'public' as const,
          allowComments: true,
          featured: false
        },
        workflow: {
          requiresReview: false,
          autoPublish: true,
          schedulingEnabled: false,
          versionControl: false,
          backupEnabled: true,
          rollbackEnabled: false
        }
      }
    };

    // Publish to multiple platforms
    const publishingResults: Record<string, PublishingResult> = {};
    const targetPlatforms = ['wordpress', 'medium'];

    for (const platform of targetPlatforms) {
      try {
        console.log(`\n📤 Publishing to ${platform}...`);

        // Get platform adapter
        const adapter = PlatformAdapterFactory.create(platform);
        if (!adapter) {
          console.error(`❌ Failed to create adapter for ${platform}`);
          continue;
        }

        // Generate platform-specific backlink strategy
        const linkStrategy = await adapter.generateBacklinks(universalContent, projectContext);
        console.log(`🔗 Generated ${linkStrategy.internalLinks.length} internal links, ${linkStrategy.externalLinks.length} external links`);

        // Validate content for platform
        const validation = await adapter.validate(universalContent);
        console.log(`✅ Validation: ${validation.isValid} (Score: ${validation.score}/100)`);

        if (!validation.isValid) {
          console.log('⚠️ Validation errors:');
          validation.errors.forEach(error => {
            console.log(`  - ${error.field}: ${error.message}`);
          });
        }

        // Transform content for platform
        const transformationOptions: ContentTransformationOptions = {
          targetPlatform: platform,
          preserveFormatting: true,
          optimizeImages: true,
          adaptLinks: true,
          customizations: {
            canonicalUrl: projectContext.primaryWebsite + '/' + universalContent.slug
          }
        };

        const transformationResult = await adapter.transform(universalContent, transformationOptions);
        
        if (!transformationResult.success) {
          console.error(`❌ Transformation failed for ${platform}:`, transformationResult.errors);
          continue;
        }

        console.log(`🔄 Content transformed for ${platform}`);
        console.log(`  - Original: ${transformationResult.metadata.originalWordCount} words`);
        console.log(`  - Transformed: ${transformationResult.metadata.transformedWordCount} words`);
        console.log(`  - Links processed: ${transformationResult.metadata.linksProcessed}`);
        console.log(`  - Images processed: ${transformationResult.metadata.imagesProcessed}`);

        // Publish to platform
        const publishingConfig = publishingConfigs[platform as keyof typeof publishingConfigs];
        const publishingResult = await adapter.publish(
          transformationResult.transformedContent,
          publishingConfig
        );

        publishingResults[platform] = publishingResult;

        if (publishingResult.success) {
          console.log(`✅ Successfully published to ${platform}`);
          console.log(`  - Content ID: ${publishingResult.contentId}`);
          console.log(`  - Published URL: ${publishingResult.publishedUrl}`);
          console.log(`  - Processing time: ${publishingResult.metadata?.processingTime}ms`);
        } else {
          console.error(`❌ Publishing failed for ${platform}:`, publishingResult.errors);
        }

      } catch (error) {
        console.error(`❌ Error publishing to ${platform}:`, error);
      }
    }

    return publishingResults;
  }

  /**
   * Example 3: Platform comparison and recommendation
   */
  static async examplePlatformComparison() {
    console.log('\n=== Example 3: Platform Comparison ===');

    // Get all available platforms
    const availablePlatforms = PlatformAdapterRegistry.getAvailablePlatforms();
    console.log(`📋 Available platforms: ${availablePlatforms.join(', ')}`);

    // Get platform capabilities
    console.log('\n🔍 Platform Capabilities:');
    availablePlatforms.forEach(platform => {
      const capabilities = PlatformAdapterRegistry.getPlatformCapabilities(platform);
      console.log(`\n${platform.toUpperCase()}:`);
      console.log(`  - Internal Links: ${capabilities.supportsInternalLinks}`);
      console.log(`  - Custom Slugs: ${capabilities.supportsCustomSlugs}`);
      console.log(`  - Image Galleries: ${capabilities.supportsImageGalleries}`);
      console.log(`  - Scheduling: ${capabilities.supportsScheduling}`);
      console.log(`  - Max Title Length: ${capabilities.maxTitleLength || 'unlimited'}`);
      console.log(`  - Max Tags: ${capabilities.maxTagsCount || 'unlimited'}`);
    });

    // Find platforms with specific features
    console.log('\n🔎 Platforms supporting internal links:');
    const internalLinkPlatforms = PlatformAdapterRegistry.findPlatformsWithFeature('supportsInternalLinks');
    console.log(`  ${internalLinkPlatforms.join(', ')}`);

    console.log('\n🔎 Platforms supporting scheduling:');
    const schedulingPlatforms = PlatformAdapterRegistry.findPlatformsWithFeature('supportsScheduling');
    console.log(`  ${schedulingPlatforms.join(', ')}`);

    // Get recommendations for different use cases
    console.log('\n🎯 Platform Recommendations:');
    
    const seoRecommendations = PlatformAdapterRegistry.getRecommendedPlatforms({
      needsInternalLinks: true,
      needsCustomSlugs: true,
      needsSEOControl: true
    });
    console.log(`  For SEO: ${seoRecommendations.join(', ')}`);

    const engagementRecommendations = PlatformAdapterRegistry.getRecommendedPlatforms({
      needsImageGalleries: true,
      maxContentLength: 2000
    });
    console.log(`  For Engagement: ${engagementRecommendations.join(', ')}`);

    // Compare specific platforms
    if (availablePlatforms.includes('wordpress') && availablePlatforms.includes('medium')) {
      const comparison = PlatformUtils.comparePlatforms('wordpress', 'medium');
      console.log('\n⚖️ WordPress vs Medium:');
      console.log(`  WordPress advantages: ${comparison.advantages1.join(', ')}`);
      console.log(`  Medium advantages: ${comparison.advantages2.join(', ')}`);
      console.log(`  Key differences: ${comparison.differences.join(', ')}`);
    }
  }

  /**
   * Example 4: Content adaptation complexity analysis
   */
  static async exampleAdaptationComplexity() {
    console.log('\n=== Example 4: Content Adaptation Analysis ===');

    const platforms = PlatformAdapterRegistry.getAvailablePlatforms();
    
    console.log('🔧 Adaptation Complexity Matrix:');
    console.log('(Scale: 0=Easy, 10=Very Complex)\n');

    // Create a matrix showing adaptation complexity between platforms
    platforms.forEach(fromPlatform => {
      console.log(`FROM ${fromPlatform.toUpperCase()}:`);
      platforms.forEach(toPlatform => {
        if (fromPlatform !== toPlatform) {
          const complexity = PlatformUtils.getAdaptationComplexity(fromPlatform, toPlatform);
          const complexityLabel = complexity <= 3 ? 'Easy' : 
                                 complexity <= 6 ? 'Medium' : 'Complex';
          console.log(`  → ${toPlatform}: ${complexity}/10 (${complexityLabel})`);
        }
      });
      console.log('');
    });
  }

  /**
   * Run all examples
   */
  static async runAllExamples() {
    try {
      console.log('🚀 Starting Universal Content Integration Examples\n');

      // Example 1: Basic conversion
      const universalContent = await this.exampleBasicConversion();

      // Example 2: Multi-platform publishing
      await this.exampleMultiPlatformPublishing(universalContent);

      // Example 3: Platform comparison
      await this.examplePlatformComparison();

      // Example 4: Adaptation complexity
      await this.exampleAdaptationComplexity();

      console.log('\n✨ All examples completed successfully!');

    } catch (error) {
      console.error('❌ Error running examples:', error);
      throw error;
    }
  }
}

// Import PlatformUtils (this would normally be in the registry file)
class PlatformUtils {
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
    const features: (keyof typeof cap1)[] = [
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

  static getAdaptationComplexity(fromPlatform: string, toPlatform: string): number {
    const fromCap = PlatformAdapterRegistry.getPlatformCapabilities(fromPlatform);
    const toCap = PlatformAdapterRegistry.getPlatformCapabilities(toPlatform);

    let complexity = 0;

    // Internal links complexity
    if (fromCap.supportsInternalLinks && !toCap.supportsInternalLinks) {
      complexity += 3;
    }

    // Content format complexity
    if (fromCap.supportsMarkdownContent && !toCap.supportsMarkdownContent) {
      complexity += 2;
    }

    if (!fromCap.supportsMarkdownContent && toCap.supportsMarkdownContent) {
      complexity += 2;
    }

    // Image complexity
    if (fromCap.supportsImageGalleries && !toCap.supportsImageGalleries) {
      complexity += 2;
    }

    // Content length constraints
    if (fromCap.maxContentLength && toCap.maxContentLength) {
      if (!fromCap.maxContentLength && toCap.maxContentLength) {
        complexity += 1;
      }
    }

    // SEO features
    if (fromCap.supportsMetaDescription && !toCap.supportsMetaDescription) {
      complexity += 1;
    }

    return Math.min(complexity, 10);
  }
}

// =============================================================================
// EXPORT FOR EASY TESTING
// =============================================================================

export { PlatformUtils };

// Example usage (for testing):
// npm run example:universal-content
if (require.main === module) {
  UniversalContentIntegrationExample.runAllExamples()
    .then(() => {
      console.log('Examples completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Examples failed:', error);
      process.exit(1);
    });
}
