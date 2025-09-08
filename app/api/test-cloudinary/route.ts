import { NextRequest, NextResponse } from 'next/server';
import { getImageStorageProvider } from '@/lib/image-storage';
import { imageService } from '@/lib/image-utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Cloudinary integration...');

    // Check environment variables
    const hasCloudinaryConfig = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    const provider = getImageStorageProvider();
    const providerType = provider.constructor.name;

    // Test configuration
    const testResult = {
      timestamp: new Date().toISOString(),
      cloudinary_configured: hasCloudinaryConfig,
      provider_type: providerType,
      environment_variables: {
        CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
      },
      status: hasCloudinaryConfig ? 'ready' : 'fallback_mode'
    };

    console.log('✅ Cloudinary test result:', testResult);

    return NextResponse.json({
      success: true,
      message: 'Cloudinary integration test completed',
      result: testResult
    });

  } catch (error) {
    console.error('❌ Cloudinary test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Cloudinary test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testUpload = false } = await request.json();

    if (!testUpload) {
      return NextResponse.json({
        success: false,
        error: 'Set testUpload: true to test image upload'
      }, { status: 400 });
    }

    console.log('🧪 Testing Cloudinary image upload...');

    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    const testFilename = `test-upload-${Date.now()}.png`;

    try {
      const uploadResult = await imageService.uploadImage(testImageBuffer, testFilename, {
        folder: 'ai-blog-writer/test-uploads',
        tags: ['test', 'integration-test']
      });

      console.log('✅ Test upload successful:', uploadResult);

      return NextResponse.json({
        success: true,
        message: 'Test upload successful',
        upload_result: uploadResult,
        optimized_urls: {
          thumbnail: imageService.getThumbnailUrl(uploadResult.publicId),
          featured: imageService.getFeaturedImageUrl(uploadResult.publicId),
          responsive: imageService.getResponsiveImageUrls(uploadResult.publicId)
        }
      });

    } catch (uploadError) {
      console.error('❌ Test upload failed:', uploadError);
      
      return NextResponse.json({
        success: false,
        error: 'Test upload failed',
        details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Cloudinary test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Cloudinary test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
