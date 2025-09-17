import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { externalAPIClient, AIContent } from '@/lib/external-api-client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, platforms } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform is required' },
        { status: 400 }
      );
    }

    // Transform the content to AIContent format if needed
    const aiContent: AIContent = {
      type: content.type || 'blog',
      title: content.title,
      content: content.content,
      excerpt: content.excerpt,
      tags: content.tags || [],
      categories: content.categories || [],
      status: content.status || 'draft',
      seo: content.seo,
      images: content.images,
      socialPlatforms: platforms,
      hashtags: content.hashtags || content.tags || []
    };

    // Test content for all specified platforms
    const testResults = [];
    
    for (const platform of platforms) {
      try {
        const result = await externalAPIClient.testContentForPlatform(aiContent, platform);
        testResults.push(result);
      } catch (error) {
        testResults.push({
          platform,
          isCompatible: false,
          score: 0,
          issues: [error instanceof Error ? error.message : 'Unknown error'],
          suggestions: ['Check platform configuration and try again']
        });
      }
    }

    // Calculate overall compatibility
    const compatiblePlatforms = testResults.filter(r => r.isCompatible);
    const averageScore = testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length;
    
    // Get best platforms (score > 70 and compatible)
    const bestPlatforms = testResults
      .filter(r => r.isCompatible && r.score > 70)
      .sort((a, b) => b.score - a.score)
      .map(r => r.platform);

    // Collect all issues and suggestions
    const allIssues = testResults.flatMap(r => r.issues);
    const allSuggestions = [...new Set(testResults.flatMap(r => r.suggestions))];

    return NextResponse.json({
      success: true,
      results: testResults,
      summary: {
        total_platforms: platforms.length,
        compatible_platforms: compatiblePlatforms.length,
        average_score: Math.round(averageScore),
        best_platforms: bestPlatforms,
        overall_compatible: compatiblePlatforms.length > 0,
        needs_optimization: averageScore < 80
      },
      recommendations: {
        issues: allIssues,
        suggestions: allSuggestions,
        optimization_needed: averageScore < 80,
        ready_to_publish: compatiblePlatforms.length > 0 && averageScore >= 70
      }
    });

  } catch (error) {
    console.error('Content testing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

