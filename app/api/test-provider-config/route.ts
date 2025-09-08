import { NextResponse } from 'next/server';
import { getImageStorageProvider } from '@/lib/image-storage';

export async function POST(request: Request) {
  console.log('🔍 Testing provider configuration...');
  
  try {
    // Check environment variables
    const envCheck = {
      CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
      values: {
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '***' : undefined,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '***' : undefined,
      }
    };
    
    console.log('🔍 Environment check:', envCheck);
    
    // Get the provider
    const provider = getImageStorageProvider();
    console.log('🔍 Provider type:', provider.constructor.name);
    
    // Check if it's configured
    const isConfigured = (provider as any).isConfigured;
    console.log('🔍 Provider configured:', isConfigured);
    
    return NextResponse.json({
      success: true,
      message: 'Provider configuration test completed',
      environment: envCheck,
      provider: {
        type: provider.constructor.name,
        configured: isConfigured
      }
    });
    
  } catch (error) {
    console.error('❌ Provider config test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Provider config test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
