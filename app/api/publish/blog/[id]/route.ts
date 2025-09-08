import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { WebflowPublisher } from '@/lib/cms-publishers/webflow'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { cms_config_id, publish_immediately = false, scheduled_for } = body

    // Validate required fields
    if (!cms_config_id) {
      return NextResponse.json(
        { error: 'cms_config_id is required' },
        { status: 400 }
      )
    }

    // Get blog post
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: params.id }
    })

    if (!blogPost) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    // Get CMS configuration
    const cmsConfig = await prisma.cmsConfiguration.findFirst({
      where: {
        id: cms_config_id,
        user_id: session.user.id,
        is_active: true
      }
    })

    if (!cmsConfig) {
      return NextResponse.json({ error: 'CMS configuration not found' }, { status: 404 })
    }

    if (publish_immediately) {
      // Publish immediately
      const result = await publishBlogPost(blogPost, cmsConfig)
      return NextResponse.json(result)
    } else if (scheduled_for) {
      // Schedule for later
      const queueEntry = await prisma.publishingQueue.create({
        data: {
          blog_id: params.id,
          cms_config_id,
          scheduled_for: new Date(scheduled_for),
          job_data: {
            blog_post: blogPost,
            cms_config: cmsConfig
          }
        }
      })

      return NextResponse.json({
        message: 'Blog post scheduled for publishing',
        queue_id: queueEntry.id,
        scheduled_for: queueEntry.scheduled_for
      })
    } else {
      return NextResponse.json(
        { error: 'Either publish_immediately or scheduled_for must be provided' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error publishing blog post:', error)
    return NextResponse.json(
      { error: 'Failed to publish blog post' },
      { status: 500 }
    )
  }
}

async function publishBlogPost(blogPost: any, cmsConfig: any) {
  // Create publishing history entry
  const historyEntry = await prisma.publishingHistory.create({
    data: {
      blog_id: blogPost.id,
      cms_config_id: cmsConfig.id,
      status: 'publishing'
    }
  })

  try {
    let publisher
    let result

    switch (cmsConfig.platform_type) {
      case 'webflow':
        publisher = new WebflowPublisher(cmsConfig)
        result = await publisher.publish(blogPost)
        break
      default:
        throw new Error(`Unsupported platform: ${cmsConfig.platform_type}`)
    }

    // Update publishing history with success
    await prisma.publishingHistory.update({
      where: { id: historyEntry.id },
      data: {
        status: 'published',
        published_url: result.published_url,
        published_at: new Date(),
        metadata: result.metadata
      }
    })

    // Create or update CMS publication record
    await prisma.cmsPublication.upsert({
      where: {
        blog_id_cms_config_id: {
          blog_id: blogPost.id,
          cms_config_id: cmsConfig.id
        }
      },
      create: {
        blog_id: blogPost.id,
        cms_config_id: cmsConfig.id,
        external_id: result.external_id,
        published_url: result.published_url,
        status: 'published',
        last_synced_at: new Date(),
        sync_hash: result.content_hash,
        external_metadata: result.metadata
      },
      update: {
        external_id: result.external_id,
        published_url: result.published_url,
        status: 'published',
        last_synced_at: new Date(),
        sync_hash: result.content_hash,
        external_metadata: result.metadata
      }
    })

    // Update blog post status
    await prisma.blogPost.update({
      where: { id: blogPost.id },
      data: {
        status: 'published',
        published_at: new Date()
      }
    })

    return {
      success: true,
      published_url: result.published_url,
      external_id: result.external_id,
      history_id: historyEntry.id
    }

  } catch (error) {
    // Update publishing history with failure
    await prisma.publishingHistory.update({
      where: { id: historyEntry.id },
      data: {
        status: 'failed',
        error_details: {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }
    })

    throw error
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get publishing status for this blog post
    const publications = await prisma.cmsPublication.findMany({
      where: { blog_id: params.id },
      include: {
        cms_config: {
          select: {
            id: true,
            platform_type: true,
            name: true
          }
        }
      }
    })

    const history = await prisma.publishingHistory.findMany({
      where: { blog_id: params.id },
      include: {
        cms_config: {
          select: {
            id: true,
            platform_type: true,
            name: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    })

    const queuedJobs = await prisma.publishingQueue.findMany({
      where: {
        blog_id: params.id,
        status: { in: ['queued', 'processing'] }
      },
      orderBy: { scheduled_for: 'asc' }
    })

    return NextResponse.json({
      publications,
      history,
      queued_jobs: queuedJobs
    })

  } catch (error) {
    console.error('Error fetching publishing status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch publishing status' },
      { status: 500 }
    )
  }
}
