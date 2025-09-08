import { NextResponse } from 'next/server';
import { CloudinaryProvider } from '@/lib/image-storage';

export async function POST(request: Request) {
  console.log('🧪 Testing CloudinaryProvider directly...');
  
  try {
    // Create a test image buffer (1x1 transparent PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    
    const testFilename = `provider-direct-test-${Date.now()}.png`;
    
    // Create CloudinaryProvider directly
    const provider = new CloudinaryProvider();
    console.log('🔍 Provider created:', provider.constructor.name);
    console.log('🔍 Provider configured:', (provider as any).isConfigured);
    
    // Test upload using the provider directly
    const uploadResult = await provider.upload(testImageBuffer, testFilename, {
      folder: 'ai-blog-writer/debug',
      tags: ['debug', 'provider-direct-test']
    });
    
    console.log('✅ Provider direct upload successful:', uploadResult);
    
    return NextResponse.json({
      success: true,
      message: 'Provider direct upload successful',
      upload: uploadResult
    });
    
  } catch (error) {
    console.error('❌ Provider direct upload failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Provider direct upload failed',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        rawError: error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      },
      { status: 500 }
    );
  }
}
