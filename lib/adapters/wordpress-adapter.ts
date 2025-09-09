/**
 * WordPress Platform Adapter
 * Handles content transformation and publishing for WordPress sites
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

export class WordPressAdapter extends BasePlatformAdapter {
  readonly name = 'WordPress';
  readonly version = '1.0.0';
  readonly capabilities: PlatformCapabilities = {
    name: 'WordPress',
    supportsInternalLinks: true,
    supportsCustomSlugs: true,
    supportsCategories: true,
    supportsTags: true,
    supportsFeaturedImages: true,
    supportsImageGalleries: true,
    supportsCustomFields: true,
    supportsHTMLContent: true,
    supportsMarkdownContent: false, // WordPress uses HTML/Rich Text
    supportsRichTextEditor: true,
    
    // Content limitations (WordPress is quite flexible)
    maxTitleLength: 100,
    maxExcerptLength: 320,
    maxContentLength: undefined, // No strict limit
    maxTagsCount: 20,
    maxImagesCount: undefined, // No strict limit
    
    // SEO capabilities
    supportsMetaDescription: true, // with SEO plugins
    supportsCustomMetaTags: true,
    supportsStructuredData: true,
    supportsCanonicalUrls: true,
    
    // Publishing features
    supportsScheduling: true,
    supportsDrafts: true,
    supportsVersioning: true,
    supportsCollaborativeEditing: false // depends on setup
  };

  // =============================================================================
  // CONTENT TRANSFORMATION
  // =============================================================================

  async transform(
    content: UniversalContent,
    options?: ContentTransformationOptions
  ): Promise<ContentTransformationResult> {
    try {
      this.log(`Transforming content for WordPress: "${content.title}"`);

      // Convert Markdown to WordPress-compatible HTML
      const htmlContent = await this.convertMarkdownToWordPressHTML(content.content);
      
      // Process images for WordPress
      const adaptedImages = await this.adaptImages(content.bodyImages, content.featuredImage);
      
      // Process links for WordPress
      const adaptedLinks = await this.adaptLinks(content);
      
      // Apply WordPress-specific content enhancements
      const enhancedContent = await this.enhanceContentForWordPress(htmlContent, content);

      const platformContent: PlatformContent = {
        platform: this.name,
        adaptedContent: enhancedContent,
        adaptedTitle: this.adaptTitle(content.title),
        adaptedExcerpt: this.adaptExcerpt(content.excerpt),
        adaptedSlug: this.adaptSlug(content.slug),
        adaptedTags: this.adaptTags(content.tags),
        adaptedImages,
        adaptedLinks,
        platformSpecificFields: {
          // WordPress-specific fields
          post_type: 'post',
          post_status: 'draft',
          comment_status: 'open',
          ping_status: 'open',
          meta_description: content.metaDescription,
          focus_keyword: content.keywords[0] || '',
          seo_title: content.seoTitle,
          categories: content.category ? [content.category] : [],
          custom_fields: {
            reading_time: content.readingTime,
            word_count: content.content.split(/\s+/).length,
            last_modified: new Date().toISOString()
          }
        },
        publishingSettings: {
          status: 'draft',
          publishDate: content.publishedAt,
          author: content.author,
          category: content.category,
          visibility: 'public',
          allowComments: true,
          featured: false
        }
      };

      return {
        success: true,
        transformedContent: platformContent,
        warnings: [],
        errors: [],
        metadata: {
          transformedAt: new Date(),
          originalWordCount: content.content.split(/\s+/).length,
          transformedWordCount: this.extractPlainText(enhancedContent).split(/\s+/).length,
          linksProcessed: adaptedLinks.length,
          imagesProcessed: adaptedImages.length,
          platform: this.name,
          version: this.version
        }
      };

    } catch (error) {
      this.log(`Error transforming content: ${error}`, 'error');
      
      return {
        success: false,
        transformedContent: {} as PlatformContent,
        warnings: [],
        errors: [`Transformation failed: ${error}`],
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
    // Convert WordPress content back to UniversalContent
    // This would be used for syncing content back from WordPress
    
    const htmlContent = platformContent.adaptedContent;
    const markdownContent = await this.convertHTMLToMarkdown(htmlContent);
    
    return {
      title: platformContent.adaptedTitle,
      content: markdownContent,
      excerpt: platformContent.adaptedExcerpt,
      metaDescription: platformContent.platformSpecificFields.meta_description || '',
      keywords: platformContent.platformSpecificFields.focus_keyword ? 
        [platformContent.platformSpecificFields.focus_keyword] : [],
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
            formats: ['webp', 'jpg'],
            sizes: [],
            lazyLoad: true,
            compressionLevel: 'medium' as const
          }
        })),
      
      seoTitle: platformContent.platformSpecificFields.seo_title || platformContent.adaptedTitle,
      slug: platformContent.adaptedSlug,
      headingStructure: [], // Would need to parse from HTML
      internalLinkOpportunities: [], // Would need to extract from HTML
      externalLinkTargets: [], // Would need to extract from HTML
      
      author: platformContent.publishingSettings.author,
      category: platformContent.publishingSettings.category,
      publishedAt: platformContent.publishingSettings.publishDate,
      updatedAt: new Date(),
      language: 'en',
      readingTime: platformContent.platformSpecificFields.custom_fields?.reading_time || 0
    };
  }

  // =============================================================================
  // WORDPRESS-SPECIFIC LINK STRATEGY
  // =============================================================================

  async generateBacklinks(
    content: UniversalContent,
    context: ProjectContext
  ): Promise<LinkStrategy> {
    this.log('Generating WordPress-specific backlink strategy');

    // WordPress supports full internal linking capabilities
    const internalLinks = await this.processWordPressInternalLinks(content, context);
    const externalLinks = await this.processWordPressExternalLinks(content, context);
    
    return {
      internalLinks,
      externalLinks,
      restrictedLinks: [], // WordPress has minimal restrictions
      linkingRules: {
        maxInternalLinks: 15, // Good for SEO without being spammy
        maxExternalLinks: 5,
        requiredExternalLinks: [context.primaryWebsite],
        forbiddenDomains: [],
        linkPositionPreferences: [
          {
            position: 'introduction',
            linkType: 'internal',
            maxCount: 2
          },
          {
            position: 'body',
            linkType: 'internal',
            maxCount: 8
          },
          {
            position: 'conclusion',
            linkType: 'external',
            maxCount: 3
          }
        ],
        anchorTextRules: {
          maxLength: 60,
          avoidGeneric: true,
          includeKeywords: true,
          preferBrandNames: false
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
      this.log(`Publishing to WordPress: "${adaptedContent.adaptedTitle}"`);

      // In a real implementation, this would use WordPress REST API or XML-RPC
      const wordpressPost = {
        title: adaptedContent.adaptedTitle,
        content: adaptedContent.adaptedContent,
        excerpt: adaptedContent.adaptedExcerpt,
        slug: adaptedContent.adaptedSlug,
        status: publishingConfig.settings.status,
        categories: adaptedContent.platformSpecificFields.categories || [],
        tags: adaptedContent.adaptedTags,
        featured_media: this.getFeaturedImageId(adaptedContent.adaptedImages),
        meta: adaptedContent.platformSpecificFields.custom_fields || {}
      };

      // Simulate API call
      await this.delay(1000);
      const publishedUrl = `${publishingConfig.credentials.credentials.site_url}/${adaptedContent.adaptedSlug}`;
      const contentId = `wp_${Date.now()}`;

      return {
        success: true,
        contentId,
        publishedUrl,
        status: {
          status: 'published',
          progress: 100,
          message: 'Successfully published to WordPress'
        },
        metadata: {
          publishedAt: new Date(),
          platform: this.name,
          contentVersion: '1.0',
          originalContentId: contentId,
          wordCount: adaptedContent.adaptedContent.split(/\s+/).length,
          imageCount: adaptedContent.adaptedImages.length,
          linkCount: adaptedContent.adaptedLinks.length,
          processingTime: 1000
        }
      };

    } catch (error) {
      this.log(`Error publishing to WordPress: ${error}`, 'error');
      
      return {
        success: false,
        status: {
          status: 'failed',
          message: `Publishing failed: ${error}`
        },
        errors: [{
          code: 'PUBLISH_FAILED',
          message: error.toString(),
          recoverable: true,
          suggestions: ['Check WordPress credentials', 'Verify site connectivity']
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
    // Similar to publish but updates existing content
    this.log(`Updating WordPress post: ${contentId}`);
    
    // In real implementation, would use WordPress REST API PUT request
    await this.delay(800);
    
    return {
      success: true,
      contentId,
      publishedUrl: `${publishingConfig.credentials.credentials.site_url}/${adaptedContent.adaptedSlug}`,
      status: {
        status: 'published',
        progress: 100,
        message: 'Successfully updated WordPress post'
      },
      metadata: {
        publishedAt: new Date(),
        platform: this.name,
        contentVersion: '1.1',
        originalContentId: contentId,
        wordCount: adaptedContent.adaptedContent.split(/\s+/).length,
        imageCount: adaptedContent.adaptedImages.length,
        linkCount: adaptedContent.adaptedLinks.length,
        processingTime: 800
      }
    };
  }

  async delete(contentId: string): Promise<boolean> {
    try {
      this.log(`Deleting WordPress post: ${contentId}`);
      
      // In real implementation, would use WordPress REST API DELETE request
      await this.delay(500);
      
      return true;
    } catch (error) {
      this.log(`Error deleting WordPress post: ${error}`, 'error');
      return false;
    }
  }

  async getPublishingStatus(contentId: string): Promise<PublishingStatus> {
    // In real implementation, would query WordPress API for post status
    await this.delay(200);
    
    return {
      status: 'published',
      progress: 100,
      message: 'Post is live on WordPress'
    };
  }

  // =============================================================================
  // WORDPRESS-SPECIFIC HELPER METHODS
  // =============================================================================

  private async convertMarkdownToWordPressHTML(markdown: string): Promise<string> {
    // Convert markdown to WordPress-compatible HTML
    // In production, you'd use a library like marked.js or remark
    
    return markdown
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      
      // Images (WordPress handles these specially)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, 
        '<img src="$2" alt="$1" class="wp-image-auto" />')
      
      // Lists
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hul])/gm, '<p>')
      .replace(/(?<![>])$/gm, '</p>')
      
      // Clean up
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<[hul])/g, '$1')
      .replace(/(<\/[hul]>)<\/p>/g, '$1');
  }

  private async convertHTMLToMarkdown(html: string): Promise<string> {
    // Convert WordPress HTML back to Markdown
    // This is the reverse process
    
    return html
      // Headers
      .replace(/<h1>(.*?)<\/h1>/g, '# $1')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1')
      
      // Bold and italic
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      
      // Links
      .replace(/<a href="([^"]+)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
      
      // Images
      .replace(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*\/?>/g, '![$2]($1)')
      
      // Lists
      .replace(/<ul>(.*?)<\/ul>/gs, (match, content) => {
        return content.replace(/<li>(.*?)<\/li>/g, '* $1').trim();
      })
      
      // Paragraphs
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      
      // Clean up
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private adaptTitle(title: string): string {
    // WordPress title optimization
    return this.truncateText(title, this.capabilities.maxTitleLength || 100);
  }

  private adaptExcerpt(excerpt: string): string {
    // WordPress excerpt optimization
    return this.truncateText(excerpt, this.capabilities.maxExcerptLength || 320);
  }

  private adaptSlug(slug: string): string {
    // WordPress-compatible slug
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private adaptTags(tags: string[]): string[] {
    // WordPress tag optimization
    const maxTags = this.capabilities.maxTagsCount || 20;
    return tags.slice(0, maxTags).map(tag => 
      tag.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim()
    );
  }

  private async adaptImages(images: any[], featuredImage?: string): Promise<AdaptedImage[]> {
    const adaptedImages: AdaptedImage[] = [];

    // Add featured image if present
    if (featuredImage) {
      adaptedImages.push({
        originalId: 'featured',
        platformUrl: featuredImage,
        altText: 'Featured image',
        position: 'featured'
      });
    }

    // Add body images
    images.forEach((image, index) => {
      adaptedImages.push({
        originalId: image.id,
        platformUrl: image.url,
        altText: image.altText || `Content image ${index + 1}`,
        caption: image.caption,
        position: 'inline',
        customAttributes: {
          'class': 'wp-image-content',
          'loading': 'lazy'
        }
      });
    });

    return adaptedImages;
  }

  private async adaptLinks(content: UniversalContent): Promise<AdaptedLink[]> {
    const adaptedLinks: AdaptedLink[] = [];

    // Process internal links
    content.internalLinkOpportunities.forEach(link => {
      adaptedLinks.push({
        originalId: link.id,
        url: link.targetUrl || '#',
        anchorText: link.anchorText,
        attributes: {
          rel: 'internal',
          title: link.anchorText
        }
      });
    });

    // Process external links
    content.externalLinkTargets.forEach(link => {
      adaptedLinks.push({
        originalId: link.id,
        url: link.url,
        anchorText: link.anchorText,
        attributes: {
          rel: link.nofollow ? 'nofollow noopener' : 'noopener',
          target: link.newTab ? '_blank' : '_self',
          title: link.anchorText
        }
      });
    });

    return adaptedLinks;
  }

  private async enhanceContentForWordPress(
    htmlContent: string,
    originalContent: UniversalContent
  ): Promise<string> {
    // Add WordPress-specific enhancements
    let enhanced = htmlContent;

    // Add WordPress blocks structure (Gutenberg)
    enhanced = this.wrapInWordPressBlocks(enhanced);

    // Add SEO enhancements
    if (originalContent.keywords.length > 0) {
      enhanced = this.addKeywordOptimization(enhanced, originalContent.keywords[0]);
    }

    // Add internal linking suggestions as HTML comments
    if (originalContent.internalLinkOpportunities.length > 0) {
      enhanced += '\n<!-- Internal linking opportunities: ' + 
        originalContent.internalLinkOpportunities.map(link => link.anchorText).join(', ') + 
        ' -->';
    }

    return enhanced;
  }

  private wrapInWordPressBlocks(htmlContent: string): string {
    // Convert HTML to WordPress Gutenberg blocks format
    return htmlContent
      .replace(/<p>(.*?)<\/p>/g, '<!-- wp:paragraph -->\n<p>$1</p>\n<!-- /wp:paragraph -->')
      .replace(/<h([1-6])>(.*?)<\/h[1-6]>/g, '<!-- wp:heading {"level":$1} -->\n<h$1>$2</h$1>\n<!-- /wp:heading -->')
      .replace(/<img([^>]*)>/g, '<!-- wp:image -->\n<img$1>\n<!-- /wp:image -->');
  }

  private addKeywordOptimization(content: string, focusKeyword: string): string {
    // Basic keyword optimization for WordPress
    const keywordRegex = new RegExp(`\\b${focusKeyword}\\b`, 'gi');
    const matches = content.match(keywordRegex) || [];
    
    // If keyword density is too low, suggest additions in comments
    const wordCount = content.split(/\s+/).length;
    const keywordDensity = (matches.length / wordCount) * 100;
    
    if (keywordDensity < 0.5) {
      content += `\n<!-- SEO Note: Consider adding "${focusKeyword}" more naturally throughout the content. Current density: ${keywordDensity.toFixed(2)}% -->`;
    }

    return content;
  }

  private async processWordPressInternalLinks(
    content: UniversalContent,
    context: ProjectContext
  ): Promise<any[]> {
    // WordPress-specific internal linking
    return content.internalLinkOpportunities.map(opportunity => ({
      sourceText: opportunity.sourceText,
      targetUrl: this.makeWordPressInternalUrl(opportunity.targetUrl || '', context.primaryWebsite),
      anchorText: opportunity.anchorText,
      linkType: 'contextual',
      relevanceScore: opportunity.relevanceScore,
      position: opportunity.position,
      seoValue: opportunity.relevanceScore * 100
    }));
  }

  private async processWordPressExternalLinks(
    content: UniversalContent,
    context: ProjectContext
  ): Promise<any[]> {
    // WordPress-specific external linking
    return content.externalLinkTargets.map(link => ({
      sourceText: link.anchorText,
      targetUrl: this.addWordPressTrackingParams(link.url, context),
      anchorText: link.anchorText,
      domain: link.domain,
      linkPurpose: link.linkType.purpose,
      attributes: {
        nofollow: link.nofollow || link.linkType.category === 'competitor',
        newTab: link.newTab,
        sponsored: link.sponsored
      },
      position: { paragraphIndex: 0, sentenceIndex: 0, characterPosition: 0 }
    }));
  }

  private makeWordPressInternalUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) return url;
    return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }

  private addWordPressTrackingParams(url: string, context: ProjectContext): string {
    // Add UTM parameters for tracking
    const urlObj = new URL(url);
    urlObj.searchParams.set('utm_source', 'wordpress');
    urlObj.searchParams.set('utm_medium', 'blog');
    urlObj.searchParams.set('utm_campaign', context.projectName.toLowerCase().replace(/\s+/g, '_'));
    return urlObj.toString();
  }

  private getFeaturedImageId(images: AdaptedImage[]): number | undefined {
    const featuredImage = images.find(img => img.position === 'featured');
    return featuredImage ? parseInt(featuredImage.platformId || '0') : undefined;
  }
}
