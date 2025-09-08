import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      blog_ids, 
      cms_config_id, 
      publish_immediately = false, 
      scheduled_for,
      priority = 1 
    } = body

    // Validate required fields
    if (!blog_ids || !Array.isArray(blog_ids) || blog_ids.length === 0) {
      return NextResponse.json(
        { error: 'blog_ids array is required and cannot be empty' },
        { status: 400 }
      )
    }

    if (!cms_config_id) {
      return NextResponse.json(
        { error: 'cms_config_id is required' },
        { status: 400 }
      )
    }

    // Verify CMS configuration exists and belongs to user
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

    // Verify all blog posts exist
    const blogPosts = await prisma.blogPost.findMany({
      where: {
        id: { in: blog_ids }
      }
    })

    if (blogPosts.length !== blog_ids.length) {
      const foundIds = blogPosts.map(post => post.id)
      const missingIds = blog_ids.filter(id => !foundIds.includes(id))
      return NextResponse.json(
        { error: `Blog posts not found: ${missingIds.join(', ')}` },
        { status: 404 }
      )
    }

    if (publish_immediately) {
      // Queue all posts for immediate publishing
      const queueEntries = await Promise.all(
        blog_ids.map(async (blogId: string, index: number) => {
          return prisma.publishingQueue.create({
            data: {
              blog_id: blogId,
              cms_config_id,
              scheduled_for: new Date(), // Immediate
              status: 'queued',
              priority: priority + index, // Slightly staggered priority
              job_data: {
                bulk_operation: true,
                original_request_id: crypto.randomUUID()
              }
            }
          })
        })
      )

      return NextResponse.json({
        message: `${blog_ids.length} blog posts queued for immediate publishing`,
        queue_entries: queueEntries.map(entry => ({
          id: entry.id,
          blog_id: entry.blog_id,
          scheduled_for: entry.scheduled_for,
          status: entry.status
        }))
      })

    } else if (scheduled_for) {
      // Schedule all posts for later publishing
      const scheduledDate = new Date(scheduled_for)
      
      const queueEntries = await Promise.all(
        blog_ids.map(async (blogId: string, index: number) => {
          // Stagger scheduled posts by 1 minute each to avoid API rate limits
          const staggeredDate = new Date(scheduledDate.getTime() + (index * 60000))
          
          return prisma.publishingQueue.create({
            data: {
              blog_id: blogId,
              cms_config_id,
              scheduled_for: staggeredDate,
              status: 'queued',
              priority,
              job_data: {
                bulk_operation: true,
                original_request_id: crypto.randomUUID()
              }
            }
          })
        })
      )

      return NextResponse.json({
        message: `${blog_ids.length} blog posts scheduled for publishing`,
        queue_entries: queueEntries.map(entry => ({
          id: entry.id,
          blog_id: entry.blog_id,
          scheduled_for: entry.scheduled_for,
          status: entry.status
        }))
      })

    } else {
      return NextResponse.json(
        { error: 'Either publish_immediately or scheduled_for must be provided' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error bulk publishing blog posts:', error)
    return NextResponse.json(
      { error: 'Failed to bulk publish blog posts' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const cms_config_id = searchParams.get('cms_config_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (cms_config_id) {
      where.cms_config_id = cms_config_id
    }

    // Get publishing queue with blog post and config details
    const queueEntries = await prisma.publishingQueue.findMany({
      where,
      include: {
        blog_post: {
          select: {
            id: true,
            title: true,
            status: true,
            created_at: true
          }
        },
        cms_config: {
          select: {
            id: true,
            platform_type: true,
            name: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { scheduled_for: 'asc' }
      ],
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.publishingQueue.count({ where })

    return NextResponse.json({
      queue_entries: queueEntries,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Error fetching publishing queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch publishing queue' },
      { status: 500 }
    )
  }
}
