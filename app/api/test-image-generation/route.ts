import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing complete image generation pipeline...');

    // Test the create-images API with simple data
    const testImageSuggestions = [
      {
        type: 'featured',
        imageTitle: 'Test Featured Image',
        imageSlug: 'test-featured',
        altText: 'A test featured image for debugging',
        description: 'Simple test image to verify generation pipeline',
        placement: 'top'
      }
    ];

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/create-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageSuggestions: testImageSuggestions,
        blogTitle: 'Test Blog Post',
      }),
    });

    const result = await response.json();
    
    console.log('📊 Image generation test result:', result);

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Image generation test completed',
        result: result,
        pipeline_working: result.success && result.images && result.images.length > 0
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Image generation test failed',
        error: result,
        pipeline_working: false
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Image generation test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Image generation test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      pipeline_working: false
    }, { status: 500 });
  }
}
