
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { mainKeyword, secondaryKeywords, contentType, targetAudience } = await request.json();

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
            content: 'You are an expert content strategist and SEO specialist. Create comprehensive content strategies with actionable recommendations. Return ONLY valid JSON: {"strategy": {"mainKeyword": "string", "secondaryKeywords": ["string"], "contentType": "string", "targetAudience": "string", "contentStructure": ["string"], "seoTips": ["string"], "wordCount": "string", "tone": "string"}}'
          },
          {
            role: 'user',
            content: `Create a detailed content strategy for: Main Keyword: "${mainKeyword}", Secondary Keywords: ${secondaryKeywords?.join?.(', ') || 'none'}, Content Type: ${contentType || 'blog post'}, Target Audience: ${targetAudience || 'general'}`
          }
        ],
        response_format: { type: "json_object" },
        stream: false,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    const strategyData = JSON.parse(data?.choices?.[0]?.message?.content || '{"strategy": {}}');
    
    return NextResponse.json(strategyData);
  } catch (error) {
    console.error('Content strategy error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content strategy' },
      { status: 500 }
    );
  }
}
