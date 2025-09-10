import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { api_token } = await request.json();

    if (!api_token) {
      return NextResponse.json({ error: 'API token is required' }, { status: 400 });
    }

    // Call Webflow API to get sites
    const response = await fetch('https://api.webflow.com/sites', {
      headers: {
        'Authorization': `Bearer ${api_token}`,
        'Accept': 'application/json',
        'Accept-Version': '1.0.0'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ 
        error: `Webflow API error: ${errorData.msg || response.statusText}` 
      }, { status: response.status });
    }

    const sites = await response.json();
    
    return NextResponse.json({ 
      success: true, 
      sites: sites || [] 
    });

  } catch (error) {
    console.error('Error fetching Webflow sites:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Webflow sites' 
    }, { status: 500 });
  }
}
