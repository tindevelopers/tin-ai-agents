import { AIContent, ContentTestResult } from './types';

export class ContentTester {
  async testForPlatform(content: AIContent, platform: string): Promise<ContentTestResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Platform-specific testing
    switch (platform.toLowerCase()) {
      case 'webflow':
        return this.testForWebflow(content);
      case 'wordpress':
        return this.testForWordPress(content);
      case 'linkedin':
        return this.testForLinkedIn(content);
      case 'twitter':
        return this.testForTwitter(content);
      case 'facebook':
        return this.testForFacebook(content);
      case 'instagram':
        return this.testForInstagram(content);
      default:
        return this.testGeneric(content, platform);
    }
  }

  private testForWebflow(content: AIContent): ContentTestResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Webflow-specific tests
    if (!content.title || content.title.length > 100) {
      issues.push('Title should be between 1-100 characters for Webflow CMS');
      score -= 20;
    }

    if (content.content.includes('<script>')) {
      issues.push('Webflow CMS may not support inline scripts');
      score -= 15;
    }

    // Check for Webflow-compatible HTML
    if (content.content.includes('style=')) {
      suggestions.push('Consider using Webflow classes instead of inline styles');
      score -= 5;
    }

    // SEO recommendations for Webflow
    if (!content.seo?.metaDescription) {
      suggestions.push('Add meta description for better Webflow SEO');
      score -= 10;
    }

    // Image optimization
    if (content.images && content.images.length > 0) {
      content.images.forEach((image, index) => {
        if (!image.alt) {
          suggestions.push(`Add alt text to image ${index + 1} for Webflow accessibility`);
          score -= 5;
        }
      });
    }

    return {
      platform: 'webflow',
      isCompatible: issues.length === 0,
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }

  private testForWordPress(content: AIContent): ContentTestResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // WordPress-specific tests
    if (!content.categories || content.categories.length === 0) {
      suggestions.push('Add categories for better WordPress organization');
      score -= 10;
    }

    if (!content.tags || content.tags.length === 0) {
      suggestions.push('Add tags for better WordPress discoverability');
      score -= 5;
    }

    // WordPress content length recommendations
    if (content.content.length < 300) {
      suggestions.push('WordPress posts should be at least 300 words for better SEO');
      score -= 15;
    }

    // WordPress-specific HTML
    if (content.content.includes('<!--more-->')) {
      suggestions.push('WordPress "more" tag detected - good for excerpt control');
    }

    return {
      platform: 'wordpress',
      isCompatible: issues.length === 0,
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }

  private testForLinkedIn(content: AIContent): ContentTestResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // LinkedIn character limits
    if (content.content.length > 3000) {
      issues.push('LinkedIn posts are limited to 3000 characters');
      score -= 30;
    }

    // LinkedIn best practices
    if (content.content.length < 100) {
      suggestions.push('LinkedIn posts perform better with at least 100 characters');
      score -= 10;
    }

    // Professional tone check (basic)
    const casualWords = ['lol', 'omg', 'wtf', 'gonna', 'wanna'];
    const hasCasualWords = casualWords.some(word => 
      content.content.toLowerCase().includes(word)
    );
    
    if (hasCasualWords) {
      suggestions.push('Consider using more professional language for LinkedIn');
      score -= 10;
    }

    // Hashtag recommendations
    if (content.hashtags) {
      if (content.hashtags.length > 5) {
        suggestions.push('LinkedIn performs better with 3-5 hashtags');
        score -= 5;
      }
    } else {
      suggestions.push('Add relevant hashtags for better LinkedIn reach');
      score -= 10;
    }

    return {
      platform: 'linkedin',
      isCompatible: issues.length === 0,
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }

  private testForTwitter(content: AIContent): ContentTestResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Twitter character limit
    if (content.content.length > 280) {
      issues.push('Twitter posts are limited to 280 characters');
      score -= 40;
    }

    // Twitter best practices
    if (content.content.length > 240) {
      suggestions.push('Leave room for retweets and replies (under 240 characters)');
      score -= 10;
    }

    // Hashtag validation
    if (content.hashtags && content.hashtags.length > 3) {
      suggestions.push('Twitter performs better with 1-3 hashtags');
      score -= 10;
    }

    // Mention validation
    if (content.mentions && content.mentions.length > 5) {
      suggestions.push('Too many mentions may reduce engagement');
      score -= 5;
    }

    // Link detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.content.match(urlRegex);
    if (urls && urls.length > 1) {
      suggestions.push('Twitter posts work best with one link');
      score -= 5;
    }

    return {
      platform: 'twitter',
      isCompatible: issues.length === 0,
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }

  private testForFacebook(content: AIContent): ContentTestResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Facebook character recommendations
    if (content.content.length > 500) {
      suggestions.push('Facebook posts perform better under 500 characters');
      score -= 10;
    }

    // Image recommendations
    if (!content.images || content.images.length === 0) {
      suggestions.push('Facebook posts with images get better engagement');
      score -= 15;
    }

    // Call-to-action check
    const ctaWords = ['click', 'share', 'comment', 'like', 'visit', 'learn more'];
    const hasCTA = ctaWords.some(word => 
      content.content.toLowerCase().includes(word)
    );
    
    if (!hasCTA) {
      suggestions.push('Add a call-to-action to improve Facebook engagement');
      score -= 10;
    }

    return {
      platform: 'facebook',
      isCompatible: issues.length === 0,
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }

  private testForInstagram(content: AIContent): ContentTestResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Instagram character limit
    if (content.content.length > 2200) {
      issues.push('Instagram captions are limited to 2200 characters');
      score -= 30;
    }

    // Image requirement
    if (!content.images || content.images.length === 0) {
      issues.push('Instagram posts require at least one image');
      score -= 50;
    }

    // Hashtag recommendations
    if (content.hashtags) {
      if (content.hashtags.length > 30) {
        issues.push('Instagram allows maximum 30 hashtags');
        score -= 20;
      } else if (content.hashtags.length < 5) {
        suggestions.push('Use 5-30 hashtags for better Instagram reach');
        score -= 10;
      }
    } else {
      suggestions.push('Add hashtags for better Instagram discoverability');
      score -= 15;
    }

    // Visual content check
    if (content.content.length > 1000) {
      suggestions.push('Instagram favors visual content over long text');
      score -= 10;
    }

    return {
      platform: 'instagram',
      isCompatible: issues.length === 0,
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }

  private testGeneric(content: AIContent, platform: string): ContentTestResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 80; // Default score for unknown platforms

    // Basic content validation
    if (!content.title) {
      issues.push('Title is required');
      score -= 20;
    }

    if (!content.content) {
      issues.push('Content is required');
      score -= 30;
    }

    suggestions.push(`Platform '${platform}' compatibility not fully tested`);
    score -= 10;

    return {
      platform,
      isCompatible: issues.length === 0,
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }
}

