
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return NextResponse.json({
        error: 'DATABASE_URL is not set',
        solution: 'Set DATABASE_URL in Vercel environment variables'
      });
    }

    // Analyze the current URL
    let analysis;
    try {
      const url = new URL(databaseUrl);
      analysis = {
        isValid: true,
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 'default',
        pathname: url.pathname,
        username: url.username,
        hasPassword: !!url.password,
        passwordLength: url.password?.length || 0
      };
    } catch (e) {
      analysis = {
        isValid: false,
        error: String(e),
        rawUrl: databaseUrl.substring(0, 50) + '...'
      };
    }

    // Provide correct format examples
    const examples = {
      supabase: "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres",
      supabaseWithPooling: "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:6543/postgres?pgbouncer=true",
      noteAboutSpecialChars: "If your password contains special characters like @#$%^&*, you need to URL encode them"
    };

    const urlEncodingGuide = {
      "@": "%40",
      "#": "%23", 
      "$": "%24",
      "%": "%25",
      "^": "%5E",
      "&": "%26",
      "*": "%2A",
      "+": "%2B",
      "=": "%3D",
      " ": "%20"
    };

    return NextResponse.json({
      status: 'url-analysis',
      currentUrl: analysis,
      examples,
      urlEncodingGuide,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Analysis failed',
      details: String(error)
    }, { status: 500 });
  }
}
