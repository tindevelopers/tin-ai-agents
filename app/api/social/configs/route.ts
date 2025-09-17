import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Encryption key for API credentials (should be in environment variables)
const ENCRYPTION_KEY = process.env.SOCIAL_ENCRYPTION_KEY || 'default-key-change-in-production';

function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// GET /api/social/configs - List user's social media configurations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configs = await prisma.socialMediaConfiguration.findMany({
      where: {
        user_id: session.user.id,
      },
      select: {
        id: true,
        platform_type: true,
        name: true,
        account_handle: true,
        is_active: true,
        last_used_at: true,
        created_at: true,
        updated_at: true,
        // Don't return encrypted credentials in list view
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      configs,
    });
  } catch (error) {
    console.error('Error fetching social media configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social media configurations' },
      { status: 500 }
    );
  }
}

// POST /api/social/configs - Create new social media configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      platform_type,
      name,
      account_handle,
      api_credentials,
      publishing_rules = {},
    } = body;

    // Validate required fields
    if (!platform_type || !name || !api_credentials) {
      return NextResponse.json(
        { error: 'Platform type, name, and API credentials are required' },
        { status: 400 }
      );
    }

    // Validate platform type
    const validPlatforms = ['linkedin', 'twitter', 'facebook', 'instagram', 'tumblr'];
    if (!validPlatforms.includes(platform_type)) {
      return NextResponse.json(
        { error: 'Invalid platform type' },
        { status: 400 }
      );
    }

    // Encrypt API credentials
    const encryptedCredentials = encrypt(JSON.stringify(api_credentials));

    // Check for duplicate configuration
    const existingConfig = await prisma.socialMediaConfiguration.findFirst({
      where: {
        user_id: session.user.id,
        platform_type,
        name,
      },
    });

    if (existingConfig) {
      return NextResponse.json(
        { error: 'A configuration with this name already exists for this platform' },
        { status: 409 }
      );
    }

    const config = await prisma.socialMediaConfiguration.create({
      data: {
        user_id: session.user.id,
        platform_type,
        name,
        account_handle,
        api_credentials: encryptedCredentials,
        publishing_rules,
      },
      select: {
        id: true,
        platform_type: true,
        name: true,
        account_handle: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Social media configuration created successfully',
      config,
    });
  } catch (error) {
    console.error('Error creating social media config:', error);
    return NextResponse.json(
      { error: 'Failed to create social media configuration' },
      { status: 500 }
    );
  }
}
