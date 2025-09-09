/**
 * Medium Platform Adapter
 * Handles content transformation and publishing for Medium.com
 * Note: Medium has limited internal linking and different content structure
 */

import { BasePlatformAdapter } from './base-platform-adapter';
import {
  UniversalContent,
  PlatformContent,
  PlatformCapabilities,
  ContentTransformationOptions,
  ContentTransformationResult,
  AdaptedImage,
  AdaptedLink
} from '../types/universal-content';

import {
  ProjectContext,
  LinkStrategy,
  PublishingConfiguration,
  PublishingResult,
  PublishingStatus
} from '../types/platform-adapters';

export class MediumAdapter extends BasePlatformAdapter {
  readonly name = 'Medium';
  readonly version = '1.0.0';
  readonly capabilities: PlatformCapabilities = {
    name: 'Medium',
    supportsInternalLinks: false, // Medium doesn't support internal linking between posts
    supportsCustomSlugs: false, // Medium generates its own URLs
    supportsCategories: false, // Medium uses tags only
    supportsTags: true, // Up to 5 tags
    supportsFeaturedImages: true,
    supportsImageGalleries: false, // Limited image support
    supportsCustomFields: false,
    supportsHTMLContent: false, // Medium uses its own rich text format
    supportsMarkdownContent: true, // Medium supports Markdown import
    supportsRichTextEditor: true,
    
    // Content limitations (Medium has strict limits)
    maxTitleLength: 100,
    maxExcerptLength: 140, // Used for social sharing
    maxContentLength: undefined, // No strict word limit but has practical limits
    maxTagsCount: 5, // Medium allows max 5 tags
    maxImagesCount: 25, // Practical limit for readability
    
    // SEO capabilities (Limited on Medium)
    supportsMetaDescription: false, // Medium generates its own
    supportsCustomMetaTags: false,
    supportsStructuredData: false,
    supportsCanonicalUrls: true, // Can set canonical URL
    
    // Publishing features
    supportsScheduling: false, // Medium doesn't support scheduling
    supportsDrafts: true,
    supportsVersioning: false, // Medium doesn't track versions
    supportsCollaborativeEditing: false
  };

  // =============================================================================
  // CONTENT TRANSFORMATION
  // =============================================================================

  async transform(
    content: UniversalContent,
    options?: ContentTransformationOptions
  ): Promise<ContentTransformationResult> {
    try {
      this.log(`Transforming content for Medium: "${content.title}"`);

      // Medium-specific content adaptations
      const mediumContent = await this.adaptContentForMedium(content);
      const adaptedImages = await this.adaptImagesForMedium(content.bodyImages, content.featuredImage);
      const adaptedLinks = await this.adaptLinksForMedium(content);
      
      // Medium only allows external links that add value
      const warnings: string[] = [];
      
      if (content.internalLinkOpportunities.length > 0) {
        warnings.push('Internal links removed - Medium does not support internal linking between posts');
      }

      const platformContent: PlatformContent = {
        platform: this.name,
        adaptedContent: mediumContent,
        adaptedTitle: this.adaptTitleForMedium(content.title),
        adaptedExcerpt: this.adaptExcerptForMedium(content.excerpt),
        adaptedSlug: '', // Medium generates its own URLs
        adaptedTags: this.adaptTagsForMedium(content.tags, content.keywords),
        adaptedImages,
        adaptedLinks,
        platformSpecificFields: {
          // Medium-specific fields
          contentFormat: 'markdown',
          publishStatus: 'draft',
          license: 'all-rights-reserved',
          notifyFollowers: true,
          canonicalUrl: options?.customizations?.canonicalUrl || '',
          
          // Medium metadata
          readingTime: content.readingTime,
          wordCount: content.content.split(/\s+/).length,
          
          // Publication settings (if publishing to Medium publication)
          publicationId: options?.customizations?.publicationId || null,
          
          // Social sharing optimizations
          socialTitle: this.createSocialTitle(content.title),
          socialDescription: this.createSocialDescription(content.excerpt, content.metaDescription)
        },
        publishingSettings: {
          status: 'draft',
          publishDate: content.publishedAt,
          author: content.author,
          visibility: 'public',
          allowComments: true,
          featured: false
        }
      };

      return {
        success: true,
        transformedContent: platformContent,
        warnings,
        errors: [],
        metadata: {
          transformedAt: new Date(),
          originalWordCount: content.content.split(/\s+/).length,
          transformedWordCount: mediumContent.split(/\s+/).length,
          linksProcessed: adaptedLinks.length,
          imagesProcessed: adaptedImages.length,
          platform: this.name,
          version: this.version
        }
      };

    } catch (error) {
      this.log(`Error transforming content for Medium: ${error}`, 'error');
      
      return {
        success: false,
        transformedContent: {} as PlatformContent,
        warnings: [],
        errors: [`Medium transformation failed: ${error}`],
        metadata: {
          transformedAt: new Date(),
          originalWordCount: 0,
          transformedWordCount: 0,
          linksProcessed: 0,
          imagesProcessed: 0,
          platform: this.name,
          version: this.version
        }
      };
    }
  }

