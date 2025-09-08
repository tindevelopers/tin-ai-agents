
import { NextRequest, NextResponse } from 'next/server';
import { dataForSEO } from '@/lib/dataforseo';

export async function POST(request: NextRequest) {
  let query = '';
  let niche = '';
  
  try {
    const requestData = await request.json();
    query = requestData.query;
    niche = requestData.niche;

    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 DataForSEO API: Searching keywords for "${query}" in niche: "${niche || 'general'}"`);

    // Use DataForSEO to get real keyword data
    const keywords = await dataForSEO.performComprehensiveKeywordResearch(query, niche);
    
    console.log(`✅ DataForSEO API: Found ${keywords.length} keywords`);
    
    return NextResponse.json({ 
      keywords,
      source: 'DataForSEO',
      total: keywords.length,
      query,
      niche: niche || 'general'
    });
  } catch (error) {
    console.error('❌ DataForSEO Keywords search error:', error);
    
    // Fallback to AI-generated keywords if DataForSEO fails
    console.log('🔄 Falling back to AI-generated keywords due to DataForSEO error');
    
    try {
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
              content: `Generate 20-25 relevant keywords for the query: "${query}" in the niche: "${niche || 'general'}". Include long-tail keywords and related terms with realistic search volumes.`
            }
          ],
          response_format: { type: "json_object" },
          stream: false,
          max_tokens: 2000,
        }),
      });

      const data = await response.json();
      const keywordData = JSON.parse(data?.choices?.[0]?.message?.content || '{"keywords": []}');
      
      console.log(`✅ Fallback AI: Generated ${keywordData.keywords?.length || 0} keywords`);
      
      return NextResponse.json({
        ...keywordData,
        source: 'AI-Generated (DataForSEO fallback)',
        warning: 'DataForSEO API temporarily unavailable, using AI-generated estimates'
      });
    } catch (fallbackError) {
      console.error('❌ Fallback AI keyword generation also failed:', fallbackError);
      return NextResponse.json(
        { error: 'Both DataForSEO and AI fallback failed. Please try again.' },
        { status: 500 }
      );
    }
  }
}
