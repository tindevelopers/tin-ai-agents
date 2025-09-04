
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { niche, keywords, difficulty } = await request.json();

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
            content: 'You are a content planning expert. Generate specific, engaging topic suggestions with unique angles. Return ONLY valid JSON: {"topics": [{"topic": "string", "angle": "string", "targetKeywords": ["string"], "estimatedLength": "string", "difficulty": "easy|medium|hard"}]}'
          },
          {
            role: 'user',
            content: `Generate 8-10 specific topic suggestions for: Niche: ${niche}, Target Keywords: ${keywords?.join?.(', ') || 'general'}, Difficulty Level: ${difficulty || 'medium'}`
          }
        ],
        response_format: { type: "json_object" },
        stream: false,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    const topicsData = JSON.parse(data?.choices?.[0]?.message?.content || '{"topics": []}');
    
    return NextResponse.json(topicsData);
  } catch (error) {
    console.error('Topic suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate topic suggestions' },
      { status: 500 }
    );
  }
}
