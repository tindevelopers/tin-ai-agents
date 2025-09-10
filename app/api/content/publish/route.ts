import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { AIContentPublisher, AIContent } from '@/lib/content-publisher';

// POST /api/content/publish - Unified content publishing to multiple platforms
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      blog_id, 
      platforms, 
      test_before_publish = true,
      auto_optimize = false,
      publish_mode = 'immediate' // 'immediate', 'schedule', 'queue'
    } = body;

    if (!blog_id) {
      return NextResponse.json(
        { error: 'Blog ID is required' },
        { status: 400 }
      );
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform is required' },
        { status: 400 }
      );
    }

    // Get the blog post
    const blogPost = await prisma.blogPost.findFirst({
      where: {
        id: blog_id,
        user_id: session.user.id
      }
    });

    if (!blogPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Initialize the AI Content Publisher
    const publisher = new AIContentPublisher();
    
    // Get platform configurations
    const platformConfigs = await Promise.all(
      platforms.map(async (platform: string) => {
        if (platform === 'webflow') {
          const config = await prisma.cmsConfiguration.findFirst({
            where: {
              user_id: session.user.id,
              platform_type: 'webflow'
            }
          });
          return { platform, config, type: 'cms' };
        } else {
          const config = await prisma.socialMediaConfiguration.findFirst({
            where: {
              user_id: session.user.id,
              platform_type: platform
            }
          });
          return { platform, config, type: 'social' };
        }
      })
    );

    // Check if all platforms are configured
    const missingConfigs = platformConfigs.filter(p => !p.config);
    if (missingConfigs.length > 0) {
      return NextResponse.json({
        error: 'Some platforms are not configured',
        missing_platforms: missingConfigs.map(p => p.platform)
      }, { status: 400 });
    }

    // Configure all platforms
    for (const { platform, config, type } of platformConfigs) {
      if (type === 'cms' && platform === 'webflow') {
        const credentials = JSON.parse(config!.api_credentials as string);
        await publisher.configureWebflow(
          credentials.api_token,
          config!.site_id!,
          config!.collection_id || undefined
        );
      } else if (type === 'social') {
        const credentials = JSON.parse(config!.api_credentials as string);
        await publisher.configureSocialMedia(platform, {
          platform: platform as any,
          credentials
        });
      }
    }

    // Transform blog post to AIContent format
    const content: AIContent = {
      type: 'blog',
      title: blogPost.title,
      content: blogPost.content,
      excerpt: blogPost.excerpt || undefined,
      tags: Array.isArray(blogPost.tags) ? blogPost.tags : [],
      categories: blogPost.category ? [blogPost.category] : [],
      status: 'published',
      seo: {
        metaTitle: blogPost.seo_title || blogPost.title,
        metaDescription: blogPost.meta_description || blogPost.excerpt || undefined
      },
      images: blogPost.featured_image ? [{
        url: blogPost.featured_image,
        alt: blogPost.title
      }] : undefined,
      socialPlatforms: platforms.filter(p => p !== 'webflow'),
      hashtags: Array.isArray(blogPost.tags) ? blogPost.tags : []
    };

    const results = [];
    const testResults = [];

    // Test content for all platforms if requested
    if (test_before_publish) {
      for (const platform of platforms) {
        try {
          const testResult = await publisher.testContentForPlatform(content, platform);
          testResults.push(testResult);
          
          if (!testResult.isCompatible) {
            results.push({
              platform,
              status: 'failed',
              error: 'Content not compatible with platform',
              issues: testResult.issues,
              suggestions: testResult.suggestions
            });
          }
        } catch (error) {
          testResults.push({
            platform,
            isCompatible: false,
            score: 0,
            issues: [error instanceof Error ? error.message : 'Test failed'],
            suggestions: []
          });
          
          results.push({
            platform,
            status: 'failed',
            error: 'Testing failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Filter out incompatible platforms
      const compatiblePlatforms = testResults
        .filter(r => r.isCompatible)
        .map(r => r.platform);
      
      if (compatiblePlatforms.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Content is not compatible with any of the specified platforms',
          test_results: testResults,
          results
        });
      }

      // Update platforms to only include compatible ones
      platforms.splice(0, platforms.length, ...compatiblePlatforms);
    }

    // Publish to all compatible platforms
    const publishResults = await publisher.publishToMultiple(content, platforms);

    // Process results and update database
    for (const [platform, result] of Object.entries(publishResults)) {
      const platformConfig = platformConfigs.find(p => p.platform === platform);
      
      if (result.success) {
        // Create publication record
        if (platformConfig?.type === 'cms') {
          await prisma.cmsPublication.create({
            data: {
              blog_id,
              cms_config_id: platformConfig.config!.id,
              external_id: result.contentId || '',
              published_url: result.url || '',
              status: 'published',
              sync_hash: JSON.stringify(result.metadata),
              external_metadata: result.metadata,
              last_synced_at: new Date()
            }
          });
        } else if (platformConfig?.type === 'social') {
          await prisma.socialPublication.create({
            data: {
              blog_id,
              social_config_id: platformConfig.config!.id,
              status: 'published',
              content_type: 'blog',
              published_at: new Date(),
              published_url: result.url || '',
              external_id: result.contentId || '',
              metadata: result.metadata
            }
          });
        }

        results.push({
          platform,
          status: 'published',
          published_url: result.url,
          external_id: result.contentId,
          message: result.message,
          test_score: testResults.find(t => t.platform === platform)?.score
        });
      } else {
        results.push({
          platform,
          status: 'failed',
          error: result.message,
          errors: result.errors
        });
      }
    }

    // Update blog post status if any publication succeeded
    const successfulPublications = results.filter(r => r.status === 'published');
    if (successfulPublications.length > 0) {
      await prisma.blogPost.update({
        where: { id: blog_id },
        data: {
          status: 'published',
          published_at: new Date()
        }
      });
    }

    // Calculate overall success
    const totalPlatforms = platforms.length;
    const successfulPlatforms = successfulPublications.length;
    const overallSuccess = successfulPlatforms > 0;

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? `Successfully published to ${successfulPlatforms}/${totalPlatforms} platforms`
        : 'Failed to publish to any platform',
      results,
      test_results: test_before_publish ? testResults : undefined,
      summary: {
        total_platforms: totalPlatforms,
        successful_platforms: successfulPlatforms,
        failed_platforms: totalPlatforms - successfulPlatforms,
        success_rate: Math.round((successfulPlatforms / totalPlatforms) * 100)
      },
      blog_post: {
        id: blogPost.id,
        title: blogPost.title,
        status: successfulPublications.length > 0 ? 'published' : blogPost.status
      }
    });

  } catch (error) {
    console.error('Unified publishing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to publish content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}