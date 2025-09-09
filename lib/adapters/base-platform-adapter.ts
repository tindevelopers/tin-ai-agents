/**
 * Base Platform Adapter
 * Abstract base class for all platform-specific adapters
 */

import {
  UniversalContent,
  PlatformContent,
  PlatformCapabilities,
  ContentTransformationOptions,
  ContentTransformationResult
} from '../types/universal-content';

import {
  PlatformAdapter,
  ProjectContext,
  LinkStrategy,
  ValidationResult,
  PublishingConfiguration,
  PublishingResult,
  PublishingStatus
} from '../types/platform-adapters';

export abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly capabilities: PlatformCapabilities;

  // =============================================================================
  // ABSTRACT METHODS (must be implemented by each platform)
  // =============================================================================
  
  abstract transform(
    content: UniversalContent,
    options?: ContentTransformationOptions
  ): Promise<ContentTransformationResult>;

  abstract reverse(
    platformContent: PlatformContent
  ): Promise<UniversalContent>;

  abstract publish(
    adaptedContent: PlatformContent,
    publishingConfig: PublishingConfiguration
  ): Promise<PublishingResult>;

  abstract update(
    contentId: string,
    adaptedContent: PlatformContent,
    publishingConfig: PublishingConfiguration
  ): Promise<PublishingResult>;

  abstract delete(contentId: string): Promise<boolean>;

  abstract getPublishingStatus(contentId: string): Promise<PublishingStatus>;

  // =============================================================================
  // SHARED FUNCTIONALITY (can be overridden by specific platforms)
  // =============================================================================

  /**
   * Generate platform-specific backlink strategy
   */
  async generateBacklinks(
    content: UniversalContent,
    context: ProjectContext
  ): Promise<LinkStrategy> {
    const internalLinks = await this.processInternalLinks(content, context);
    const externalLinks = await this.processExternalLinks(content, context);
    const restrictedLinks = await this.identifyRestrictedLinks(content);
    const linkingRules = this.generateLinkingRules(context);

    return {
      internalLinks,
      externalLinks,
      restrictedLinks,
      linkingRules
    };
  }

  /**
   * Validate content against platform requirements
   */
  async validate(content: UniversalContent): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];
    const suggestions: any[] = [];

    // Check title length
    if (this.capabilities.maxTitleLength && content.title.length > this.capabilities.maxTitleLength) {
      errors.push({
        code: 'TITLE_TOO_LONG',
        field: 'title',
        message: `Title exceeds maximum length of ${this.capabilities.maxTitleLength} characters`,
        severity: 'high',
        autoFixable: true
      });
    }

    // Check excerpt length
    if (this.capabilities.maxExcerptLength && content.excerpt.length > this.capabilities.maxExcerptLength) {
      warnings.push({
        code: 'EXCERPT_TOO_LONG',
        field: 'excerpt',
        message: `Excerpt exceeds recommended length of ${this.capabilities.maxExcerptLength} characters`,
        impact: 'user_experience',
        recommendation: 'Consider shortening the excerpt for better display'
      });
    }

    // Check content length
    if (this.capabilities.maxContentLength) {
      const wordCount = content.content.split(/\s+/).length;
      if (wordCount > this.capabilities.maxContentLength) {
        errors.push({
          code: 'CONTENT_TOO_LONG',
          field: 'content',
          message: `Content exceeds maximum length of ${this.capabilities.maxContentLength} words`,
          severity: 'critical',
          autoFixable: false
        });
      }
    }

    // Check tags count
    if (this.capabilities.maxTagsCount && content.tags.length > this.capabilities.maxTagsCount) {
      warnings.push({
        code: 'TOO_MANY_TAGS',
        field: 'tags',
        message: `Number of tags (${content.tags.length}) exceeds recommended maximum of ${this.capabilities.maxTagsCount}`,
        impact: 'seo',
        recommendation: 'Consider reducing the number of tags'
      });
    }

    // Check images count
    if (this.capabilities.maxImagesCount && content.bodyImages.length > this.capabilities.maxImagesCount) {
      warnings.push({
        code: 'TOO_MANY_IMAGES',
        field: 'bodyImages',
        message: `Number of images (${content.bodyImages.length}) exceeds recommended maximum of ${this.capabilities.maxImagesCount}`,
        impact: 'platform_compatibility',
        recommendation: 'Consider reducing the number of images'
      });
    }

    // Platform-specific validations
    if (!this.capabilities.supportsMarkdownContent && this.containsMarkdown(content.content)) {
      errors.push({
        code: 'MARKDOWN_NOT_SUPPORTED',
        field: 'content',
        message: 'Platform does not support Markdown content',
        severity: 'high',
        autoFixable: true
      });
    }

    if (!this.capabilities.supportsInternalLinks && content.internalLinkOpportunities.length > 0) {
      warnings.push({
        code: 'INTERNAL_LINKS_NOT_SUPPORTED',
        field: 'internalLinkOpportunities',
        message: 'Platform does not support internal links',
        impact: 'seo',
        recommendation: 'Internal links will be converted to external links or removed'
      });
    }

    const score = this.calculateValidationScore(errors, warnings);

    return {
      isValid: errors.length === 0,
      score,
      errors,
      warnings,
      suggestions,
      platformCompatibility: [{
        platform: this.name,
        compatible: errors.length === 0,
        adaptationRequired: warnings.map(w => w.code),
        limitations: this.getKnownLimitations(),
        recommendations: suggestions.map(s => s.suggestion)
      }]
    };
  }

  // =============================================================================
  // PROTECTED HELPER METHODS
  // =============================================================================

  protected async processInternalLinks(
    content: UniversalContent,
    context: ProjectContext
  ): Promise<any[]> {
    // Default implementation - can be overridden by specific platforms
    return content.internalLinkOpportunities.map(opportunity => ({
      sourceText: opportunity.sourceText,
      targetUrl: opportunity.targetUrl || '#',
      anchorText: opportunity.anchorText,
      linkType: 'contextual',
      relevanceScore: opportunity.relevanceScore,
      position: opportunity.position,
      seoValue: opportunity.relevanceScore * 100
    }));
  }

  protected async processExternalLinks(
    content: UniversalContent,
    context: ProjectContext
  ): Promise<any[]> {
    // Default implementation - can be overridden by specific platforms
    return content.externalLinkTargets.map(link => ({
      sourceText: link.anchorText,
      targetUrl: link.url,
      anchorText: link.anchorText,
      domain: link.domain,
      linkPurpose: link.linkType.purpose,
      attributes: {
        nofollow: link.nofollow,
        newTab: link.newTab,
        sponsored: link.sponsored
      },
      position: { paragraphIndex: 0, sentenceIndex: 0, characterPosition: 0 }
    }));
  }

  protected async identifyRestrictedLinks(content: UniversalContent): Promise<any[]> {
    // Default implementation - no restrictions
    return [];
  }

  protected generateLinkingRules(context: ProjectContext): any {
    // Default linking rules based on platform capabilities
    return {
      maxInternalLinks: this.capabilities.supportsInternalLinks ? 10 : 0,
      maxExternalLinks: 5,
      requiredExternalLinks: [context.primaryWebsite],
      forbiddenDomains: [],
      linkPositionPreferences: [
        {
          position: 'body',
          linkType: 'internal',
          maxCount: 5
        },
        {
          position: 'conclusion',
          linkType: 'external',
          maxCount: 2
        }
      ],
      anchorTextRules: {
        maxLength: 60,
        avoidGeneric: true,
        includeKeywords: true,
        preferBrandNames: false
      }
    };
  }

  protected containsMarkdown(content: string): boolean {
    // Check for common Markdown patterns
    const markdownPatterns = [
      /#{1,6}\s/, // Headers
      /\*\*.*\*\*/, // Bold
      /\*.*\*/, // Italic
      /!\[.*\]\(.*\)/, // Images
      /\[.*\]\(.*\)/, // Links
      /```/, // Code blocks
      /`.*`/, // Inline code
      /^\s*-\s/, // Lists
      /^\s*\d+\.\s/ // Numbered lists
    ];

    return markdownPatterns.some(pattern => pattern.test(content));
  }

  protected calculateValidationScore(errors: any[], warnings: any[]): number {
    let score = 100;
    
    // Deduct points for errors
    errors.forEach(error => {
      switch (error.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Deduct points for warnings
    warnings.forEach(() => {
      score -= 2;
    });

    return Math.max(0, score);
  }

  protected getKnownLimitations(): string[] {
    const limitations: string[] = [];

    if (!this.capabilities.supportsInternalLinks) {
      limitations.push('Internal linking not supported');
    }
    if (!this.capabilities.supportsCustomSlugs) {
      limitations.push('Custom URL slugs not supported');
    }
    if (!this.capabilities.supportsMarkdownContent) {
      limitations.push('Markdown content requires conversion to HTML');
    }
    if (!this.capabilities.supportsImageGalleries) {
      limitations.push('Image galleries not supported');
    }
    if (!this.capabilities.supportsCustomFields) {
      limitations.push('Custom metadata fields not supported');
    }

    return limitations;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${message}`);
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in production, use a proper library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  }

  protected truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength - suffix.length);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + suffix;
    }
    
    return truncated + suffix;
  }

  protected extractPlainText(markdown: string): string {
    return markdown
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/\n+/g, ' ') // Replace multiple newlines with space
      .trim();
  }
}
