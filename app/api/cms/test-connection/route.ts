import { NextRequest, NextResponse } from 'next/server';
import { WebflowPublisher } from '@/lib/cms-publishers/webflow';

export async function POST(request: NextRequest) {
  try {
    const { platform_type, api_credentials, site_id, collection_id } = await request.json();

    if (!platform_type) {
      return NextResponse.json(
        { success: false, message: 'Platform type is required' },
        { status: 400 }
      );
    }

    if (platform_type === 'webflow') {
      if (!api_credentials?.api_token) {
        return NextResponse.json(
          { success: false, message: 'Webflow API token is required' },
          { status: 400 }
        );
      }

      // Create a test configuration
      const testConfig = {
        api_credentials: JSON.stringify(api_credentials), // WebflowPublisher expects encrypted string
        site_id: site_id || api_credentials.site_id,
        collection_id: collection_id || api_credentials.collection_id,
        field_mappings: {
          title: 'name',
          content: 'content',
          slug: 'slug'
        },
        publishing_rules: {
          auto_publish: false,
          base_url: ''
        }
      };

      try {
        // For testing, we'll directly call the Webflow API instead of using the publisher
        // since the publisher expects encrypted credentials
        const { api_token, site_id: testSiteId } = api_credentials;
        
        if (!testSiteId) {
          return NextResponse.json(
            { success: false, message: 'Site ID is required for connection test' },
            { status: 400 }
          );
        }

        // Test connection by fetching site info
        const response = await fetch(`https://api.webflow.com/sites/${testSiteId}`, {
          headers: {
            'Authorization': `Bearer ${api_token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return NextResponse.json({
            success: false,
            message: `Webflow API error: ${errorData.msg || response.statusText}`
          });
        }

        const siteData = await response.json();
        
        // If collection_id is provided, test collection access too
        if (api_credentials.collection_id) {
          const collectionResponse = await fetch(
            `https://api.webflow.com/collections/${api_credentials.collection_id}`,
            {
              headers: {
                'Authorization': `Bearer ${api_token}`,
                'Accept': 'application/json'
              }
            }
          );

          if (!collectionResponse.ok) {
            const errorData = await collectionResponse.json().catch(() => ({}));
            return NextResponse.json({
              success: false,
              message: `Collection access error: ${errorData.msg || collectionResponse.statusText}`
            });
          }

          const collectionData = await collectionResponse.json();
          
          return NextResponse.json({
            success: true,
            message: `Successfully connected to site "${siteData.name}" and collection "${collectionData.name}"`,
            details: {
              site: {
                name: siteData.name,
                shortName: siteData.shortName,
                domains: siteData.domains
              },
              collection: {
                name: collectionData.name,
                slug: collectionData.slug,
                singularName: collectionData.singularName
              }
            }
          });
        }

        return NextResponse.json({
          success: true,
          message: `Successfully connected to Webflow site: ${siteData.name}`,
          details: {
            site: {
              name: siteData.name,
              shortName: siteData.shortName,
              domains: siteData.domains
            }
          }
        });

      } catch (error) {
        console.error('Webflow connection test error:', error);
        return NextResponse.json({
          success: false,
          message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    // Add support for other CMS platforms here
    return NextResponse.json(
      { success: false, message: `Platform "${platform_type}" is not supported yet` },
      { status: 400 }
    );

  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to test connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
