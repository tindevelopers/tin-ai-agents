
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs'; // Edge runtime cannot open TCP sockets (Prisma won't work)

export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json();

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
            content: 'You are an expert SEO specialist. Analyze keywords and group them into logical clusters based on search intent and semantic similarity. Return ONLY valid JSON: {"clusters": [{"name": "string", "keywords": ["string"], "description": "string"}]}'
          },
          {
            role: 'user',
            content: `Cluster these keywords into 3-5 logical groups: ${keywords.join(', ')}`
          }
        ],
        response_format: { type: "json_object" },
        stream: false,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    const clusterData = JSON.parse(data?.choices?.[0]?.message?.content || '{"clusters": []}');
    
    // Return clustering results without auto-saving
    return NextResponse.json(clusterData);
  } catch (error) {
    console.error('Keywords cluster error:', error);
    return NextResponse.json(
      { error: 'Failed to cluster keywords' },
      { status: 500 }
    );
  }
}
