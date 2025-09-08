
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

    console.log(`🔍 DataForSEO API: Getting autocomplete keywords for "${keyword}"`);

    // Get autocomplete keywords
    const autocomplete = await dataForSEO.getAutocompleteKeywords(keyword, locationCode, languageCode);
    const transformedAutocomplete = dataForSEO.transformToAppFormat(autocomplete);
    
    console.log(`✅ DataForSEO API: Found ${transformedAutocomplete.length} autocomplete suggestions`);
    
    return NextResponse.json({ 
      autocompleteKeywords: transformedAutocomplete,
      source: 'DataForSEO-Autocomplete',
      total: transformedAutocomplete.length,
      keyword,
      locationCode,
      languageCode
    });
  } catch (error) {
    console.error('❌ DataForSEO Autocomplete keywords error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch autocomplete keywords' },
      { status: 500 }
    );
  }
}
