
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Blog delete attempt started');
    
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

    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Blog post ID is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting blog post with ID:', id);

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

    // Delete the blog post
    await prisma.blogPost.delete({
      where: { id }
    });
    
    console.log('✅ Blog post deleted successfully:', id);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('❌ Blog delete error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete blog post',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
