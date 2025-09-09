import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Encryption helpers
const ENCRYPTION_KEY = process.env.CMS_ENCRYPTION_KEY || 'default-key-change-in-production'

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text: string): string {
  const textParts = text.split(':')
  const iv = Buffer.from(textParts.shift()!, 'hex')
  const encryptedText = textParts.join(':')
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platformType = searchParams.get('platform_type')

    const where: any = { user_id: session.user.id }
    if (platformType) {
      where.platform_type = platformType
    }

    const configs = await prisma.cmsConfiguration.findMany({
      where,
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
        // Don't include api_credentials in the response for security
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ configs })
  } catch (error) {
    console.error('Error fetching CMS configurations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CMS configurations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      platform_type,
      name,
      site_id,
      collection_id,
      api_credentials,
      field_mappings = {},
      publishing_rules = {}
    } = body

    // Validate required fields
    if (!platform_type || !name || !api_credentials) {
      return NextResponse.json(
        { error: 'Missing required fields: platform_type, name, api_credentials' },
        { status: 400 }
      )
    }

    // Encrypt API credentials
    const encryptedCredentials = encrypt(JSON.stringify(api_credentials))

    const config = await prisma.cmsConfiguration.create({
      data: {
        user_id: session.user.id,
        platform_type,
        name,
        site_id,
        collection_id,
        api_credentials: encryptedCredentials,
        field_mappings,
        publishing_rules
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
      }
    })

    return NextResponse.json({ config }, { status: 201 })
  } catch (error) {
    console.error('Error creating CMS configuration:', error)
    return NextResponse.json(
      { error: 'Failed to create CMS configuration' },
      { status: 500 }
    )
  }
}
