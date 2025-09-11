import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { AIContentPublisher, ContentScheduler, AIContent } from '@/lib/content-publisher';

// In-memory scheduler instance (in production, this would be managed differently)
let globalScheduler: ContentScheduler | null = null;

function getScheduler(): ContentScheduler {
  if (!globalScheduler) {
    const publisher = new AIContentPublisher();
    globalScheduler = new ContentScheduler(publisher, {
      platforms: ['webflow', 'linkedin', 'twitter', 'facebook'],
      frequency: {
        type: 'daily',
        time: '09:00',
        timezone: 'UTC'
      },
      autoTest: true,
      retryFailed: true
    });
    globalScheduler.start();
  }
  return globalScheduler;
}

// POST /api/content/schedule - Schedule content for publishing
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
      scheduled_time, 
      priority = 'medium',
      auto_test = true 
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
      }] : undefined
    };

    // Get the scheduler
    const scheduler = getScheduler();

    // Schedule the content
    const scheduledContent = scheduler.addToQueue(content, platforms, {
      priority: priority as 'low' | 'medium' | 'high',
      scheduledTime: scheduled_time ? new Date(scheduled_time) : undefined,
      autoSchedule: true
    });

    // Create a record in the publishing queue
    await prisma.publishingQueue.create({
      data: {
        blog_id,
        cms_config_id: null, // This is for multi-platform scheduling
        scheduled_for: scheduledContent.scheduledTime,
        status: 'queued',
        platform_data: {
          platforms,
          priority,
          scheduler_id: scheduledContent.id,
          auto_test
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Content scheduled successfully',
      scheduled_content: {
        id: scheduledContent.id,
        scheduled_time: scheduledContent.scheduledTime,
        platforms,
        priority: scheduledContent.priority,
        status: scheduledContent.status
      },
      queue_status: scheduler.getQueueStatus()
    });

  } catch (error) {
    console.error('Content scheduling error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to schedule content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/content/schedule - Get scheduled content queue
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scheduler = getScheduler();
    const queue = scheduler.getQueue();
    const status = scheduler.getQueueStatus();

    // Get database records for user's scheduled content
    const dbQueue = await prisma.publishingQueue.findMany({
      where: {
        blog_post: {
          user_id: session.user.id
        }
      },
      include: {
        blog_post: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true
          }
        }
      },
      orderBy: {
        scheduled_for: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      queue: {
        scheduler_queue: queue,
        database_queue: dbQueue,
        status
      },
      summary: {
        total_scheduled: status.total,
        pending: status.pending,
        processing: status.processing,
        completed: status.completed,
        failed: status.failed
      }
    });

  } catch (error) {
    console.error('Get schedule queue error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get schedule queue',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/content/schedule - Cancel scheduled content
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schedulerId = searchParams.get('scheduler_id');
    const queueId = searchParams.get('queue_id');

    if (!schedulerId && !queueId) {
      return NextResponse.json(
        { error: 'Either scheduler_id or queue_id is required' },
        { status: 400 }
      );
    }

    const scheduler = getScheduler();
    let removed = false;

    // Remove from scheduler if scheduler_id provided
    if (schedulerId) {
      removed = scheduler.removeFromQueue(schedulerId);
    }

    // Remove from database if queue_id provided
    if (queueId) {
      const deletedRecord = await prisma.publishingQueue.deleteMany({
        where: {
          id: queueId,
          blog_post: {
            user_id: session.user.id
          }
        }
      });
      removed = removed || deletedRecord.count > 0;
    }

    if (!removed) {
      return NextResponse.json(
        { error: 'Scheduled content not found or already processed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduled content cancelled successfully',
      queue_status: scheduler.getQueueStatus()
    });

  } catch (error) {
    console.error('Cancel schedule error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel scheduled content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