  async reverse(platformContent: PlatformContent): Promise<UniversalContent> {
    // Convert Medium content back to UniversalContent
    // Medium's export capabilities are limited
    
    return {
      title: platformContent.adaptedTitle,
      content: platformContent.adaptedContent,
      excerpt: platformContent.adaptedExcerpt,
      metaDescription: platformContent.platformSpecificFields.socialDescription || '',
      keywords: [], // Medium doesn't expose keyword data
      tags: platformContent.adaptedTags,
      
      featuredImage: platformContent.adaptedImages.find(img => 
        img.position === 'featured'
      )?.platformUrl,
      bodyImages: platformContent.adaptedImages
        .filter(img => img.position !== 'featured')
        .map(img => ({
          id: img.originalId,
          url: img.platformUrl,
          altText: img.altText,
          caption: img.caption,
          position: {
            type: 'inline' as const,
            order: 0,
            alignment: 'center' as const
          },
          placement: {},
          optimization: {
            formats: ['jpg', 'png'],
            sizes: [],
            lazyLoad: false, // Medium handles optimization
            compressionLevel: 'medium' as const
          }
        })),
      
      seoTitle: platformContent.adaptedTitle, // Medium doesn't separate SEO title
      slug: '', // Medium generates its own
      headingStructure: [], // Would need to parse from Markdown
      internalLinkOpportunities: [], // Not supported on Medium
      externalLinkTargets: [], // Would need to extract from content
      
      author: platformContent.publishingSettings.author,
      publishedAt: platformContent.publishingSettings.publishDate,
      updatedAt: new Date(),
      language: 'en',
      readingTime: platformContent.platformSpecificFields.readingTime || 0
    };
  }

  // =============================================================================
  // MEDIUM-SPECIFIC LINK STRATEGY
  // =============================================================================

  async generateBacklinks(
    content: UniversalContent,
    context: ProjectContext
  ): Promise<LinkStrategy> {
    this.log('Generating Medium-specific backlink strategy');

    // Medium doesn't support internal links, so focus on strategic external links
    const externalLinks = await this.processMediumExternalLinks(content, context);
    
    // All internal link opportunities become restricted on Medium
    const restrictedLinks = content.internalLinkOpportunities.map(opportunity => ({
      reason: 'Medium does not support internal linking between posts',
      originalOpportunity: opportunity,
      platformLimitation: 'No internal linking capability',
      alternatives: [
        'Convert to external link to main website',
        'Reference in author bio or publication description',
        'Include in call-to-action section'
      ]
    }));

    return {
      internalLinks: [], // Medium doesn't support internal links
      externalLinks,
      restrictedLinks,
      linkingRules: {
        maxInternalLinks: 0, // Not supported
        maxExternalLinks: 3, // Conservative approach for Medium
        requiredExternalLinks: [context.primaryWebsite], // Always link back to main site
        forbiddenDomains: [
          'medium.com', // Don't link to other Medium posts
          'medium.typeform.com' // Medium's own services
        ],
        linkPositionPreferences: [
          {
            position: 'conclusion',
            linkType: 'external',
            maxCount: 2
          }
        ],
        anchorTextRules: {
          maxLength: 50,
          avoidGeneric: true,
          includeKeywords: false, // Medium penalizes over-optimization
          preferBrandNames: true
        }
      }
    };
  }

  // =============================================================================
  // PUBLISHING METHODS
  // =============================================================================

