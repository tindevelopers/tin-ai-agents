
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, niche } = await request.json();

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
            content: 'You are an expert SEO keyword researcher. Generate relevant keywords with search volume estimates, difficulty scores (1-10), and relevance scores (1-10). Return ONLY valid JSON in the following format: {"keywords": [{"keyword": "string", "searchVolume": number, "difficulty": number, "relevance": number}]}'
          },
          {
            role: 'user',
            content: `Generate 15-20 relevant keywords for the query: "${query}" in the niche: "${niche || 'general'}". Include long-tail keywords and related terms.`
          }
        ],
        response_format: { type: "json_object" },
        stream: false,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    const keywordData = JSON.parse(data?.choices?.[0]?.message?.content || '{"keywords": []}');
    
    return NextResponse.json(keywordData);
  } catch (error) {
    console.error('Keywords search error:', error);
    return NextResponse.json(
      { error: 'Failed to search keywords' },
      { status: 500 }
    );
  }
}
