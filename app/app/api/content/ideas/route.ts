
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { keywords, industry, audience } = await request.json();

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
            content: 'You are a creative content strategist. Generate compelling content ideas that would rank well and engage audiences. Return ONLY valid JSON: {"ideas": [{"title": "string", "description": "string", "keywords": ["string"], "category": "string"}]}'
          },
          {
            role: 'user',
            content: `Generate 10 creative content ideas for: Keywords: ${keywords.join(', ')}, Industry: ${industry || 'general'}, Target Audience: ${audience || 'general audience'}`
          }
        ],
        response_format: { type: "json_object" },
        stream: false,
        max_tokens: 2500,
      }),
    });

    const data = await response.json();
    const ideasData = JSON.parse(data?.choices?.[0]?.message?.content || '{"ideas": []}');
    
    // Save content ideas to database
    for (const idea of ideasData.ideas) {
      await prisma.contentIdea.create({
        data: {
          title: idea.title,
          description: idea.description,
          keywords: JSON.stringify(idea.keywords),
          category: idea.category,
        },
      });
    }
    
    return NextResponse.json(ideasData);
  } catch (error) {
    console.error('Content ideas error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content ideas' },
      { status: 500 }
    );
  }
}