  async publish(
    adaptedContent: PlatformContent,
    publishingConfig: PublishingConfiguration
  ): Promise<PublishingResult> {
    try {
      this.log(`Publishing to Medium: "${adaptedContent.adaptedTitle}"`);

      // In a real implementation, this would use Medium's API
      const mediumPost = {
        title: adaptedContent.adaptedTitle,
        contentFormat: 'markdown',
        content: adaptedContent.adaptedContent,
        tags: adaptedContent.adaptedTags,
        publishStatus: publishingConfig.settings.status === 'published' ? 'public' : 'draft',
        license: 'all-rights-reserved',
        canonicalUrl: adaptedContent.platformSpecificFields.canonicalUrl,
        notifyFollowers: adaptedContent.platformSpecificFields.notifyFollowers
      };

      // Simulate Medium API call
      await this.delay(1500); // Medium API is typically slower
      
      const publishedUrl = `https://medium.com/@${publishingConfig.credentials.credentials.username}/${this.generateMediumSlug(adaptedContent.adaptedTitle)}`;
      const contentId = `medium_${Date.now()}`;

      return {
        success: true,
        contentId,
        publishedUrl,
        status: {
          status: 'published',
          progress: 100,
          message: 'Successfully published to Medium'
        },
        metadata: {
          publishedAt: new Date(),
          platform: this.name,
          contentVersion: '1.0',
          originalContentId: contentId,
          wordCount: adaptedContent.adaptedContent.split(/\s+/).length,
          imageCount: adaptedContent.adaptedImages.length,
          linkCount: adaptedContent.adaptedLinks.length,
          processingTime: 1500
        }
      };

    } catch (error) {
      this.log(`Error publishing to Medium: ${error}`, 'error');
      
      return {
        success: false,
        status: {
          status: 'failed',
          message: `Medium publishing failed: ${error}`
        },
        errors: [{
          code: 'MEDIUM_PUBLISH_FAILED',
          message: error.toString(),
          recoverable: true,
          suggestions: ['Check Medium integration token', 'Verify content meets Medium guidelines']
        }],
        metadata: {
          platform: this.name,
          contentVersion: '1.0',
          originalContentId: '',
          wordCount: 0,
          imageCount: 0,
          linkCount: 0,
          processingTime: 0
        }
      };
    }
  }

  async update(
    contentId: string,
    adaptedContent: PlatformContent,
    publishingConfig: PublishingConfiguration
  ): Promise<PublishingResult> {
    // Medium has limited update capabilities
    this.log(`Note: Medium has limited post editing capabilities after publication`);
    
    // In practice, you might need to republish or make minor edits only
    return this.publish(adaptedContent, publishingConfig);
  }

  async delete(contentId: string): Promise<boolean> {
    try {
      this.log(`Deleting Medium post: ${contentId}`);
      
      // Medium doesn't allow programmatic deletion
      // This would typically set the post to private or draft
      await this.delay(300);
      
      this.log(`Note: Medium doesn't support deletion. Post set to private.`, 'warn');
      return true;
    } catch (error) {
      this.log(`Error managing Medium post: ${error}`, 'error');
      return false;
    }
  }

  async getPublishingStatus(contentId: string): Promise<PublishingStatus> {
    // Check Medium post status
    await this.delay(200);
    
    return {
      status: 'published',
      progress: 100,
      message: 'Post is live on Medium'
    };
  }

  // =============================================================================
  // MEDIUM-SPECIFIC HELPER METHODS
  // =============================================================================

  private async adaptContentForMedium(content: UniversalContent): Promise<string> {
    let mediumContent = content.content;

    // Medium-specific content optimizations
    mediumContent = this.optimizeForMediumReaders(mediumContent);
    mediumContent = this.addMediumCallToAction(mediumContent, content);
    mediumContent = this.formatForMediumStyle(mediumContent);

    return mediumContent;
  }

  private optimizeForMediumReaders(content: string): string {
    // Medium readers prefer shorter paragraphs and conversational tone
    return content
      .replace(/\n\n/g, '\n\n') // Ensure paragraph breaks
      .replace(/^(.{200,}?)([.!?])\s+(.)/gm, '$1$2\n\n$3') // Break long paragraphs at sentence boundaries
      .replace(/^\s*>\s*/gm, '> '); // Ensure proper blockquote formatting
  }

  private addMediumCallToAction(content: string, originalContent: UniversalContent): string {
    // Add Medium-style engagement and CTA
    const cta = `

---

*Thanks for reading! If you found this helpful, please give it a clap 👏 and follow for more insights.*

*Originally published at [our website](${originalContent.externalLinkTargets.find(link => link.linkType.category === 'corporate')?.url || '#'}).*`;

    return content + cta;
  }

