import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: Request) {
  console.log('🧪 Testing raw error handling...');
  
  try {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    
    // Create a test image buffer (1x1 transparent PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    
    const testFilename = `raw-error-test-${Date.now()}.png`;
    
    // Use the exact same options as the abstraction layer
    const uploadOptions = {
      folder: 'ai-blog-writer/debug',
      tags: ['debug', 'abstraction-test'],
      resource_type: 'image' as const,
      public_id: testFilename.replace(/\.[^/.]+$/, ''), // Remove file extension
      overwrite: true
    };

    console.log('🔍 Raw error test upload options:', uploadOptions);

    // Test upload with raw error handling
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ RAW ERROR:', error);
            console.error('❌ RAW ERROR TYPE:', typeof error);
            console.error('❌ RAW ERROR CONSTRUCTOR:', error?.constructor?.name);
            console.error('❌ RAW ERROR MESSAGE:', error?.message);
            console.error('❌ RAW ERROR STACK:', error?.stack);
            console.error('❌ RAW ERROR TO STRING:', error?.toString());
            reject(error);
          } else {
            console.log('✅ RAW SUCCESS:', result);
            resolve(result);
          }
        }
      ).end(testImageBuffer);
    });

    return NextResponse.json({
      success: true,
      message: 'Raw error test successful',
      upload: result
    });
    
  } catch (error) {
    console.error('❌ Raw error test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Raw error test failed',
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
