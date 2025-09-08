
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

    console.log(`🔍 DataForSEO API: Getting related keywords for "${keyword}"`);

    // Get related keywords specifically
    const related = await dataForSEO.getRelatedKeywords(keyword, locationCode, languageCode);
    const transformedRelated = dataForSEO.transformToAppFormat(related);
    
    console.log(`✅ DataForSEO API: Found ${transformedRelated.length} related keywords`);
    
    return NextResponse.json({ 
      relatedKeywords: transformedRelated,
      source: 'DataForSEO-Related',
      total: transformedRelated.length,
      keyword,
      locationCode,
      languageCode
    });
  } catch (error) {
    console.error('❌ DataForSEO Related keywords error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related keywords' },
      { status: 500 }
    );
  }
}
