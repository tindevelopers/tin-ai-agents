import { NextRequest, NextResponse } from 'next/server';
import { AIContentPublisher, AIContent } from '@/lib/content-publisher';
import { prisma } from '@/lib/db';

interface PublishRequestBody {
  blogId?: string;
  content?: AIContent;
  platforms: Array<'webflow' | 'wordpress' | 'linkedin' | 'medium' | 'ghost'>;
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
  linkedinConfig?: {
    accessToken: string;
    authorId: string;
    publishAsPage: boolean;
  };
  mediumConfig?: {
    integrationToken: string;
    authorId: string;
    publishStatus: string;
  };
  ghostConfig?: {
    apiUrl: string;
    adminApiKey: string;
    contentApiKey: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PublishRequestBody = await request.json();
    const { blogId, content, platforms, webflowConfig, wordpressConfig, linkedinConfig, mediumConfig, ghostConfig } = body;

    console.log('📤 Content publishing request:', {
      blogId,
      hasContent: !!content,
      platforms,
      hasWebflowConfig: !!webflowConfig,
      hasWordPressConfig: !!wordpressConfig,
      hasLinkedInConfig: !!linkedinConfig,
      hasMediumConfig: !!mediumConfig,
      hasGhostConfig: !!ghostConfig
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

    // Note: LinkedIn, Medium, and Ghost configurations will be implemented
    // in the next version of the AI Content Publisher SDK
    if (platforms.includes('linkedin') && linkedinConfig) {
      console.log('💼 LinkedIn publishing requested but not yet implemented in SDK...');
      // TODO: Implement when SDK supports LinkedIn
      // await publisher.configureLinkedIn(linkedinConfig.accessToken, linkedinConfig.authorId, { publishAsPage: linkedinConfig.publishAsPage });
    }

    if (platforms.includes('medium') && mediumConfig) {
      console.log('📰 Medium publishing requested but not yet implemented in SDK...');
      // TODO: Implement when SDK supports Medium
      // await publisher.configureMedium(mediumConfig.integrationToken, mediumConfig.authorId, { publishStatus: mediumConfig.publishStatus });
    }

    if (platforms.includes('ghost') && ghostConfig) {
      console.log('👻 Ghost publishing requested but not yet implemented in SDK...');
      // TODO: Implement when SDK supports Ghost
      // await publisher.configureGhost(ghostConfig.apiUrl, ghostConfig.adminApiKey, ghostConfig.contentApiKey);
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

    // Filter out platforms not yet implemented in the SDK
    const supportedPlatforms = platforms.filter(platform => 
      ['webflow', 'wordpress'].includes(platform)
    ) as Array<'webflow' | 'wordpress'>;
    const unsupportedPlatforms = platforms.filter(platform => 
      !['webflow', 'wordpress'].includes(platform)
    );

    console.log('🚀 Publishing to supported platforms:', supportedPlatforms);
    if (unsupportedPlatforms.length > 0) {
      console.log('⏳ Unsupported platforms (coming soon):', unsupportedPlatforms);
    }

    // Publish to supported platforms
    let results: { [platform: string]: any } = {};
    
    if (supportedPlatforms.length > 0) {
      results = await publisher.publishToMultiple(publishContent, supportedPlatforms);
    }

    // Add placeholder results for unsupported platforms
    unsupportedPlatforms.forEach(platform => {
      results[platform] = {
        success: false,
        message: `${platform} publishing is coming soon! UI ready, SDK implementation in progress.`,
        contentId: null,
        url: null,
        errors: [`${platform} adapter not yet implemented in SDK`]
      };
    });

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
