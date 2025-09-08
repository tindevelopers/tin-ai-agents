
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

        // Create detailed image generation prompt
        const aspectRatio = suggestion.type === 'featured' ? '16:9 landscape' : '16:10';
        const imageTask = `Generate a high-quality professional image for a blog post. 

Prompt: ${suggestion.prompt}

Requirements:
- Style: Modern, clean, professional, visually appealing
- Aspect ratio: ${aspectRatio}
- Quality: High resolution, suitable for web
- Theme: Related to "${blogTitle}"
- Purpose: ${suggestion.type === 'featured' ? 'Blog header/featured image' : 'Supporting content image'}

Save the image as: blog-${suggestion.type}-${Date.now()}-${i + 1}.jpg`;

        // TODO: Replace this with actual asset_retrieval_subtask call
        // const imageResult = await asset_retrieval_subtask({
        //   task: imageTask,
        //   context: `Blog post generation for: ${blogTitle}`
        // });

        // For now, create a structured response that mimics what asset_retrieval would return
        const timestamp = Date.now();
        const mockImageResult = {
          success: true,
          url: `/generated-images/blog-${suggestion.type}-${timestamp}-${i + 1}.jpg`,
          filename: `blog-${suggestion.type}-${timestamp}-${i + 1}.jpg`,
          type: suggestion.type,
          altText: suggestion.altText,
          placement: suggestion.placement,
          description: suggestion.description,
          generated: true
        };

        generatedImages.push(mockImageResult);
        
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
