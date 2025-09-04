
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Environment variables debug check');
    
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 20) || 'EMPTY',
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
      ABACUSAI_API_KEY: process.env.ABACUSAI_API_KEY ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV || 'NOT_VERCEL'
    };

    console.log('Environment variables status:', envVars);

    return NextResponse.json({
      status: 'debug',
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Debug check failed:', error);
    return NextResponse.json(
      { 
        status: 'debug-failed',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
