
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { imageSuggestions, blogTitle } = await request.json();

    console.log('🎨 Creating images for blog:', { blogTitle, imageCount: imageSuggestions?.length });

    if (!imageSuggestions?.length) {
      return NextResponse.json(
        { error: 'Image suggestions are required' },
        { status: 400 }
      );
    }

    const generatedImages = [];

    // Generate each image using the asset retrieval subtask
    for (let i = 0; i < imageSuggestions.length; i++) {
      const suggestion = imageSuggestions[i];
      
      try {
        console.log(`🖼️ Generating image ${i + 1}:`, suggestion.description);

        // Use the sophisticated realistic prompt from the suggestion
        const aspectRatio = suggestion.aspectRatio || (suggestion.type === 'featured' ? '16:9' : '4:3');
        const imageTask = `Generate a realistic, natural-looking image using this detailed prompt:

${suggestion.prompt}

Additional requirements:
- Aspect ratio: ${aspectRatio}
- Quality: High resolution, web-optimized
- Style: Natural, realistic photography (not AI-generated looking)
- Purpose: ${suggestion.type === 'featured' ? 'Blog header/featured image' : 'Supporting content image'}
- Title: ${suggestion.imageTitle || suggestion.description}

Save the generated image with filename: ${suggestion.imageSlug || `blog-${suggestion.type}-${Date.now()}-${i + 1}`}.jpg`;

        const imageContext = `Blog post image generation for: "${blogTitle}"
Image type: ${suggestion.type}
Placement: ${suggestion.placement}
Alt text: ${suggestion.altText}

This is part of a professional blog post requiring natural, realistic imagery that doesn't look AI-generated.`;

        try {
          // Call the asset retrieval tool to generate real images
          console.log(`🎨 Calling asset_retrieval_subtask for image ${i + 1}...`);
          
          // NOTE: This will be replaced with actual asset_retrieval_subtask call
          // For now, using the mock API endpoint for testing
          const imageResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/asset-retrieval`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              task: imageTask,
              context: imageContext,
            }),
          });

          if (imageResult.ok) {
            const assetData = await imageResult.json();
            
            // Process successful image generation
            if (assetData.success && assetData.url) {
              const generatedImageData = {
                success: true,
                url: assetData.url,
                filename: assetData.filename || `${suggestion.imageSlug || `blog-${suggestion.type}-${Date.now()}-${i + 1}`}.jpg`,
                type: suggestion.type,
                altText: suggestion.altText,
                placement: suggestion.placement,
                description: suggestion.description || suggestion.imageTitle,
                imageTitle: suggestion.imageTitle,
                imageSlug: suggestion.imageSlug,
                aspectRatio: aspectRatio,
                generated: true,
                realistic: true
              };
              
              generatedImages.push(generatedImageData);
              console.log(`✅ Successfully generated realistic image ${i + 1}`);
            } else {
              throw new Error('Asset retrieval failed or returned invalid data');
            }
          } else {
            throw new Error(`Asset retrieval API error: ${imageResult.statusText}`);
          }
          
        } catch (assetError) {
          console.error(`⚠️ Asset retrieval failed for image ${i + 1}, using fallback:`, assetError);
          
          // Fallback to mock response if real generation fails
          const timestamp = Date.now();
          const fallbackImageResult = {
            success: true,
            url: `/generated-images/fallback-${suggestion.type}-${timestamp}-${i + 1}.jpg`,
            filename: `fallback-${suggestion.type}-${timestamp}-${i + 1}.jpg`,
            type: suggestion.type,
            altText: suggestion.altText,
            placement: suggestion.placement,
            description: suggestion.description || suggestion.imageTitle,
            imageTitle: suggestion.imageTitle,
            imageSlug: suggestion.imageSlug,
            aspectRatio: aspectRatio,
            generated: false,
            fallback: true,
            error: assetError instanceof Error ? assetError.message : 'Unknown error'
          };
          
          generatedImages.push(fallbackImageResult);
        }
        
      } catch (error) {
        console.error(`❌ Error generating image ${i + 1}:`, error);
        // Continue with other images even if one fails
      }
    }

    if (generatedImages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate any images',
        images: []
      });
    }

    console.log('✅ Successfully generated images:', generatedImages.length);

    return NextResponse.json({
      success: true,
      images: generatedImages,
      totalGenerated: generatedImages.length,
      blogTitle
    });

  } catch (error) {
    console.error('❌ Image creation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create images',
      details: error instanceof Error ? error.message : 'Unknown error',
      images: [],
    });
  }
}
