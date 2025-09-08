
import { NextRequest, NextResponse } from 'next/server';
import { dataForSEO } from '@/lib/dataforseo';

export async function POST(request: NextRequest) {
  try {
    const { keyword, locationCode = 2840, languageCode = 'en' } = await request.json();

    if (!keyword?.trim()) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 DataForSEO API: Getting keyword suggestions for "${keyword}"`);

    // Get keyword suggestions specifically
    const suggestions = await dataForSEO.getKeywordSuggestions(keyword, locationCode, languageCode);
    const transformedSuggestions = dataForSEO.transformToAppFormat(suggestions);
    
    console.log(`✅ DataForSEO API: Found ${transformedSuggestions.length} keyword suggestions`);
    
    return NextResponse.json({ 
      suggestions: transformedSuggestions,
      source: 'DataForSEO-Suggestions',
      total: transformedSuggestions.length,
      keyword,
      locationCode,
      languageCode
    });
  } catch (error) {
    console.error('❌ DataForSEO Keyword suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keyword suggestions' },
      { status: 500 }
    );
  }
}
