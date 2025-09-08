import { NextRequest, NextResponse } from 'next/server';
import { AIContentPublisher, AIContent } from '@/lib/content-publisher';
import { prisma } from '@/lib/db';

interface PublishRequestBody {
  blogId?: string;
  content?: AIContent;
  platforms: Array<'webflow' | 'wordpress'>;
  webflowConfig?: {
    apiKey: string;
    siteId: string;
    collectionId?: string;
  };
  wordpressConfig?: {
    siteUrl: string;
    username: string;
    password: string;
    defaultCategory?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PublishRequestBody = await request.json();
    const { blogId, content, platforms, webflowConfig, wordpressConfig } = body;

    console.log('📤 Content publishing request:', {
      blogId,
      hasContent: !!content,
      platforms,
      hasWebflowConfig: !!webflowConfig,
      hasWordPressConfig: !!wordpressConfig
    });

    // Get content from database if blogId is provided
    let publishContent: AIContent;
    
    if (blogId) {
      console.log('📚 Fetching blog post from database:', blogId);
      
      const blogPost = await prisma.blogPost.findUnique({
        where: { id: blogId }
      });

      if (!blogPost) {
        return NextResponse.json(
          { success: false, error: 'Blog post not found' },
          { status: 404 }
        );
      }

      // Convert blog post to AIContent format
      publishContent = {
        type: 'blog',
        title: blogPost.title,
        content: blogPost.content,
        excerpt: blogPost.title, // Use title as excerpt for now
        tags: blogPost.keywords ? blogPost.keywords.split(',').map(k => k.trim()) : [],
        categories: ['AI Generated'],
        status: 'published',
        seo: {
          metaTitle: blogPost.title,
          metaDescription: blogPost.title,
          keywords: blogPost.keywords ? blogPost.keywords.split(',').map(k => k.trim()) : []
        }
      };
    } else if (content) {
      publishContent = content;
    } else {
      return NextResponse.json(
        { success: false, error: 'Either blogId or content must be provided' },
        { status: 400 }
      );
    }

    // Initialize publisher
    const publisher = new AIContentPublisher();

    // Configure platforms
    if (platforms.includes('webflow') && webflowConfig) {
      console.log('🌐 Configuring Webflow...');
      await publisher.configureWebflow(
        webflowConfig.apiKey,
        webflowConfig.siteId,
        webflowConfig.collectionId
      );
    }

    if (platforms.includes('wordpress') && wordpressConfig) {
      console.log('📝 Configuring WordPress...');
      await publisher.configureWordPress(
        wordpressConfig.siteUrl,
        wordpressConfig.username,
        wordpressConfig.password,
        {
          defaultCategory: wordpressConfig.defaultCategory || 'AI Generated'
        }
      );
    }

    // Validate content
    console.log('✅ Validating content...');
    const validation = publisher.validateContent(publishContent);
    
    if (!validation.isValid) {
      console.log('❌ Content validation failed:', validation.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Content validation failed',
          validationErrors: validation.errors,
          validationWarnings: validation.warnings
        },
        { status: 400 }
      );
    }

    if (validation.warnings) {
      console.log('⚠️ Content validation warnings:', validation.warnings);
    }

    // Publish to platforms
    console.log('🚀 Publishing to platforms:', platforms);
    const results = await publisher.publishToMultiple(publishContent, platforms);

    // Check results
    const hasErrors = Object.values(results).some(result => !result.success);
    const successfulPlatforms = Object.entries(results)
      .filter(([_, result]) => result.success)
      .map(([platform, _]) => platform);

    console.log('📊 Publishing results:', {
      hasErrors,
      successfulPlatforms,
      results
    });

    // Update blog post status if published successfully
    if (blogId && successfulPlatforms.length > 0) {
      await prisma.blogPost.update({
        where: { id: blogId },
        data: { 
          status: 'published',
          updatedAt: new Date()
        }
      });
      console.log('✅ Updated blog post status to published');
    }

    return NextResponse.json({
      success: !hasErrors,
      message: hasErrors 
        ? 'Some platforms failed to publish'
        : 'Content published successfully',
      results,
      validationWarnings: validation.warnings,
      publishedToPlatforms: successfulPlatforms
    });

  } catch (error) {
    console.error('❌ Content publishing error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Publishing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return available platforms and configuration status
    const publisher = new AIContentPublisher();
    
    return NextResponse.json({
      success: true,
      availablePlatforms: ['webflow', 'wordpress'],
      supportedContentTypes: ['blog', 'faq', 'article', 'product-description', 'landing-page'],
      requiredFields: ['type', 'title', 'content'],
      optionalFields: ['excerpt', 'tags', 'categories', 'status', 'seo', 'images'],
      exampleContent: {
        type: 'blog',
        title: 'Example Blog Post',
        content: '<p>This is example content</p>',
        excerpt: 'Example excerpt',
        tags: ['AI', 'Technology'],
        categories: ['Tech News'],
        status: 'published',
        seo: {
          metaTitle: 'Example Blog Post | Your Site',
          metaDescription: 'This is an example blog post',
          keywords: ['ai', 'technology', 'blog']
        }
      }
    });
  } catch (error) {
    console.error('❌ Content publishing info error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get publishing info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
