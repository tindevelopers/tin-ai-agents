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

// GET /api/social/configs/[id] - Get specific social media configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const config = await prisma.socialMediaConfiguration.findFirst({
      where: {
        id,
        user_id: session.user.id,
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Social media configuration not found' },
        { status: 404 }
      );
    }

    // Decrypt credentials for editing (only return to owner)
    let decryptedCredentials = {};
    try {
      decryptedCredentials = JSON.parse(decrypt(config.api_credentials as string));
    } catch (error) {
      console.error('Error decrypting credentials:', error);
      // Return config without credentials if decryption fails
    }

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        api_credentials: decryptedCredentials,
      },
    });
  } catch (error) {
    console.error('Error fetching social media config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social media configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/social/configs/[id] - Update social media configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      account_handle,
      api_credentials,
      publishing_rules,
      is_active,
    } = body;

    // Check if config exists and belongs to user
    const existingConfig = await prisma.socialMediaConfiguration.findFirst({
      where: {
        id,
        user_id: session.user.id,
      },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Social media configuration not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (account_handle !== undefined) updateData.account_handle = account_handle;
    if (publishing_rules !== undefined) updateData.publishing_rules = publishing_rules;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    // Encrypt new credentials if provided
    if (api_credentials) {
      updateData.api_credentials = encrypt(JSON.stringify(api_credentials));
    }

    const updatedConfig = await prisma.socialMediaConfiguration.update({
      where: { id },
      data: updateData,
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
      message: 'Social media configuration updated successfully',
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Error updating social media config:', error);
    return NextResponse.json(
      { error: 'Failed to update social media configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/social/configs/[id] - Delete social media configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if config exists and belongs to user
    const existingConfig = await prisma.socialMediaConfiguration.findFirst({
      where: {
        id,
        user_id: session.user.id,
      },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Social media configuration not found' },
        { status: 404 }
      );
    }

    await prisma.socialMediaConfiguration.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Social media configuration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting social media config:', error);
    return NextResponse.json(
      { error: 'Failed to delete social media configuration' },
      { status: 500 }
    );
  }
}
