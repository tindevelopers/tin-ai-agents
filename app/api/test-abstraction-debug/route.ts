import { NextResponse } from 'next/server';
import { getImageStorageProvider } from '@/lib/image-storage';

export async function POST(request: Request) {
  console.log('🔍 Debugging abstraction layer...');
  
  try {
    // Create a test image buffer (1x1 transparent PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    
    const testFilename = `debug-test-${Date.now()}.png`;
    
    // Get the provider directly
    const provider = getImageStorageProvider();
    console.log('Provider type:', provider.constructor.name);
    
    // Test upload with minimal options
    const uploadResult = await provider.upload(testImageBuffer, testFilename, {
      folder: 'ai-blog-writer/debug',
      tags: ['debug', 'abstraction-test']
    });
    
    console.log('✅ Debug upload successful:', uploadResult);
    
    return NextResponse.json({
      success: true,
      message: 'Debug upload successful',
      provider: provider.constructor.name,
      upload: uploadResult
    });
    
  } catch (error) {
    console.error('❌ Debug upload failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Debug upload failed',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        rawError: error
      },
      { status: 500 }
    );
  }
}
