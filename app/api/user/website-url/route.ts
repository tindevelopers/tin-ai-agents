import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { website_url: true }
    });

    return NextResponse.json({
      success: true,
      website_url: user?.website_url || null
    });

  } catch (error) {
    console.error('❌ Get website URL error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get website URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { website_url } = await request.json();

    if (website_url && typeof website_url !== 'string') {
      return NextResponse.json({ error: 'Website URL must be a string' }, { status: 400 });
    }

    // Normalize URL (add https:// if missing protocol)
    let normalizedUrl = null;
    if (website_url && website_url.trim()) {
      normalizedUrl = website_url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { website_url: normalizedUrl },
      select: { website_url: true }
    });

    console.log(`✅ Updated website URL for user ${session.user.id}: ${normalizedUrl}`);

    return NextResponse.json({
      success: true,
      website_url: updatedUser.website_url
    });

  } catch (error) {
    console.error('❌ Update website URL error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update website URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
