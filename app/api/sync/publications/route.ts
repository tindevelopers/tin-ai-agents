import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const cms_config_id = searchParams.get('cms_config_id')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {
      cms_config: {
        user_id: session.user.id
      }
    }

    if (cms_config_id) {
      where.cms_config_id = cms_config_id
    }

    if (status) {
      where.status = status
    }

    const publications = await prisma.cmsPublication.findMany({
      where,
      include: {
        cms_config: {
          select: {
            id: true,
            platform_type: true,
            name: true
          }
        },
        blog_post: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: { last_synced_at: 'desc' },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.cmsPublication.count({ where })

    return NextResponse.json({
      publications,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Error fetching publications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch publications' },
      { status: 500 }
    )
  }
}
