import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { AIContentPublisher, AIContent } from '@/lib/content-publisher';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cms_config_id, blog_post_id } = await request.json();

    if (!cms_config_id) {
      return NextResponse.json(
        { error: 'CMS configuration ID is required' },
        { status: 400 }
      );
    }

    // Fetch the CMS configuration
    const cmsConfig = await prisma.cmsConfiguration.findFirst({
      where: {
        id: cms_config_id,
        user_id: session.user.id,
        is_active: true
      }
    });

    if (!cmsConfig) {
      return NextResponse.json(
        { error: 'CMS configuration not found or inactive' },
        { status: 404 }
      );
    }

    // Get blog post data (either provided ID or create test data)
    let blogPost;
    
    if (blog_post_id) {
      blogPost = await prisma.blogPost.findFirst({
        where: {
          id: blog_post_id,
          user_id: session.user.id
        }
      });

      if (!blogPost) {
        return NextResponse.json(
          { error: 'Blog post not found' },
          { status: 404 }
        );
      }
    } else {
      // Create test blog post data
      blogPost = {
        id: 'test-' + Date.now(),
        title: 'Test Blog Post - ' + new Date().toLocaleString(),
        content: `# Test Blog Post

This is a test blog post created to verify the Webflow integration is working correctly.

## Features Tested

- **Title Publishing**: This post title should appear in your Webflow CMS
- **Content Publishing**: This markdown content should be converted and published
- **Slug Generation**: A URL-friendly slug should be automatically generated
- **Metadata**: SEO fields should be populated if configured

## Next Steps

If you can see this post in your Webflow CMS, the integration is working correctly! You can now:

1. Publish your actual blog posts from the AI Blog Writer
2. Customize field mappings in the configuration
3. Set up automatic publishing rules

---

*This test post was created on ${new Date().toISOString()}*`,
        slug: 'test-blog-post-' + Date.now(),
        meta_description: 'A test blog post to verify Webflow CMS integration is working correctly.',
        featured_image: null,
        author: session.user.email || 'AI Blog Writer',
        category: 'Test',
        tags: ['test', 'webflow', 'integration'],
        seo_title: 'Test Blog Post - Webflow Integration Test',
        excerpt: 'This is a test blog post created to verify the Webflow integration is working correctly.',
        user_id: session.user.id
      };
    }

    // Initialize the AI Content Publisher
    if (cmsConfig.platform_type === 'webflow') {
      try {
        // Parse API credentials
        const credentials = JSON.parse(cmsConfig.api_credentials as string);
        
        // Initialize publisher and configure Webflow
        const publisher = new AIContentPublisher();
        await publisher.configureWebflow(
          credentials.api_token,
          cmsConfig.site_id!,
          cmsConfig.collection_id || undefined
        );

        // Transform blog post to AIContent format
        const content: AIContent = {
          type: 'blog',
          title: blogPost.title,
          content: blogPost.content,
          excerpt: blogPost.excerpt || blogPost.meta_description || undefined,
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
          }] : undefined
        };

        // Test content before publishing
        const tester = new (await import('@/lib/content-publisher/content-tester')).ContentTester();
        const testResult = await tester.testForPlatform(content, 'webflow');
        if (!testResult.isCompatible) {
          return NextResponse.json({
            success: false,
            message: 'Content not compatible with Webflow',
            errors: testResult.issues,
            warnings: testResult.suggestions
          });
        }

        // Publish the blog post
        const result = await publisher.publish(content, 'webflow');

        // Check if publishing was successful
        if (!result.success) {
          return NextResponse.json({
            success: false,
            message: result.message,
            errors: result.errors
          });
        }

        // If this was a real blog post, record the publication
        if (blog_post_id && result.contentId) {
          await prisma.cmsPublication.create({
            data: {
              blog_id: blogPost.id,
              cms_config_id: cmsConfig.id,
              external_id: result.contentId,
              published_url: result.url || '',
              status: 'published',
              sync_hash: JSON.stringify(result.metadata || {}),
              external_metadata: result.metadata || {},
              last_synced_at: new Date()
            }
          });

          // Update blog post status
          await prisma.blogPost.update({
            where: { id: blogPost.id },
            data: { 
              status: 'published',
              published_at: new Date()
            }
          });
        }

        return NextResponse.json({
          success: true,
          message: result.message,
          result: {
            external_id: result.contentId,
            published_url: result.url,
            sync_hash: JSON.stringify(result.metadata),
            metadata: result.metadata,
            blog_post: {
              id: blogPost.id,
              title: blogPost.title,
              slug: blogPost.slug
            },
            test_results: testResult
          }
        });

      } catch (error) {
        console.error('Webflow publishing error:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to publish to Webflow',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    return NextResponse.json(
      { error: `Platform "${cmsConfig.platform_type}" is not supported yet` },
      { status: 400 }
    );

  } catch (error) {
    console.error('Test publish error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test publish',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
