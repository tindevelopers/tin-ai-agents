import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest) {
  try {
    console.log('📝 Blog status update attempt started');
    
    // Check if database is accessible
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: String(dbError) },
        { status: 500 }
      );
    }

    const { id, status } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Blog post ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ['draft', 'ready_to_publish', 'published'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`📝 Updating blog post ${id} status to: ${status}`);

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Update the blog post status
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Set published_at when status changes to published
    if (status === 'published' && existingPost.status !== 'published') {
      updateData.published_at = new Date();
    }

    // Clear published_at if moving away from published status
    if (status !== 'published' && existingPost.status === 'published') {
      updateData.published_at = null;
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: updateData,
    });
    
    console.log('✅ Blog post status updated successfully:', { 
      id: updatedPost.id, 
      oldStatus: existingPost.status,
      newStatus: updatedPost.status 
    });

    return NextResponse.json({ 
      success: true, 
      blogPost: {
        ...updatedPost,
        keywords: JSON.parse(updatedPost.keywords || '[]'),
      }
    });
  } catch (error) {
    console.error('❌ Blog status update error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update blog post status',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
