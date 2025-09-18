
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs'; // Edge runtime cannot open TCP sockets (Prisma won't work)

export async function POST(request: NextRequest) {
  try {
    const { title, keywords, outline, tone, wordCount } = await request.json();

    // Call the external AI Blog Writer API for blog generation
    const response = await fetch('https://api-ai-blog-writer-dev-613248238610.europe-west1.run.app/api/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: title,
        keywords: keywords || [],
        tone: tone || 'professional',
        length: wordCount > 1000 ? 'long' : wordCount > 500 ? 'medium' : 'short',
        outline: outline || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`API Error: ${data.error_message || 'Unknown error'}`);
    }

    // Save the completed blog post to database
    try {
      await prisma.blogPost.create({
        data: {
          title: data.blog_post.title || title || 'Untitled Blog Post',
          content: data.blog_post.content,
          keywords: JSON.stringify(data.blog_post.keywords || keywords || []),
          status: 'draft',
        },
      });
    } catch (dbError) {
      console.error('Database save error:', dbError);
    }

    // Return the complete blog post data
    return new Response(JSON.stringify({
      success: true,
      blog_post: data.blog_post,
      seo_metrics: data.seo_metrics,
      content_quality: data.content_quality,
      generation_time: data.generation_time_seconds,
      word_count: data.word_count,
      seo_score: data.seo_score,
      readability_score: data.readability_score,
      suggestions: data.suggestions,
      warnings: data.warnings
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Blog generation error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate blog content' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
