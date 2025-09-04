
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Environment variables debug check');
    
    const databaseUrl = process.env.DATABASE_URL;
    let urlAnalysis = 'NOT_SET';
    
    if (databaseUrl) {
      try {
        const url = new URL(databaseUrl);
        urlAnalysis = {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port,
          pathname: url.pathname,
          username: url.username,
          hasPassword: !!url.password,
          passwordLength: url.password?.length || 0,
          fullLength: databaseUrl.length,
          startsWithPostgres: databaseUrl.startsWith('postgresql://'),
          containsSpecialChars: /[!@#$%^&*()+=\[\]{}|\\:";'<>?,./]/.test(url.password || ''),
        };
      } catch (e) {
        urlAnalysis = `INVALID_URL: ${String(e)}`;
      }
    }
    
    const envVars = {
      DATABASE_URL: databaseUrl ? 'SET' : 'MISSING',
      DATABASE_URL_ANALYSIS: urlAnalysis,
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
