
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const blogPosts = await prisma.blogPost.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const formattedPosts = blogPosts.map(post => ({
      ...post,
      keywords: JSON.parse(post.keywords || '[]'),
    }));

    return NextResponse.json({ blogPosts: formattedPosts });
  } catch (error) {
    console.error('Blog list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
