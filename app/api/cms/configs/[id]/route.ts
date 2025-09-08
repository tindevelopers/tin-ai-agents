import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import crypto from 'crypto'

const prisma = new PrismaClient()

const ENCRYPTION_KEY = process.env.CMS_ENCRYPTION_KEY || 'default-key-change-in-production'

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await prisma.cmsConfiguration.findFirst({
      where: {
        id: id,
        user_id: session.user.id
      },
      select: {
        id: true,
        platform_type: true,
        name: true,
        site_id: true,
        collection_id: true,
        field_mappings: true,
        publishing_rules: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        // Include publishing stats
        _count: {
          select: {
            publishing_history: true,
            cms_publications: true
          }
        }
      }
    })

    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching CMS configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CMS configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      site_id,
      collection_id,
      api_credentials,
      field_mappings,
      publishing_rules,
      is_active
    } = body

    // Check if config exists and belongs to user
    const existingConfig = await prisma.cmsConfiguration.findFirst({
      where: {
        id: id,
        user_id: session.user.id
      }
    })

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (site_id !== undefined) updateData.site_id = site_id
    if (collection_id !== undefined) updateData.collection_id = collection_id
    if (field_mappings !== undefined) updateData.field_mappings = field_mappings
    if (publishing_rules !== undefined) updateData.publishing_rules = publishing_rules
    if (is_active !== undefined) updateData.is_active = is_active

    // Encrypt new API credentials if provided
    if (api_credentials) {
      updateData.api_credentials = encrypt(JSON.stringify(api_credentials))
    }

    const config = await prisma.cmsConfiguration.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        platform_type: true,
        name: true,
        site_id: true,
        collection_id: true,
        field_mappings: true,
        publishing_rules: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      }
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error updating CMS configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update CMS configuration' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if config exists and belongs to user
    const existingConfig = await prisma.cmsConfiguration.findFirst({
      where: {
        id: id,
        user_id: session.user.id
      }
    })

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    await prisma.cmsConfiguration.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Configuration deleted successfully' })
  } catch (error) {
    console.error('Error deleting CMS configuration:', error)
    return NextResponse.json(
      { error: 'Failed to delete CMS configuration' },
      { status: 500 }
    )
  }
}
