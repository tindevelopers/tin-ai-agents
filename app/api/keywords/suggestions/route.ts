
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { keyword, location_name = 'United States', language_code = 'en', limit = 10 } = await request.json();

    if (!keyword?.trim()) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 AI Blog Writer API: Getting keyword suggestions for "${keyword}"`);

    // Call the external AI Blog Writer API for keyword suggestions
    const response = await fetch('https://api-ai-blog-writer-dev-kq42l26tuq-od.a.run.app/api/v1/keywords/suggest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword,
        location_name,
        language_code,
        limit
      }),
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    
    console.log(`✅ AI Blog Writer API: Found ${data.keyword_suggestions?.length || 0} keyword suggestions`);
    
    // Transform the response to match our expected format
    const suggestions = data.keyword_suggestions?.map((item: any) => ({
      keyword: item.keyword || item,
      search_volume: item.search_volume || 0,
      competition: item.competition || 'unknown',
      cpc: item.cpc || 0
    })) || [];
    
    return NextResponse.json({ 
      suggestions,
      source: 'AI-Blog-Writer-API',
      total: suggestions.length,
      keyword,
      location_name,
      language_code
    });
  } catch (error) {
    console.error('❌ AI Blog Writer Keyword suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keyword suggestions' },
      { status: 500 }
    );
  }
}
