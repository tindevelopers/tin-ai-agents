import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Stability AI API directly...');

    // Check environment variables
    const stabilityApiKey = process.env.STABILITY_AI_API_KEY;
    if (!stabilityApiKey) {
      return NextResponse.json({
        success: false,
        error: 'STABILITY_AI_API_KEY environment variable not found'
      }, { status: 500 });
    }

    console.log('✅ Stability AI API key found:', stabilityApiKey.substring(0, 10) + '...');

    // Test the Stability AI API directly
    const STABILITY_API_HOST = 'https://api.stability.ai';
    
    const stabilityRequest = {
      text_prompts: [
        {
          text: 'A simple test image: blue sky with white clouds',
          weight: 1
        }
      ],
      cfg_scale: 7,
      height: 512,
      width: 512,
      samples: 1,
      steps: 20,
      style_preset: 'photographic'
    };

    console.log('🔄 Making request to Stability AI...');
    const response = await fetch(`${STABILITY_API_HOST}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${stabilityApiKey}`,
      },
      body: JSON.stringify(stabilityRequest),
    });

    const responseText = await response.text();
    console.log('🔄 Stability AI response status:', response.status);
    console.log('🔄 Stability AI response:', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('❌ StabilityAI API error:', response.status, responseText);
      return NextResponse.json({
        success: false,
        error: `Stability AI API error: ${response.status}`,
        details: responseText,
        api_key_provided: !!stabilityApiKey,
        api_key_preview: stabilityApiKey.substring(0, 10) + '...'
      }, { status: 500 });
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse Stability AI response',
        details: responseText
      }, { status: 500 });
    }

    console.log('✅ Stability AI test successful!');

    return NextResponse.json({
      success: true,
      message: 'Stability AI API test successful',
      response_status: response.status,
      images_generated: responseData.artifacts ? responseData.artifacts.length : 0,
      api_key_provided: !!stabilityApiKey,
      api_key_preview: stabilityApiKey.substring(0, 10) + '...'
    });

  } catch (error) {
    console.error('❌ Stability AI test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Stability AI test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
