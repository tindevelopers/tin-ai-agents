import { NextRequest, NextResponse } from 'next/server';
import { StabilityAI } from '@stability-ai/sdk';
import { imageService, uploadBlogImage } from '@/lib/image-utils';
import { getImageStorageProvider } from '@/lib/image-storage';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { task, context, imageType = 'body', blogTitle = 'Generated Image' } = await request.json();

    console.log('🎨 Starting StabilityAI image generation with Cloudinary storage:', {
      task: task?.substring(0, 100) + '...',
      context: context?.substring(0, 50) + '...',
      imageType,
      blogTitle
    });

    // Check if StabilityAI API key is configured
    if (!process.env.STABILITY_AI_API_KEY) {
      console.warn('⚠️ StabilityAI API key not configured, using fallback');
      return NextResponse.json({
        success: false,
        error: 'StabilityAI API key not configured',
        fallback: true,
        fallback_data: {
          url: '/generated-images/fallback-placeholder.jpg',
          filename: 'fallback-placeholder.jpg',
          note: 'StabilityAI not configured - using placeholder'
        }
      }, { status: 500 });
    }

    // Initialize StabilityAI
    const stabilityAI = new StabilityAI({
      apiKey: process.env.STABILITY_AI_API_KEY,
    });

    // Extract image generation parameters from task
    const aspectRatio = extractAspectRatio(task) || '16:9';
    const { width, height } = getDimensionsFromAspectRatio(aspectRatio);

    console.log(`🖼️ Generating image with dimensions: ${width}x${height} (${aspectRatio})`);

    // Generate image with StabilityAI
    const imageData = await stabilityAI.generate.image({
      model: 'stable-diffusion-xl-1024-v1-0',
      prompt: task,
      width,
      height,
      samples: 1,
      steps: 30,
      cfg_scale: 7,
      style_preset: 'photographic',
      seed: Math.floor(Math.random() * 1000000),
    });

    if (!imageData.artifacts || imageData.artifacts.length === 0) {
      throw new Error('No image artifacts returned from StabilityAI');
    }

    const artifact = imageData.artifacts[0];
    const base64Image = artifact.base64;

    if (!base64Image) {
      throw new Error('No base64 image data returned from StabilityAI');
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Generate filename
    const timestamp = Date.now();
    const cleanFilename = `ai-generated-${timestamp}.png`;

    console.log('☁️ Uploading image to Cloudinary...');

    try {
      // Upload to Cloudinary using our abstraction layer
      const uploadResult = await uploadBlogImage(imageBuffer, blogTitle, imageType);

      console.log('✅ Successfully uploaded image to Cloudinary:', {
        publicId: uploadResult.publicId,
        url: uploadResult.url,
        size: `${width}x${height}`,
        bytes: uploadResult.bytes
      });

      const successResponse = {
        success: true,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        filename: cleanFilename,
        aspectRatio: aspectRatio,
        size: {
          width: width,
          height: height
        },
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        generated: true,
        provider: 'StabilityAI + Cloudinary',
        model: 'stable-diffusion-xl-1024-v1-0',
        timestamp: Date.now(),
        task_context: context,
        seed: imageData.artifacts[0].seed || null,
        storage: 'cloudinary',
        optimized_urls: {
          thumbnail: imageService.getThumbnailUrl(uploadResult.publicId),
          featured: imageService.getFeaturedImageUrl(uploadResult.publicId, aspectRatio as any),
          responsive: imageService.getResponsiveImageUrls(uploadResult.publicId)
        }
      };

      return NextResponse.json(successResponse);

    } catch (uploadError) {
      console.error('❌ Cloudinary upload failed, falling back to local storage:', uploadError);
      
      // Fallback to local storage if Cloudinary fails
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const uploadsDir = path.join(process.cwd(), 'public', 'generated-images');
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
      } catch (mkdirError) {
        console.log('Directory already exists or created');
      }

      const imagePath = path.join(uploadsDir, cleanFilename);
      await fs.writeFile(imagePath, imageBuffer);

      const publicUrl = `/generated-images/${cleanFilename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: cleanFilename,
        aspectRatio: aspectRatio,
        size: { width, height },
        format: 'png',
        generated: true,
        provider: 'StabilityAI + Local Fallback',
        model: 'stable-diffusion-xl-1024-v1-0',
        timestamp: Date.now(),
        task_context: context,
        seed: imageData.artifacts[0].seed || null,
        storage: 'local',
        fallback: true,
        fallback_reason: uploadError instanceof Error ? uploadError.message : 'Unknown upload error'
      });
    }

  } catch (error) {
    console.error('❌ StabilityAI image generation error:', error);
    
    // Fallback response if StabilityAI fails
    const timestamp = Date.now();
    const fallbackResponse = {
      success: false,
      error: 'StabilityAI image generation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      fallback: true,
      fallback_data: {
        url: `/generated-images/fallback-${timestamp}.jpg`,
        filename: `fallback-${timestamp}.jpg`,
        note: 'This is a fallback response - actual image generation failed'
      }
    };
    
    return NextResponse.json(fallbackResponse, { status: 500 });
  }
}

// Helper functions
function extractAspectRatio(task: string): string | null {
  const aspectRatioMatch = task.match(/aspect ratio[:\s]+(\d+:\d+)/i);
  if (aspectRatioMatch) {
    return aspectRatioMatch[1];
  }
  
  // Default aspect ratios based on common patterns
  if (task.toLowerCase().includes('featured') || task.toLowerCase().includes('header')) {
    return '16:9';
  }
  if (task.toLowerCase().includes('thumbnail') || task.toLowerCase().includes('square')) {
    return '1:1';
  }
  
  return '16:9'; // Default
}

function getDimensionsFromAspectRatio(aspectRatio: string): { width: number; height: number } {
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
  
  // Use common resolutions
  const baseWidth = 1024;
  const baseHeight = Math.round((baseWidth * heightRatio) / widthRatio);
  
  return { width: baseWidth, height: baseHeight };
}
