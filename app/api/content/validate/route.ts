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
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
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
      faqs: content.faqs,
      specifications: content.specifications,
      ctaText: content.ctaText,
      ctaUrl: content.ctaUrl,
      socialPlatforms: content.socialPlatforms,
      socialContent: content.socialContent,
      hashtags: content.hashtags || content.tags || [],
      mentions: content.mentions
    };

    // Validate the content using external API
    const validationResult = await externalAPIClient.validateContent(aiContent);

    // Categorize issues by severity
    const criticalErrors = validationResult.errors.filter(e => 
      ['REQUIRED_FIELD', 'MISSING_FAQS'].includes(e.code || '')
    );
    
    const minorErrors = validationResult.errors.filter(e => 
      !['REQUIRED_FIELD', 'MISSING_FAQS'].includes(e.code || '')
    );

    const seoWarnings = validationResult.warnings?.filter(w => 
      w.field.startsWith('seo.') || ['MISSING_SEO', 'MISSING_META_TITLE', 'MISSING_META_DESCRIPTION'].includes(w.code || '')
    ) || [];

    const contentWarnings = validationResult.warnings?.filter(w => 
      !w.field.startsWith('seo.') && !['MISSING_SEO', 'MISSING_META_TITLE', 'MISSING_META_DESCRIPTION'].includes(w.code || '')
    ) || [];

    // Calculate content quality score
    let qualityScore = 100;
    
    // Deduct points for errors
    qualityScore -= criticalErrors.length * 25;
    qualityScore -= minorErrors.length * 10;
    qualityScore -= seoWarnings.length * 5;
    qualityScore -= contentWarnings.length * 3;

    // Ensure score doesn't go below 0
    qualityScore = Math.max(0, qualityScore);

    // Determine readiness for publishing
    const readyToPublish = validationResult.isValid && qualityScore >= 70;
    const needsImprovement = qualityScore < 80;

    return NextResponse.json({
      success: true,
      validation: {
        is_valid: validationResult.isValid,
        quality_score: qualityScore,
        ready_to_publish: readyToPublish,
        needs_improvement: needsImprovement
      },
      errors: {
        critical: criticalErrors,
        minor: minorErrors,
        total: validationResult.errors.length
      },
      warnings: {
        seo: seoWarnings,
        content: contentWarnings,
        total: (validationResult.warnings || []).length
      },
      recommendations: {
        priority_fixes: criticalErrors.map(e => e.message),
        seo_improvements: seoWarnings.map(w => w.message),
        content_improvements: contentWarnings.map(w => w.message),
        next_steps: readyToPublish 
          ? ['Content is ready for publishing!']
          : criticalErrors.length > 0
            ? ['Fix critical errors before publishing']
            : ['Consider addressing warnings to improve quality']
      },
      content_analysis: {
        type: aiContent.type,
        title_length: aiContent.title?.length || 0,
        content_length: aiContent.content?.length || 0,
        has_excerpt: !!aiContent.excerpt,
        has_seo: !!aiContent.seo,
        has_images: !!(aiContent.images && aiContent.images.length > 0),
        tag_count: aiContent.tags?.length || 0,
        category_count: aiContent.categories?.length || 0
      }
    });

  } catch (error) {
    console.error('Content validation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to validate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

