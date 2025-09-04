
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs'; // Edge runtime cannot open TCP sockets (Prisma won't work)

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Blog save attempt started');
    
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

    const { id, title, content, keywords, status } = await request.json();
    console.log('📝 Received blog data:', { 
      hasId: !!id,
      title: title?.substring(0, 50) + '...', 
      contentLength: content?.length || 0,
      keywordsLength: keywords?.length || 0,
      status 
    });

    // Check if blog_posts table exists
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'blog_posts'
        );
      `;
      console.log('📋 blog_posts table exists:', tableCheck);
    } catch (tableError) {
      console.error('❌ Table check failed:', tableError);
    }

    let blogPost;
    
    if (id) {
      // Update existing blog post
      console.log('📝 Updating existing blog post with ID:', id);
      blogPost = await prisma.blogPost.update({
        where: { id },
        data: {
          title: title || 'Untitled',
          content: content || '',
          keywords: JSON.stringify(keywords || []),
          status: status || 'draft',
        },
      });
    } else {
      // Create new blog post
      console.log('📝 Creating new blog post');
      blogPost = await prisma.blogPost.create({
        data: {
          title: title || 'Untitled Blog Post',
          content: content || '',
          keywords: JSON.stringify(keywords || []),
          status: status || 'draft',
        },
      });
    }
    
    console.log('✅ Blog post saved successfully:', blogPost.id);
    return NextResponse.json({ success: true, blogPost });
  } catch (error) {
    console.error('❌ Blog save error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save blog post',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
