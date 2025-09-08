import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: Request) {
  console.log('🧪 Testing direct Cloudinary upload with same options as abstraction layer...');
  
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
    
    const testFilename = `direct-test-${Date.now()}.png`;
    
    // Use the exact same options as the abstraction layer
    const uploadOptions = {
      folder: 'ai-blog-writer/debug',
      tags: ['debug', 'abstraction-test'],
      resource_type: 'image',
      public_id: testFilename.replace(/\.[^/.]+$/, ''), // Remove file extension
      overwrite: true
    };

    console.log('🔍 Direct upload options:', uploadOptions);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ Direct Cloudinary upload_stream error:', error);
            reject(error);
          } else {
            console.log('✅ Direct Cloudinary upload_stream success:', result);
            resolve(result);
          }
        }
      ).end(testImageBuffer);
    });

    return NextResponse.json({
      success: true,
      message: 'Direct Cloudinary upload successful',
      upload: result
    });
    
  } catch (error) {
    console.error('❌ Direct upload failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Direct upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
