
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs'; // Edge runtime cannot open TCP sockets (Prisma won't work)

export async function POST(request: NextRequest) {
  try {
    const { keywords, industry, audience } = await request.json();
    
    console.log('📝 Content Ideas API called with:', { keywords, industry, audience });

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords are required and must be an array' },
        { status: 400 }
      );
    }

    if (!process.env.ABACUSAI_API_KEY) {
      console.error('❌ ABACUSAI_API_KEY not found in environment');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    console.log('🚀 Making API call to generate content ideas...');
    
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
            content: 'You are a creative content strategist. Generate compelling content ideas that would rank well and engage audiences. Return ONLY valid JSON in this exact format: {"ideas": [{"title": "string", "description": "string", "keywords": ["string"], "category": "how-to"}]}'
          },
          {
            role: 'user',
            content: `Generate 6 creative content ideas for: Keywords: ${keywords.join(', ')}, Industry: ${industry || 'general'}, Target Audience: ${audience || 'general audience'}`
          }
        ],
        response_format: { type: "json_object" },
        stream: false,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('❌ API response not ok:', response.status, response.statusText);
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('🎯 API Response received:', JSON.stringify(data, null, 2));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid API response structure:', data);
      return NextResponse.json(
        { error: 'Invalid response from API' },
        { status: 500 }
      );
    }

    let ideasData;
    try {
      ideasData = JSON.parse(data.choices[0].message.content || '{"ideas": []}');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError, 'Content:', data.choices[0].message.content);
      
      // Fallback: create mock ideas if parsing fails
      ideasData = {
        ideas: [
          {
            title: `How to Leverage ${keywords[0]} for Business Growth`,
            description: `A comprehensive guide on utilizing ${keywords[0]} strategies to drive business success.`,
            keywords: keywords.slice(0, 3),
            category: 'how-to'
          },
          {
            title: `Top 5 ${keywords[0]} Tips for ${audience || 'Success'}`,
            description: `Essential tips and best practices for mastering ${keywords[0]} in ${industry || 'your field'}.`,
            keywords: keywords.slice(0, 3),
            category: 'listicle'
          },
          {
            title: `${keywords[0]} vs Traditional Methods: What Works Better?`,
            description: `Comparing modern ${keywords[0]} approaches with traditional methods to help you choose the best strategy.`,
            keywords: keywords.slice(0, 3),
            category: 'comparison'
          }
        ]
      };
    }
    
    console.log('💡 Generated ideas:', ideasData);
    
    // Save content ideas to database (optional, skip if fails)
    try {
      for (const idea of ideasData.ideas || []) {
        if (idea.title && idea.description) {
          await prisma.contentIdea.create({
            data: {
              title: idea.title,
              description: idea.description,
              keywords: JSON.stringify(idea.keywords || keywords.slice(0, 3)),
              category: idea.category || 'general',
            },
          });
        }
      }
      console.log('✅ Ideas saved to database');
    } catch (dbError) {
      console.warn('⚠️ Database save failed (non-critical):', dbError);
      // Don't fail the request if database save fails
    }
    
    return NextResponse.json(ideasData);
  } catch (error) {
    console.error('❌ Content ideas error:', error);
    
    // Return fallback content ideas even if there's an error
    const { keywords = ['content'], industry = 'general', audience = 'readers' } = await request.json().catch(() => ({}));
    
    const fallbackIdeas = {
      ideas: [
        {
          title: `Ultimate Guide to ${keywords[0] || 'Content Marketing'}`,
          description: `Everything you need to know about ${keywords[0] || 'content marketing'} in ${industry}.`,
          keywords: keywords.slice(0, 3),
          category: 'guide'
        },
        {
          title: `5 Common ${keywords[0] || 'Marketing'} Mistakes to Avoid`,
          description: `Learn from these common pitfalls and improve your ${keywords[0] || 'marketing'} strategy.`,
          keywords: keywords.slice(0, 3),
          category: 'listicle'
        }
      ]
    };
    
    return NextResponse.json(fallbackIdeas);
  }
}
