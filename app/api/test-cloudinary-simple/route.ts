import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';

// Configure Cloudinary directly
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing direct Cloudinary upload...');

    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    const testFilename = `test-direct-${Date.now()}.png`;

    // Simple upload with minimal options
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'ai-blog-writer/test',
          public_id: testFilename.replace('.png', ''),
          overwrite: true
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(testImageBuffer);
    });

    console.log('✅ Direct Cloudinary upload successful:', result);

    return NextResponse.json({
      success: true,
      message: 'Direct Cloudinary upload successful',
      result: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        format: result.format,
        bytes: result.bytes
      }
    });

  } catch (error) {
    console.error('❌ Direct Cloudinary upload error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Direct Cloudinary upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
