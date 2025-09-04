
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs'; // Edge runtime cannot open TCP sockets (Prisma won't work)

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
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert content writer and SEO specialist with 10+ years of experience in creating high-quality, engaging blog content. 

WRITING GUIDELINES:
- Create original, valuable content that provides genuine insights
- Use natural keyword integration (avoid keyword stuffing)
- Write compelling headlines and subheadings
- Include actionable advice and examples
- Maintain consistent tone throughout
- Use varied sentence structures and vocabulary
- Avoid repetitive phrases or content
- Ensure smooth flow and logical progression

SEO OPTIMIZATION:
- Use proper markdown heading hierarchy (H1 → H2 → H3)
- Include keywords naturally in headings and body text
- Write compelling meta descriptions through engaging introductions
- Structure content for featured snippets when applicable
- Use bullet points and numbered lists for readability

CONTENT STRUCTURE:
- Start with an engaging hook
- Provide clear value proposition early
- Use subheadings every 200-300 words
- Include practical examples or case studies
- End with actionable conclusions
- Add calls-to-action where appropriate

QUALITY STANDARDS:
- No repetitive content or phrases
- No broken sentences or incomplete thoughts
- Consistent formatting throughout
- Professional yet accessible language
- Error-free grammar and spelling`
          },
          {
            role: 'user',
            content: `Create a comprehensive ${wordCount || '800-1200'} word blog post with the following specifications:

TITLE: ${title}

TARGET KEYWORDS: ${keywords?.length > 0 ? keywords.join(', ') : 'Focus on natural language and user intent'}

CONTENT OUTLINE: ${outline || 'Create a logical, engaging structure that addresses the topic comprehensively'}

WRITING TONE: ${tone || 'professional and engaging'}

REQUIREMENTS:
1. Write in markdown format with proper heading structure
2. Naturally integrate target keywords (avoid repetition)
3. Include practical examples and actionable insights
4. Ensure content flows logically from section to section
5. Provide genuine value to readers
6. Use varied vocabulary and sentence structures
7. No repetitive phrases or content blocks

Please generate high-quality, original content that readers will find valuable and search engines will rank well.`
          }
        ],
        stream: true,
        max_tokens: 6000,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.2,
      }),
    });

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let fullContent = '';
        let buffer = '';

        try {
          while (true) {
            const result = await reader?.read();
            if (!result) break;
            const { done, value } = result;
            if (done) break;
            
            // Properly decode chunks to avoid broken characters
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process complete lines only
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  // Save the completed blog post to database
                  try {
                    await prisma.blogPost.create({
                      data: {
                        title: title || 'Untitled Blog Post',
                        content: fullContent,
                        keywords: JSON.stringify(keywords || []),
                        status: 'draft',
                      },
                    });
                  } catch (dbError) {
                    console.error('Database save error:', dbError);
                  }
                  
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  return;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullContent += content;
                    // Send clean content chunk to client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
          
          // Process any remaining buffer
          if (buffer && buffer.startsWith('data: ')) {
            const data = buffer.slice(6).trim();
            if (data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                }
              } catch (e) {
                // Skip invalid JSON
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
