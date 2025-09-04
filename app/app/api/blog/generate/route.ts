
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { title, keywords, outline, tone, wordCount } = await request.json();

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert content writer specializing in SEO-optimized blog posts. Write engaging, informative content that naturally incorporates keywords and provides value to readers. Use markdown formatting for structure.`
          },
          {
            role: 'user',
            content: `Write a ${wordCount || '800-1200'} word blog post with:
Title: ${title}
Target Keywords: ${keywords?.join?.(', ') || 'none'}
Outline: ${outline || 'Create a logical structure'}
Tone: ${tone || 'professional and engaging'}

Format the content in markdown with proper headings, subheadings, and structure for SEO optimization.`
          }
        ],
        stream: true,
        max_tokens: 4000,
      }),
    });

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let fullContent = '';

        try {
          while (true) {
            const result = await reader?.read();
            if (!result) break;
            const { done, value } = result;
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Save the completed blog post to database
                  await prisma.blogPost.create({
                    data: {
                      title: title || 'Untitled Blog Post',
                      content: fullContent,
                      keywords: JSON.stringify(keywords || []),
                      status: 'draft',
                    },
                  });
                  
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  return;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  fullContent += content;
                  controller.enqueue(encoder.encode(chunk));
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Blog generation error:', error);
    return new Response('Failed to generate blog content', { status: 500 });
  }
}
