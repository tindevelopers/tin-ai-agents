import { AIContent, PublishResult, WebflowConfig } from '../types';

export class WebflowPublisher {
  private config: WebflowConfig;

  constructor(config: WebflowConfig) {
    this.config = config;
  }

  async publish(content: AIContent): Promise<PublishResult> {
    try {
      // Transform content to Webflow format
      const webflowData = this.transformContent(content);
      
      // Publish to Webflow
      const response = await fetch(`https://api.webflow.com/collections/${this.config.collectionId}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Version': '1.0.0'
        },
        body: JSON.stringify(webflowData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `Webflow API error: ${errorData.msg || response.statusText}`,
          errors: [errorData.msg || response.statusText]
        };
      }

      const result = await response.json();
      
      // Publish the item if it's not already live
      if (content.status === 'published') {
        await this.publishItem(result._id);
      }

      return {
        success: true,
        message: 'Successfully published to Webflow',
        contentId: result._id,
        url: this.generatePublishedUrl(result.slug),
        metadata: {
          webflowId: result._id,
          slug: result.slug,
          status: content.status
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to publish to Webflow',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async testConnection(): Promise<PublishResult> {
    try {
      // Test site access
      const siteResponse = await fetch(`https://api.webflow.com/sites/${this.config.siteId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Accept': 'application/json',
          'Accept-Version': '1.0.0'
        }
      });

      if (!siteResponse.ok) {
        const errorData = await siteResponse.json().catch(() => ({}));
        return {
          success: false,
          message: `Webflow site access failed: ${errorData.msg || siteResponse.statusText}`
        };
      }

      const siteData = await siteResponse.json();

      // Test collection access if specified
      if (this.config.collectionId) {
        const collectionResponse = await fetch(
          `https://api.webflow.com/collections/${this.config.collectionId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Accept': 'application/json',
              'Accept-Version': '1.0.0'
            }
          }
        );

        if (!collectionResponse.ok) {
          const errorData = await collectionResponse.json().catch(() => ({}));
          return {
            success: false,
            message: `Webflow collection access failed: ${errorData.msg || collectionResponse.statusText}`
          };
        }

        const collectionData = await collectionResponse.json();
        
        return {
          success: true,
          message: `Successfully connected to Webflow site "${siteData.name}" and collection "${collectionData.name}"`,
          metadata: {
            site: siteData,
            collection: collectionData
          }
        };
      }

      return {
        success: true,
        message: `Successfully connected to Webflow site: ${siteData.name}`,
        metadata: {
          site: siteData
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Webflow connection test failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private transformContent(content: AIContent): any {
    const webflowData: any = {
      name: content.title,
      slug: this.generateSlug(content.title),
      _archived: false,
      _draft: content.status !== 'published'
    };

    // Add content field
    if (content.content) {
      webflowData.content = content.content;
    }

    // Add excerpt/summary
    if (content.excerpt) {
      webflowData['meta-description'] = content.excerpt;
      webflowData.excerpt = content.excerpt;
    }

    // Add SEO fields
    if (content.seo) {
      if (content.seo.metaTitle) {
        webflowData['seo-title'] = content.seo.metaTitle;
      }
      if (content.seo.metaDescription) {
        webflowData['meta-description'] = content.seo.metaDescription;
      }
    }

    // Add categories and tags
    if (content.categories && content.categories.length > 0) {
      webflowData.category = content.categories[0]; // Webflow typically uses single category
    }

    if (content.tags && content.tags.length > 0) {
      webflowData.tags = content.tags.join(', ');
    }

    // Add featured image
    if (content.images && content.images.length > 0) {
      webflowData['featured-image'] = content.images[0].url;
    }

    // Add publish date
    if (content.publishDate) {
      webflowData['published-date'] = content.publishDate.toISOString();
    } else if (content.status === 'published') {
      webflowData['published-date'] = new Date().toISOString();
    }

    // Add author (could be configured)
    webflowData.author = 'AI Blog Writer';

    return webflowData;
  }

  private async publishItem(itemId: string): Promise<void> {
    await fetch(`https://api.webflow.com/collections/${this.config.collectionId}/items/${itemId}/publish`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Accept': 'application/json',
        'Accept-Version': '1.0.0'
      }
    });
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  private generatePublishedUrl(slug: string): string {
    // This would need to be configured based on the site's domain
    return `https://${this.config.siteId}.webflow.io/blog/${slug}`;
  }
}
