
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs'; // Edge runtime cannot open TCP sockets (Prisma won't work)

export async function GET() {
  try {
    // Updated: 2025-01-09 - Enhanced error handling and logging
    console.log('📚 Blog list fetch attempt started');
    
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

    // Check if blog_posts table exists and get schema
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      console.log('📋 blog_posts table schema:', tableInfo);
    } catch (schemaError) {
      console.error('❌ Schema check failed:', schemaError);
    }

    const blogPosts = await prisma.blogPost.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });

    console.log('✅ Found blog posts:', blogPosts.length);

    const formattedPosts = blogPosts.map(post => ({
      ...post,
      keywords: JSON.parse(post.keywords || '[]'),
    }));

    return NextResponse.json({ 
      blogPosts: formattedPosts,
      version: '2025-01-09-v2', // Version for deployment tracking
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Blog list fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch blog posts',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
