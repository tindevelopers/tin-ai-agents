
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('🧪 Testing StabilityAI with prompt:', prompt.substring(0, 100) + '...');

    // Test the asset-retrieval endpoint
    const testTask = `Generate a realistic, natural-looking image using this detailed prompt:

${prompt}

Additional requirements:
- Aspect ratio: 16:9
- Quality: High resolution, web-optimized
- Style: Natural, realistic photography (not AI-generated looking)
- Purpose: Blog header image

Save the generated image with filename: test-stability-${Date.now()}.jpg`;

    const result = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/asset-retrieval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: testTask,
        context: 'Testing StabilityAI integration'
      }),
    });

    const data = await result.json();

    return NextResponse.json({
      success: true,
      test_result: data,
      status: result.status,
      stability_available: !!process.env.STABILITY_AI_API_KEY
    });

  } catch (error) {
    console.error('❌ StabilityAI test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stability_available: !!process.env.STABILITY_AI_API_KEY
    }, { status: 500 });
  }
}
