/**
 * Universal Content Service
 * Handles transformation between BlogPost model and UniversalContent interface
 * Provides content analysis, validation, and adaptation capabilities
 */

import {
  UniversalContent,
  ContentImage,
  ContentHeading,
  LinkOpportunity,
  ExternalLink,
  ContentAnalysis,
  ContentValidation,
  ValidationError,
  ValidationWarning
} from '../types/universal-content';

// Import existing types (we'll need to make sure these exist)
interface BlogPost {
  id: string;
  title: string;
  content: string;
  keywords: string;
  status: string;
  slug?: string;
  meta_description?: string;
  featured_image?: string;
  author?: string;
  category?: string;
  tags: string[];
  seo_title?: string;
  excerpt?: string;
  published_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UniversalContentService {
  
  // =============================================================================
  // CONTENT TRANSFORMATION
  // =============================================================================
  
  /**
   * Convert BlogPost to UniversalContent format
   */
  static fromBlogPost(blogPost: BlogPost): UniversalContent {
    const keywords = this.parseKeywords(blogPost.keywords);
    const headingStructure = this.extractHeadingStructure(blogPost.content);
    const bodyImages = this.extractBodyImages(blogPost.content);
    const { internalLinks, externalLinks } = this.extractLinks(blogPost.content);
    
    return {
      title: blogPost.title,
      content: blogPost.content,
      excerpt: blogPost.excerpt || this.generateExcerpt(blogPost.content),
      metaDescription: blogPost.meta_description || this.generateMetaDescription(blogPost.content, blogPost.title),
      keywords: keywords,
      tags: blogPost.tags || [],
      
      // Media assets
      featuredImage: blogPost.featured_image,
      bodyImages: bodyImages,
      
      // SEO & Structure
      seoTitle: blogPost.seo_title || blogPost.title,
      slug: blogPost.slug || this.generateSlug(blogPost.title),
      headingStructure: headingStructure,
      
      // Internal linking data
      internalLinkOpportunities: internalLinks,
      externalLinkTargets: externalLinks,
      
      // Metadata
      author: blogPost.author,
      category: blogPost.category,
      publishedAt: blogPost.published_at,
      updatedAt: blogPost.updatedAt,
      language: 'en', // default, could be extracted or configured
      readingTime: this.calculateReadingTime(blogPost.content)
    };
  }
  
  /**
   * Convert UniversalContent back to BlogPost format
   */
  static toBlogPost(universalContent: UniversalContent, existingId?: string): Partial<BlogPost> {
    return {
      id: existingId,
      title: universalContent.title,
      content: universalContent.content,
      keywords: JSON.stringify(universalContent.keywords),
      slug: universalContent.slug,
      meta_description: universalContent.metaDescription,
      featured_image: universalContent.featuredImage,
      author: universalContent.author,
      category: universalContent.category,
      tags: universalContent.tags,
      seo_title: universalContent.seoTitle,
      excerpt: universalContent.excerpt,
      published_at: universalContent.publishedAt,
      updatedAt: universalContent.updatedAt || new Date()
    };
  }
  
  // =============================================================================
  // CONTENT ANALYSIS
  // =============================================================================
  
  /**
   * Analyze content for quality, SEO, and readability
   */
  static analyzeContent(content: UniversalContent): ContentAnalysis {
    const wordCount = this.countWords(content.content);
    const readingTime = this.calculateReadingTime(content.content);
    const keywordDensity = this.analyzeKeywordDensity(content.content, content.keywords);
    const readabilityScore = this.calculateReadabilityScore(content.content);
    const seoScore = this.calculateSEOScore(content);
    const headingStructureScore = this.evaluateHeadingStructure(content.headingStructure);
    const linkDistribution = this.analyzeLinkDistribution(content);
    const imageOptimizationScore = this.evaluateImageOptimization(content.bodyImages);
    const contentQualityMetrics = this.evaluateContentQuality(content.content);
    
    return {
      wordCount,
      readingTime,
      keywordDensity,
      readabilityScore,
      seoScore,
      headingStructureScore,
      linkDistribution,
      imageOptimizationScore,
      contentQualityMetrics
    };
  }
  
  /**
   * Validate content for completeness and quality
   */
  static validateContent(content: UniversalContent): ContentValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Required field validation
    if (!content.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        severity: 'error',
        suggestions: ['Add a descriptive title for your content']
      });
    }
    
    if (!content.content?.trim()) {
      errors.push({
        field: 'content',
        message: 'Content is required',
        severity: 'error',
        suggestions: ['Add content body']
      });
    }
    
    if (!content.metaDescription?.trim()) {
      warnings.push({
        field: 'metaDescription',
        message: 'Meta description is missing',
        impact: 'seo',
        autoFixAvailable: true
      });
    }
    
    // Content quality validation
    if (content.content && this.countWords(content.content) < 300) {
      warnings.push({
        field: 'content',
        message: 'Content is quite short (under 300 words)',
        impact: 'seo',
        autoFixAvailable: false
      });
    }
    
    // SEO validation
    if (content.keywords.length === 0) {
      warnings.push({
        field: 'keywords',
        message: 'No keywords specified',
        impact: 'seo',
        autoFixAvailable: false
      });
    }
    
    // Title length validation
    if (content.title && content.title.length > 60) {
      warnings.push({
        field: 'title',
        message: 'Title is longer than 60 characters (may be truncated in search results)',
        impact: 'seo',
        autoFixAvailable: false
      });
    }
    
    // Meta description length validation
    if (content.metaDescription && content.metaDescription.length > 160) {
      warnings.push({
        field: 'metaDescription',
        message: 'Meta description is longer than 160 characters',
        impact: 'seo',
        autoFixAvailable: true
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      platformCompatibility: [] // TODO: Implement platform-specific validation
    };
  }
  
  // =============================================================================
  // CONTENT EXTRACTION METHODS
  // =============================================================================
  
  private static parseKeywords(keywordsString: string): string[] {
    try {
      // Try to parse as JSON first (current format)
      return JSON.parse(keywordsString);
    } catch {
      // Fallback to comma-separated string
      return keywordsString.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }
  }
  
  private static extractHeadingStructure(content: string): ContentHeading[] {
    const headings: ContentHeading[] = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    let order = 0;
    
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const text = match[2].trim();
      const id = this.generateHeadingId(text);
      const wordCount = this.countWords(text);
      const keywords = this.extractKeywordsFromText(text);
      
      headings.push({
        level,
        text,
        id,
        order: order++,
        wordCount,
        keywords,
        subsections: [] // TODO: Build hierarchical structure
      });
    }
    
    return headings;
  }
  
  private static extractBodyImages(content: string): ContentImage[] {
    const images: ContentImage[] = [];
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    let order = 0;
    
    while ((match = imageRegex.exec(content)) !== null) {
      const altText = match[1] || '';
      const url = match[2];
      
      images.push({
        id: `img-${order}`,
        url,
        altText,
        position: {
          type: 'inline',
          order: order++,
          alignment: 'center'
        },
        placement: {
          paragraphIndex: this.findParagraphIndex(content, match.index!)
        },
        optimization: {
          formats: ['webp', 'jpg'],
          sizes: [],
          lazyLoad: true,
          compressionLevel: 'medium'
        }
      });
    }
    
    return images;
  }
  
  private static extractLinks(content: string): {
    internalLinks: LinkOpportunity[];
    externalLinks: ExternalLink[];
  } {
    const internalLinks: LinkOpportunity[] = [];
    const externalLinks: ExternalLink[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    let order = 0;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const anchorText = match[1];
      const url = match[2];
      const isExternal = url.startsWith('http://') || url.startsWith('https://');
      
      if (isExternal) {
        const domain = new URL(url).hostname;
        externalLinks.push({
          id: `ext-link-${order}`,
          url,
          anchorText,
          domain,
          linkType: {
            category: 'authority',
            purpose: 'reference',
            trustLevel: 'medium'
          },
          nofollow: false,
          newTab: true,
          sponsored: false
        });
      } else {
        internalLinks.push({
          id: `int-link-${order}`,
          sourceText: anchorText,
          targetType: 'internal',
          targetUrl: url,
          anchorText,
          context: this.getContextAround(content, match.index!, 100),
          relevanceScore: 0.8, // Default score
          position: {
            paragraphIndex: this.findParagraphIndex(content, match.index!),
            sentenceIndex: 0, // TODO: Calculate actual sentence index
            characterStart: match.index!,
            characterEnd: match.index! + match[0].length
          },
          linkIntent: {
            type: 'reference',
            purpose: 'user_experience',
            priority: 'medium'
          }
        });
      }
      order++;
    }
    
    return { internalLinks, externalLinks };
  }
  
  // =============================================================================
  // CONTENT ANALYSIS METHODS
  // =============================================================================
  
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  
  private static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = this.countWords(content);
    return Math.ceil(wordCount / wordsPerMinute);
  }
  
  private static analyzeKeywordDensity(content: string, keywords: string[]) {
    const wordCount = this.countWords(content);
    const contentLower = content.toLowerCase();
    
    return keywords.map(keyword => {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi');
      const matches = content.match(regex) || [];
      const count = matches.length;
      const density = (count / wordCount) * 100;
      
      return {
        keyword,
        count,
        density,
        prominence: this.calculateKeywordProminence(content, keyword),
        inTitle: contentLower.includes(keywordLower),
        inHeadings: this.checkKeywordInHeadings(content, keyword),
        inMetaDescription: false // TODO: Check meta description
      };
    });
  }
  
  private static calculateReadabilityScore(content: string): number {
    // Simplified Flesch Reading Ease calculation
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = this.countWords(content);
    const syllables = this.countSyllables(content);
    
    if (sentences === 0 || words === 0) return 0;
    
    const avgSentenceLength = words / sentences;
    const avgSyllablesPerWord = syllables / words;
    
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, score));
  }
  
  private static calculateSEOScore(content: UniversalContent): number {
    let score = 0;
    const maxScore = 100;
    
    // Title optimization (20 points)
    if (content.title && content.title.length >= 30 && content.title.length <= 60) {
      score += 20;
    } else if (content.title) {
      score += 10;
    }
    
    // Meta description (15 points)
    if (content.metaDescription && content.metaDescription.length >= 120 && content.metaDescription.length <= 160) {
      score += 15;
    } else if (content.metaDescription) {
      score += 8;
    }
    
    // Content length (15 points)
    const wordCount = this.countWords(content.content);
    if (wordCount >= 1000) {
      score += 15;
    } else if (wordCount >= 500) {
      score += 10;
    } else if (wordCount >= 300) {
      score += 5;
    }
    
    // Keywords usage (15 points)
    if (content.keywords.length > 0) {
      score += 15;
    }
    
    // Heading structure (15 points)
    if (content.headingStructure.length > 0) {
      score += 15;
    }
    
    // Images (10 points)
    if (content.bodyImages.length > 0 || content.featuredImage) {
      score += 10;
    }
    
    // Internal links (10 points)
    if (content.internalLinkOpportunities.length > 0) {
      score += 10;
    }
    
    return Math.min(maxScore, score);
  }
  
  private static evaluateHeadingStructure(headings: ContentHeading[]): number {
    if (headings.length === 0) return 0;
    
    let score = 50; // Base score for having headings
    
    // Check for H1
    const hasH1 = headings.some(h => h.level === 1);
    if (hasH1) score += 20;
    
    // Check for proper hierarchy
    const levels = headings.map(h => h.level).sort();
    const hasProperHierarchy = this.checkHeadingHierarchy(levels);
    if (hasProperHierarchy) score += 20;
    
    // Check heading frequency (one heading per 300 words is good)
    const avgWordsPerHeading = this.countWords('') / headings.length; // TODO: Pass actual content
    if (avgWordsPerHeading <= 300) score += 10;
    
    return Math.min(100, score);
  }
  
  private static analyzeLinkDistribution(content: UniversalContent) {
    const totalLinks = content.internalLinkOpportunities.length + content.externalLinkTargets.length;
    const internalLinks = content.internalLinkOpportunities.length;
    const externalLinks = content.externalLinkTargets.length;
    const authorityLinks = content.externalLinkTargets.filter(
      link => link.linkType.category === 'authority'
    ).length;
    
    const wordCount = this.countWords(content.content);
    const linkToContentRatio = wordCount > 0 ? totalLinks / wordCount * 100 : 0;
    
    return {
      totalLinks,
      internalLinks,
      externalLinks,
      authorityLinks,
      averageLinksPerParagraph: 0, // TODO: Calculate paragraphs
      linkToContentRatio
    };
  }
  
  private static evaluateImageOptimization(images: ContentImage[]): number {
    if (images.length === 0) return 100; // No images to optimize
    
    let totalScore = 0;
    
    images.forEach(image => {
      let imageScore = 0;
      
      // Alt text (40 points)
      if (image.altText && image.altText.length > 5) {
        imageScore += 40;
      }
      
      // Caption (20 points)
      if (image.caption) {
        imageScore += 20;
      }
      
      // Optimization settings (40 points)
      if (image.optimization.lazyLoad) imageScore += 10;
      if (image.optimization.formats.includes('webp')) imageScore += 15;
      if (image.optimization.compressionLevel !== 'low') imageScore += 15;
      
      totalScore += imageScore;
    });
    
    return totalScore / images.length;
  }
  
  private static evaluateContentQuality(content: string) {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.trim().split(/\s+/);
    
    const averageParagraphLength = paragraphs.length > 0 ? 
      paragraphs.reduce((sum, p) => sum + this.countWords(p), 0) / paragraphs.length : 0;
    
    const averageSentenceLength = sentences.length > 0 ?
      sentences.reduce((sum, s) => sum + this.countWords(s), 0) / sentences.length : 0;
    
    return {
      paragraphCount: paragraphs.length,
      averageParagraphLength,
      sentenceComplexity: averageSentenceLength,
      vocabularyDiversity: this.calculateVocabularyDiversity(words),
      topicalConsistency: 0.8, // TODO: Implement actual calculation
      expertiseIndicators: this.findExpertiseIndicators(content),
      originalityScore: 0.9 // TODO: Implement plagiarism checking
    };
  }
  
  // =============================================================================
  // UTILITY METHODS
  // =============================================================================
  
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  private static generateExcerpt(content: string, maxLength: number = 160): string {
    const plainText = content.replace(/[#*_~`\[\]()]/g, '').trim();
    const sentences = plainText.split(/[.!?]+/);
    
    let excerpt = '';
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (excerpt.length + trimmedSentence.length <= maxLength) {
        excerpt += (excerpt ? ' ' : '') + trimmedSentence + '.';
      } else {
        break;
      }
    }
    
    return excerpt || plainText.substring(0, maxLength) + '...';
  }
  
  private static generateMetaDescription(content: string, title: string): string {
    // Try to find the first paragraph that doesn't start with a heading
    const paragraphs = content.split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 0 && !p.startsWith('#'));
    
    if (paragraphs.length > 0) {
      return this.generateExcerpt(paragraphs[0], 155);
    }
    
    return this.generateExcerpt(content, 155);
  }
  
  private static generateHeadingId(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  private static extractKeywordsFromText(text: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !/^(the|and|but|for|are|with|this|that|they|have|from|will|been|said|each|which|their|time|make|like|into|more|very|what|know|just|first|get|over|think|also|your|work|life|only|new|would|there|could|use|two|way|she|may|say|him|his|has|had)$/.test(word))
      .slice(0, 5);
  }
  
  private static findParagraphIndex(content: string, position: number): number {
    const beforePosition = content.substring(0, position);
    return beforePosition.split('\n\n').length - 1;
  }
  
  private static getContextAround(content: string, position: number, radius: number): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(content.length, position + radius);
    return content.substring(start, end);
  }
  
  private static calculateKeywordProminence(content: string, keyword: string): number {
    const keywordLower = keyword.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Check if keyword appears in first 100 characters (introduction)
    if (contentLower.substring(0, 100).includes(keywordLower)) {
      return 1.0;
    }
    
    // Check if keyword appears in first 300 characters
    if (contentLower.substring(0, 300).includes(keywordLower)) {
      return 0.8;
    }
    
    // Regular appearance
    return 0.5;
  }
  
  private static checkKeywordInHeadings(content: string, keyword: string): boolean {
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    const keywordLower = keyword.toLowerCase();
    
    return headings.some(heading => 
      heading.toLowerCase().includes(keywordLower)
    );
  }
  
  private static countSyllables(text: string): number {
    // Simplified syllable counting
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    
    return words.reduce((total, word) => {
      let syllables = word.match(/[aeiouy]+/g)?.length || 1;
      if (word.endsWith('e') && syllables > 1) syllables--;
      return total + Math.max(1, syllables);
    }, 0);
  }
  
  private static checkHeadingHierarchy(levels: number[]): boolean {
    // Check if headings follow proper hierarchy (no skipping levels)
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) {
        return false;
      }
    }
    return true;
  }
  
  private static calculateVocabularyDiversity(words: string[]): number {
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    return words.length > 0 ? uniqueWords.size / words.length : 0;
  }
  
  private static findExpertiseIndicators(content: string): string[] {
    const indicators = [
      'according to research',
      'studies show',
      'data indicates',
      'expert opinion',
      'peer-reviewed',
      'analysis reveals',
      'statistics demonstrate',
      'evidence suggests'
    ];
    
    const contentLower = content.toLowerCase();
    return indicators.filter(indicator => 
      contentLower.includes(indicator)
    );
  }
}
