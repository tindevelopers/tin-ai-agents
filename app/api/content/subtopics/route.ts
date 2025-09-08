
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

    console.log(`🔍 DataForSEO API: Generating sub-topics for "${keyword}"`);

    // Get sub-topics for content generation
    const subTopics = await dataForSEO.generateSubTopics(keyword, locationCode, languageCode);
    
    console.log(`✅ DataForSEO API: Found ${subTopics.length} sub-topics`);
    
    return NextResponse.json({ 
      subTopics,
      source: 'DataForSEO-SubTopics',
      total: subTopics.length,
      keyword,
      locationCode,
      languageCode
    });
  } catch (error) {
    console.error('❌ DataForSEO Sub-topics generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sub-topics' },
      { status: 500 }
    );
  }
}
