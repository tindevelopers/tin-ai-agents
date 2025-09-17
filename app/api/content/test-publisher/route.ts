import { NextRequest, NextResponse } from 'next/server';
import { externalAPIClient, AIContent } from '@/lib/external-api-client';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing AI Content Publisher SDK integration...');

    // Test content
    const testContent: AIContent = {
      type: 'blog',
      title: 'Test Blog Post - AI Content Publisher Integration',
      content: `
        <h2>Testing AI Content Publisher SDK</h2>
        <p>This is a test blog post to verify that our AI Content Publisher SDK integration is working correctly.</p>
        
        <h3>Features Tested:</h3>
        <ul>
          <li>Content validation</li>
          <li>Platform configuration</li>
          <li>Publishing workflow</li>
        </ul>
        
        <p>This post demonstrates the successful integration of the AI Content Publisher SDK with our blog writer application.</p>
      `,
      excerpt: 'Testing the AI Content Publisher SDK integration with a sample blog post.',
      tags: ['AI', 'Content Publishing', 'SDK', 'Testing'],
      categories: ['Technology', 'Development'],
      status: 'draft',
      seo: {
        metaTitle: 'Test Blog Post - AI Content Publisher Integration',
        metaDescription: 'Testing the AI Content Publisher SDK integration with our blog application.',
        keywords: ['ai content publisher', 'sdk', 'blog publishing', 'automation']
      }
    };

    // Initialize External API Client
    const publisher = externalAPIClient;

    // Test content validation
    console.log('✅ Testing content validation...');
    const validation = await publisher.validateContent(testContent);
    
    console.log('📊 Validation result:', {
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings?.length || 0
    });

    // Test configuration capabilities
    console.log('🔧 Testing configuration capabilities...');
    
    const configurationTest = {
      canConfigureWebflow: typeof publisher.configureWebflow === 'function',
      canConfigureSocialMedia: typeof publisher.configureSocialMedia === 'function',
      hasValidationMethod: typeof publisher.validateContent === 'function',
      hasPublishContentMethod: typeof publisher.publishContent === 'function',
      hasPublishToWebflowMethod: typeof publisher.publishToWebflow === 'function'
    };

    // Test SDK methods existence
    const sdkMethods = {
      configureWebflow: typeof publisher.configureWebflow,
      configureSocialMedia: typeof publisher.configureSocialMedia,
      validateContent: typeof publisher.validateContent,
      publishContent: typeof publisher.publishContent,
      publishToWebflow: typeof publisher.publishToWebflow,
      publishToSocialMedia: typeof publisher.publishToSocialMedia
    };

    console.log('✅ AI Content Publisher SDK integration test completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'AI Content Publisher SDK integration test completed successfully',
      testResults: {
        validation: {
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings
        },
        configuration: configurationTest,
        sdkMethods,
        testContent: {
          title: testContent.title,
          type: testContent.type,
          hasContent: !!testContent.content,
          tagCount: testContent.tags?.length || 0,
          categoryCount: testContent.categories?.length || 0,
          hasSEO: !!testContent.seo
        }
      },
      supportedPlatforms: ['webflow', 'wordpress'],
      supportedContentTypes: ['blog', 'faq', 'article', 'product-description', 'landing-page'],
      sdkVersion: '1.0.0-custom',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Content Publisher SDK test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'SDK integration test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType = 'validation', content } = body;

    console.log('🧪 Running AI Content Publisher test:', testType);

    const publisher = externalAPIClient;

    if (testType === 'validation' && content) {
      const validation = await publisher.validateContent(content);
      
      return NextResponse.json({
        success: true,
        testType: 'validation',
        result: validation
      });
    }

    if (testType === 'mock-publish' && content) {
      // Mock publish test (doesn't actually publish)
      const validation = await publisher.validateContent(content);
      
      if (!validation.isValid) {
        return NextResponse.json({
          success: false,
          testType: 'mock-publish',
          error: 'Content validation failed',
          validation
        });
      }

      // Simulate publishing without actual API calls
      const mockResults = {
        webflow: {
          success: true,
          message: 'Mock publish to Webflow successful',
          contentId: 'mock-webflow-id-' + Date.now(),
          url: 'https://example.webflow.io/mock-post'
        },
        wordpress: {
          success: true,
          message: 'Mock publish to WordPress successful',
          contentId: 'mock-wp-id-' + Date.now(),
          url: 'https://example.com/mock-post'
        }
      };

      return NextResponse.json({
        success: true,
        testType: 'mock-publish',
        results: mockResults,
        validation
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid test type or missing content',
      supportedTestTypes: ['validation', 'mock-publish']
    }, { status: 400 });

  } catch (error) {
    console.error('❌ AI Content Publisher POST test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'SDK test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