  private formatForMediumStyle(content: string): string {
    // Apply Medium's preferred formatting conventions
    return content
      // Medium prefers ** for emphasis over *
      .replace(/\*([^*]+)\*/g, '**$1**')
      
      // Add better spacing around headers
      .replace(/^(#{1,3}\s+.+)$/gm, '\n$1\n')
      
      // Format lists with proper spacing
      .replace(/^(\*|\d+\.)\s+/gm, '$1 ')
      
      // Ensure proper blockquote formatting
      .replace(/^>\s*/gm, '> ');
  }

  private adaptTitleForMedium(title: string): string {
    // Medium titles should be engaging and readable
    let mediumTitle = title;

    // Ensure title is under limit
    if (mediumTitle.length > (this.capabilities.maxTitleLength || 100)) {
      mediumTitle = this.truncateText(mediumTitle, this.capabilities.maxTitleLength || 100);
    }

    // Medium performs better with question-style or benefit-driven titles
    if (!mediumTitle.match(/[?!:]/) && !mediumTitle.toLowerCase().includes('how to')) {
      // Could enhance with question or benefit, but keep original for now
    }

    return mediumTitle;
  }

  private adaptExcerptForMedium(excerpt: string): string {
    // Medium uses this for social sharing
    return this.truncateText(excerpt, 140);
  }

  private adaptTagsForMedium(tags: string[], keywords: string[]): string[] {
    // Medium allows max 5 tags and prefers broader topics
    const allTags = [...tags, ...keywords]
      .map(tag => tag.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim())
      .filter(tag => tag.length > 0)
      .filter(tag => tag.length <= 25) // Medium tag length limit
      .slice(0, 5); // Medium's max tag limit

    // Remove duplicates
    return Array.from(new Set(allTags));
  }

  private async adaptImagesForMedium(images: any[], featuredImage?: string): Promise<AdaptedImage[]> {
    const adaptedImages: AdaptedImage[] = [];

    // Medium handles featured images automatically from first image
    if (featuredImage) {
      adaptedImages.push({
        originalId: 'featured',
        platformUrl: featuredImage,
        altText: 'Featured image',
        position: 'featured',
        customAttributes: {
          'medium-insert': 'image'
        }
      });
    }

    // Add body images with Medium-specific formatting
    images.forEach((image, index) => {
      adaptedImages.push({
        originalId: image.id,
        platformUrl: image.url,
        altText: image.altText || `Image ${index + 1}`,
        caption: image.caption,
        position: 'inline',
        customAttributes: {
          'medium-insert': 'image',
          'medium-align': 'center'
        }
      });
    });

    return adaptedImages;
  }

  private async adaptLinksForMedium(content: UniversalContent): Promise<AdaptedLink[]> {
    const adaptedLinks: AdaptedLink[] = [];

    // Only process external links (Medium doesn't support internal links)
    content.externalLinkTargets.forEach(link => {
      // Medium prefers fewer, high-quality external links
      if (link.linkType.trustLevel === 'high' || link.linkType.category === 'authority') {
        adaptedLinks.push({
          originalId: link.id,
          url: link.url,
          anchorText: link.anchorText,
          attributes: {
            rel: 'noopener', // Medium adds this automatically
            target: '_blank' // Medium opens external links in new tab
          },
          platformSpecific: {
            quality: link.linkType.trustLevel,
            category: link.linkType.category
          }
        });
      }
    });

    return adaptedLinks.slice(0, 3); // Limit to 3 high-quality external links
  }

  private createSocialTitle(title: string): string {
    // Create engaging social media title
    return this.truncateText(title, 60); // Optimal for social sharing
  }

  private createSocialDescription(excerpt: string, metaDescription?: string): string {
    const description = metaDescription || excerpt;
    return this.truncateText(description, 155); // Optimal for social sharing
  }

  private async processMediumExternalLinks(
    content: UniversalContent,
    context: ProjectContext
  ): Promise<any[]> {
    // Medium-specific external linking strategy
    const corporateLink = {
      sourceText: 'our website',
      targetUrl: context.primaryWebsite,
      anchorText: context.projectName || 'our website',
      domain: new URL(context.primaryWebsite).hostname,
      linkPurpose: 'backlink' as const,
      attributes: {
        nofollow: false, // Link to your own site should be follow
        newTab: true,
        sponsored: false
      },
      position: { paragraphIndex: 999, sentenceIndex: 0, characterPosition: 0 } // Place at end
    };

    // Add authority links from external targets (but be selective)
    const authorityLinks = content.externalLinkTargets
      .filter(link => link.linkType.category === 'authority' && link.linkType.trustLevel === 'high')
      .slice(0, 2) // Max 2 authority links
      .map(link => ({
        sourceText: link.anchorText,
        targetUrl: link.url,
        anchorText: link.anchorText,
        domain: link.domain,
        linkPurpose: 'authority' as const,
        attributes: {
          nofollow: link.nofollow,
          newTab: true,
          sponsored: link.sponsored
        },
        position: { paragraphIndex: 0, sentenceIndex: 0, characterPosition: 0 }
      }));

    return [corporateLink, ...authorityLinks];
  }

  private generateMediumSlug(title: string): string {
    // Medium generates its own slugs, but we can predict the format
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8);
  }
}
