
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs'; // Edge runtime cannot open TCP sockets (Prisma won't work)

export async function POST(request: NextRequest) {
  try {
    const { id, title, content, keywords, status } = await request.json();

    let blogPost;
    
    if (id) {
      // Update existing blog post
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
      blogPost = await prisma.blogPost.create({
        data: {
          title: title || 'Untitled Blog Post',
          content: content || '',
          keywords: JSON.stringify(keywords || []),
          status: status || 'draft',
        },
      });
    }
    
    return NextResponse.json({ success: true, blogPost });
  } catch (error) {
    console.error('Blog save error:', error);
    return NextResponse.json(
      { error: 'Failed to save blog post' },
      { status: 500 }
    );
  }
}
