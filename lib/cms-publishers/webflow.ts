import crypto from 'crypto'

export interface WebflowConfig {
  api_credentials: string // encrypted JSON
  site_id?: string
  collection_id?: string
  field_mappings: Record<string, string>
  publishing_rules: Record<string, any>
}

export interface BlogPost {
  id: string
  title: string
  content: string
  slug?: string
  meta_description?: string
  featured_image?: string
  author?: string
  category?: string
  tags: string[]
  seo_title?: string
  excerpt?: string
}

export interface PublishResult {
  success: boolean
  external_id: string
  published_url: string
  content_hash: string
  metadata: Record<string, any>
}

export class WebflowPublisher {
  private config: WebflowConfig
  private apiToken: string
  private siteId: string
  private collectionId: string

  constructor(config: WebflowConfig) {
    this.config = config
    
    // Decrypt and parse API credentials
    const credentials = this.decryptCredentials(config.api_credentials)
    this.apiToken = credentials.api_token
    this.siteId = config.site_id || credentials.site_id
    this.collectionId = config.collection_id || credentials.collection_id

    if (!this.apiToken || !this.siteId || !this.collectionId) {
      throw new Error('Missing required Webflow configuration: api_token, site_id, collection_id')
    }
  }

  private decryptCredentials(encryptedCredentials: string): any {
    const ENCRYPTION_KEY = process.env.CMS_ENCRYPTION_KEY || 'default-key-change-in-production'
    
    try {
      const textParts = encryptedCredentials.split(':')
      const iv = Buffer.from(textParts.shift()!, 'hex')
      const encryptedText = textParts.join(':')
      const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return JSON.parse(decrypted)
    } catch (error) {
      throw new Error('Failed to decrypt API credentials')
    }
  }

  async publish(blogPost: BlogPost): Promise<PublishResult> {
    try {
      // Transform blog post data to Webflow format
      const webflowItem = this.transformBlogPost(blogPost)
      
      // Create content hash for change detection
      const contentHash = this.generateContentHash(blogPost)

      // Check if item already exists (for updates)
      const existingItem = await this.findExistingItem(blogPost.id)
      
      let result
      if (existingItem) {
        // Update existing item
        result = await this.updateWebflowItem(existingItem.id, webflowItem)
      } else {
        // Create new item
        result = await this.createWebflowItem(webflowItem)
      }

      // Publish the item (make it live)
      if (this.config.publishing_rules.auto_publish !== false) {
        await this.publishWebflowItem(result.id)
      }

      // Generate published URL
      const publishedUrl = this.generatePublishedUrl(result)

      return {
        success: true,
        external_id: result.id,
        published_url: publishedUrl,
        content_hash: contentHash,
        metadata: {
          webflow_item_id: result.id,
          collection_id: this.collectionId,
          created_at: result.createdOn,
          updated_at: result.updatedOn,
          slug: result.slug,
          draft: !this.config.publishing_rules.auto_publish
        }
      }

    } catch (error) {
      throw new Error(`Webflow publishing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private transformBlogPost(blogPost: BlogPost): any {
    const fieldMappings = this.config.field_mappings
    const webflowItem: any = {}

    // Apply field mappings
    webflowItem[fieldMappings.title || 'name'] = blogPost.title
    webflowItem[fieldMappings.content || 'content'] = this.convertContentToRichText(blogPost.content)
    webflowItem[fieldMappings.slug || 'slug'] = blogPost.slug || this.generateSlug(blogPost.title)
    
    if (blogPost.meta_description) {
      webflowItem[fieldMappings.meta_description || 'meta-description'] = blogPost.meta_description
    }
    
    if (blogPost.featured_image) {
      webflowItem[fieldMappings.featured_image || 'featured-image'] = blogPost.featured_image
    }
    
    if (blogPost.author) {
      webflowItem[fieldMappings.author || 'author'] = blogPost.author
    }
    
    if (blogPost.category) {
      webflowItem[fieldMappings.category || 'category'] = blogPost.category
    }
    
    if (blogPost.tags && blogPost.tags.length > 0) {
      webflowItem[fieldMappings.tags || 'tags'] = blogPost.tags.join(', ')
    }
    
    if (blogPost.seo_title) {
      webflowItem[fieldMappings.seo_title || 'seo-title'] = blogPost.seo_title
    }
    
    if (blogPost.excerpt) {
      webflowItem[fieldMappings.excerpt || 'excerpt'] = blogPost.excerpt
    }

    // Add publication date
    webflowItem[fieldMappings.published_date || 'published-date'] = new Date().toISOString()

    return webflowItem
  }

  private convertContentToRichText(content: string): any {
    // Convert markdown/HTML content to Webflow's rich text format
    // This is a simplified version - you might want to use a proper converter
    return {
      type: 'rich-text',
      content: [
        {
          type: 'paragraph',
          children: [
            {
              text: content
            }
          ]
        }
      ]
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  private generateContentHash(blogPost: BlogPost): string {
    const content = JSON.stringify({
      title: blogPost.title,
      content: blogPost.content,
      meta_description: blogPost.meta_description,
      tags: blogPost.tags
    })
    return crypto.createHash('md5').update(content).digest('hex')
  }

  private async findExistingItem(blogPostId: string): Promise<any | null> {
    try {
      // Search for existing items with matching reference
      const response = await fetch(
        `https://api.webflow.com/collections/${this.collectionId}/items?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Webflow API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Look for item with our blog post ID in custom field
      const existingItem = data.items?.find((item: any) => 
        item['blog-writer-id'] === blogPostId || 
        item.slug === this.generateSlug(blogPostId)
      )

      return existingItem || null
    } catch (error) {
      console.error('Error finding existing Webflow item:', error)
      return null
    }
  }

  private async createWebflowItem(itemData: any): Promise<any> {
    const response = await fetch(
      `https://api.webflow.com/collections/${this.collectionId}/items`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: itemData
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to create Webflow item: ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    return response.json()
  }

  private async updateWebflowItem(itemId: string, itemData: any): Promise<any> {
    const response = await fetch(
      `https://api.webflow.com/collections/${this.collectionId}/items/${itemId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: itemData
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to update Webflow item: ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    return response.json()
  }

  private async publishWebflowItem(itemId: string): Promise<void> {
    const response = await fetch(
      `https://api.webflow.com/collections/${this.collectionId}/items/${itemId}/live`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to publish Webflow item: ${response.statusText} - ${JSON.stringify(errorData)}`)
    }
  }

  private generatePublishedUrl(webflowItem: any): string {
    // Generate the published URL based on site configuration
    const baseUrl = this.config.publishing_rules.base_url || 'https://your-site.webflow.io'
    const slug = webflowItem.slug || webflowItem.fields?.slug
    return `${baseUrl}/blog/${slug}`
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`https://api.webflow.com/sites/${this.siteId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.statusText}`
        }
      }

      const siteData = await response.json()
      return {
        success: true,
        message: `Connected to site: ${siteData.name}`
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}
