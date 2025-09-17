import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { externalAPIClient, AIContent } from '@/lib/external-api-client';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Encryption key for API credentials
const ENCRYPTION_KEY = process.env.SOCIAL_ENCRYPTION_KEY || 'default-key-change-in-production';

function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// POST /api/social/publish - Publish content to social media platforms
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      blog_id,
      social_config_ids,
      content_type = 'post', // 'post', 'thread', 'article', 'story'
      scheduled_for,
      custom_content, // Optional: platform-specific content overrides
    } = body;

    // Validate required fields
    if (!blog_id || !social_config_ids || !Array.isArray(social_config_ids)) {
      return NextResponse.json(
        { error: 'Blog ID and social config IDs are required' },
        { status: 400 }
      );
    }

    // Get the blog post
    const blogPost = await prisma.blogPost.findFirst({
      where: {
        id: blog_id,
        user_id: session.user.id,
      },
    });

    if (!blogPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Get social media configurations
    const socialConfigs = await prisma.socialMediaConfiguration.findMany({
      where: {
        id: { in: social_config_ids },
        user_id: session.user.id,
        is_active: true,
      },
    });

    if (socialConfigs.length === 0) {
      return NextResponse.json(
        { error: 'No valid social media configurations found' },
        { status: 404 }
      );
    }

    const results = [];

    // Process each social media configuration
    for (const config of socialConfigs) {
      try {
        // Decrypt credentials
        const credentials = JSON.parse(decrypt(config.api_credentials as string));
        
        // Prepare content data for this platform
        const contentData = {
          title: blogPost.title,
          content: blogPost.content,
          excerpt: blogPost.excerpt,
          featured_image: blogPost.featured_image,
          tags: blogPost.tags,
          custom_content: custom_content?.[config.platform_type],
          publishing_rules: config.publishing_rules,
        };

        if (scheduled_for) {
          // Schedule for later publishing
          const queueItem = await prisma.socialQueue.create({
            data: {
              blog_id,
              social_config_id: config.id,
              scheduled_for: new Date(scheduled_for),
              content_type,
              content_data: contentData,
              status: 'queued',
            },
          });

          results.push({
            platform: config.platform_type,
            config_name: config.name,
            status: 'scheduled',
            scheduled_for,
            queue_id: queueItem.id,
          });
        } else {
          // Publish immediately using AI Content Publisher SDK
          try {
            // Initialize the External API Client
            const publisher = externalAPIClient;
            
            // Configure the social media platform
            await publisher.configureSocialMedia(config.platform_type, {
              platform: config.platform_type as any,
              credentials
            });

            // Transform blog post to AIContent format
            const content: AIContent = {
              type: 'social-post',
              title: blogPost.title,
              content: custom_content?.[config.platform_type] || blogPost.excerpt || blogPost.content,
              excerpt: blogPost.excerpt || undefined,
              tags: Array.isArray(blogPost.tags) ? blogPost.tags : [],
              status: 'published',
              socialPlatforms: [config.platform_type],
              socialContent: custom_content || {},
              hashtags: Array.isArray(blogPost.tags) ? blogPost.tags : [],
              images: blogPost.featured_image ? [{
                url: blogPost.featured_image,
                alt: blogPost.title
              }] : undefined
            };

            // Test content compatibility first
            const testResult = await publisher.testContentForPlatform(content, config.platform_type);
            
            // Create publication record
            const publication = await prisma.socialPublication.create({
              data: {
                blog_id,
                social_config_id: config.id,
                status: 'pending',
                content_type,
              },
            });

            if (!testResult.isCompatible) {
              // Mark as failed due to compatibility issues
              await prisma.socialPublication.update({
                where: { id: publication.id },
                data: {
                  status: 'failed',
                  error_message: `Content not compatible: ${testResult.issues.join(', ')}`
                },
              });

              results.push({
                platform: config.platform_type,
                config_name: config.name,
                status: 'failed',
                error: `Content not compatible: ${testResult.issues.join(', ')}`,
                suggestions: testResult.suggestions,
                publication_id: publication.id,
              });
              continue;
            }

            // Publish the content using external API
            const result = await publisher.publishToSocialMedia(content, config.platform_type, {
              platform: config.platform_type as any,
              credentials
            });

            if (result.success) {
              // Update publication record with success
              await prisma.socialPublication.update({
                where: { id: publication.id },
                data: {
                  status: 'published',
                  published_at: new Date(),
                  published_url: result.url || '',
                  external_id: result.contentId || '',
                  metadata: result.metadata
                },
              });

              results.push({
                platform: config.platform_type,
                config_name: config.name,
                status: 'published',
                published_url: result.url,
                external_id: result.contentId,
                publication_id: publication.id,
                test_score: testResult.score,
                suggestions: testResult.suggestions
              });
            } else {
              // Update publication record with failure
              await prisma.socialPublication.update({
                where: { id: publication.id },
                data: {
                  status: 'failed',
                  error_message: result.message
                },
              });

              results.push({
                platform: config.platform_type,
                config_name: config.name,
                status: 'failed',
                error: result.message,
                errors: result.errors,
                publication_id: publication.id,
              });
            }
          } catch (publishError) {
            console.error(`Error publishing to ${config.platform_type}:`, publishError);
            
            results.push({
              platform: config.platform_type,
              config_name: config.name,
              status: 'failed',
              error: publishError instanceof Error ? publishError.message : 'Unknown error',
            });
          }
        }
      } catch (configError) {
        console.error(`Error processing config ${config.id}:`, configError);
        
        results.push({
          platform: config.platform_type,
          config_name: config.name,
          status: 'failed',
          error: configError instanceof Error ? configError.message : 'Configuration error',
        });
      }
    }

    const successCount = results.filter(r => r.status === 'published' || r.status === 'scheduled').length;
    const failureCount = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Published to ${successCount} platform(s), ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        published: results.filter(r => r.status === 'published').length,
        scheduled: results.filter(r => r.status === 'scheduled').length,
        failed: failureCount,
      },
    });
  } catch (error) {
    console.error('Error in social media publishing:', error);
    return NextResponse.json(
      { error: 'Failed to publish to social media' },
      { status: 500 }
    );
  }
}
