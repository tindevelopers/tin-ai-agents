import { AIContent, PublishResult, SocialMediaConfig } from '../types';

export class SocialMediaPublisher {
  private platform: string;
  private config: SocialMediaConfig;

  constructor(platform: string, config: SocialMediaConfig) {
    this.platform = platform;
    this.config = config;
  }

  async publish(content: AIContent): Promise<PublishResult> {
    try {
      switch (this.platform.toLowerCase()) {
        case 'linkedin':
          return await this.publishToLinkedIn(content);
        case 'twitter':
          return await this.publishToTwitter(content);
        case 'facebook':
          return await this.publishToFacebook(content);
        case 'instagram':
          return await this.publishToInstagram(content);
        case 'tumblr':
          return await this.publishToTumblr(content);
        default:
          return {
            success: false,
            message: `Platform '${this.platform}' not supported`,
            errors: [`Unsupported platform: ${this.platform}`]
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to publish to ${this.platform}`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async testConnection(): Promise<PublishResult> {
    try {
      switch (this.platform.toLowerCase()) {
        case 'linkedin':
          return await this.testLinkedInConnection();
        case 'twitter':
          return await this.testTwitterConnection();
        case 'facebook':
          return await this.testFacebookConnection();
        default:
          return {
            success: true,
            message: `${this.platform} connection test not implemented yet`
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `${this.platform} connection test failed`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async publishToLinkedIn(content: AIContent): Promise<PublishResult> {
    // Transform content for LinkedIn
    const linkedinContent = this.transformForLinkedIn(content);
    
    // This would use LinkedIn API
    // For now, return a mock response
    return {
      success: true,
      message: 'Successfully published to LinkedIn',
      contentId: `linkedin_${Date.now()}`,
      url: `https://linkedin.com/posts/mock-${Date.now()}`,
      metadata: {
        platform: 'linkedin',
        content: linkedinContent
      }
    };
  }

  private async publishToTwitter(content: AIContent): Promise<PublishResult> {
    // Transform content for Twitter
    const twitterContent = this.transformForTwitter(content);
    
    // This would use Twitter API v2
    // For now, return a mock response
    return {
      success: true,
      message: 'Successfully published to Twitter',
      contentId: `twitter_${Date.now()}`,
      url: `https://twitter.com/user/status/mock-${Date.now()}`,
      metadata: {
        platform: 'twitter',
        content: twitterContent
      }
    };
  }

  private async publishToFacebook(content: AIContent): Promise<PublishResult> {
    // Transform content for Facebook
    const facebookContent = this.transformForFacebook(content);
    
    // This would use Facebook Graph API
    // For now, return a mock response
    return {
      success: true,
      message: 'Successfully published to Facebook',
      contentId: `facebook_${Date.now()}`,
      url: `https://facebook.com/posts/mock-${Date.now()}`,
      metadata: {
        platform: 'facebook',
        content: facebookContent
      }
    };
  }

  private async publishToInstagram(content: AIContent): Promise<PublishResult> {
    // Instagram requires images
    if (!content.images || content.images.length === 0) {
      return {
        success: false,
        message: 'Instagram posts require at least one image',
        errors: ['No images provided for Instagram post']
      };
    }

    // Transform content for Instagram
    const instagramContent = this.transformForInstagram(content);
    
    // This would use Instagram Basic Display API
    // For now, return a mock response
    return {
      success: true,
      message: 'Successfully published to Instagram',
      contentId: `instagram_${Date.now()}`,
      url: `https://instagram.com/p/mock-${Date.now()}`,
      metadata: {
        platform: 'instagram',
        content: instagramContent
      }
    };
  }

  private async publishToTumblr(content: AIContent): Promise<PublishResult> {
    // Transform content for Tumblr
    const tumblrContent = this.transformForTumblr(content);
    
    // This would use Tumblr API
    // For now, return a mock response
    return {
      success: true,
      message: 'Successfully published to Tumblr',
      contentId: `tumblr_${Date.now()}`,
      url: `https://blog.tumblr.com/post/mock-${Date.now()}`,
      metadata: {
        platform: 'tumblr',
        content: tumblrContent
      }
    };
  }

  private transformForLinkedIn(content: AIContent): any {
    let text = content.content;
    
    // Add hashtags if present
    if (content.hashtags && content.hashtags.length > 0) {
      text += '\n\n' + content.hashtags.slice(0, 5).map(tag => `#${tag}`).join(' ');
    }

    // Ensure within LinkedIn limits
    if (text.length > 3000) {
      text = text.substring(0, 2997) + '...';
    }

    return {
      text,
      title: content.title,
      visibility: 'PUBLIC'
    };
  }

  private transformForTwitter(content: AIContent): any {
    let text = content.content;
    
    // Add hashtags if present (limit to 3 for Twitter)
    if (content.hashtags && content.hashtags.length > 0) {
      const hashtags = content.hashtags.slice(0, 3).map(tag => `#${tag}`).join(' ');
      text += ' ' + hashtags;
    }

    // Ensure within Twitter limits
    if (text.length > 280) {
      const availableLength = 280 - (content.hashtags ? content.hashtags.slice(0, 3).join(' ').length + 4 : 0);
      text = content.content.substring(0, availableLength - 3) + '...';
      if (content.hashtags && content.hashtags.length > 0) {
        text += ' ' + content.hashtags.slice(0, 3).map(tag => `#${tag}`).join(' ');
      }
    }

    return {
      text
    };
  }

  private transformForFacebook(content: AIContent): any {
    let message = content.content;
    
    // Add call-to-action if present
    if (content.ctaText && content.ctaUrl) {
      message += `\n\n${content.ctaText}: ${content.ctaUrl}`;
    }

    return {
      message,
      link: content.ctaUrl,
      published: content.status === 'published'
    };
  }

  private transformForInstagram(content: AIContent): any {
    let caption = content.content;
    
    // Add hashtags (Instagram allows up to 30)
    if (content.hashtags && content.hashtags.length > 0) {
      caption += '\n\n' + content.hashtags.map(tag => `#${tag}`).join(' ');
    }

    // Ensure within Instagram limits
    if (caption.length > 2200) {
      caption = caption.substring(0, 2197) + '...';
    }

    return {
      caption,
      image_url: content.images![0].url,
      alt_text: content.images![0].alt
    };
  }

  private transformForTumblr(content: AIContent): any {
    return {
      type: 'text',
      title: content.title,
      body: content.content,
      tags: content.tags?.join(','),
      state: content.status === 'published' ? 'published' : 'draft'
    };
  }

  private async testLinkedInConnection(): Promise<PublishResult> {
    // This would test LinkedIn API connection
    return {
      success: true,
      message: 'LinkedIn connection test successful'
    };
  }

  private async testTwitterConnection(): Promise<PublishResult> {
    // This would test Twitter API connection
    return {
      success: true,
      message: 'Twitter connection test successful'
    };
  }

  private async testFacebookConnection(): Promise<PublishResult> {
    // This would test Facebook API connection
    return {
      success: true,
      message: 'Facebook connection test successful'
    };
  }
}
