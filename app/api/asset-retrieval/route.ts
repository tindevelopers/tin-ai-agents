
import { NextRequest, NextResponse } from 'next/server';
import { getImageStorageProvider } from '@/lib/image-storage';

export const runtime = 'nodejs';

// StabilityAI API configuration
const STABILITY_API_HOST = 'https://api.stability.ai';
const STABILITY_API_KEY = process.env.STABILITY_AI_API_KEY;

interface StabilityGenerationRequest {
  text_prompts: Array<{
    text: string;
    weight?: number;
  }>;
  cfg_scale?: number;
  height?: number;
  width?: number;
  samples?: number;
  steps?: number;
  style_preset?: string;
  seed?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { task, context } = await request.json();

    console.log('🎨 StabilityAI image generation request:', { 
      task: task?.substring(0, 100) + '...', 
      context: context?.substring(0, 100) + '...' 
    });

    if (!task?.trim()) {
      return NextResponse.json(
        { error: 'Task description is required for image generation' },
        { status: 400 }
      );
    }

    // Extract aspect ratio and determine dimensions (needed for both placeholder and real generation)
    const aspectRatioMatch = task.match(/aspect ratio:\s*([^\s\n,]+)/i);
    const aspectRatio = aspectRatioMatch?.[1] || '16:9';
    
    let width = 1024;
    let height = 1024;
    
    if (aspectRatio === '16:9') {
      width = 1344;
      height = 768;
    } else if (aspectRatio === '4:3') {
      width = 1152;
      height = 896;
    } else if (aspectRatio === '1:1') {
      width = 1024;
      height = 1024;
    }

    if (!STABILITY_API_KEY || STABILITY_API_KEY === 'your-stability-ai-api-key-here') {
      console.warn('⚠️ StabilityAI API key not configured, using placeholder mode');
      
      // Create a placeholder response when API key is not configured
      const timestamp = Date.now();
      const filenameMatch = task.match(/filename:\s*([^\s\n]+)/i) || task.match(/Save.*?as:\s*([^\s\n]+)/i);
      const suggestedFilename = filenameMatch?.[1] || `generated-image-${timestamp}.jpg`;
      const cleanFilename = suggestedFilename.replace(/[^a-zA-Z0-9.-]/g, '-');
      
      const placeholderResponse = {
        success: true,
        url: `/generated-images/placeholder-${cleanFilename}`,
        filename: `placeholder-${cleanFilename}`,
        aspectRatio: aspectRatio,
        size: {
          width: width,
          height: height
        },
        format: 'jpg',
        generated: false,
        provider: 'Placeholder',
        model: 'demo-mode',
        timestamp: timestamp,
        task_context: context,
        note: 'Placeholder image - configure STABILITY_AI_API_KEY for real image generation'
      };
      
      return NextResponse.json(placeholderResponse);
    }

    // Extract image generation prompt from task
    // Try to extract from "Generate a realistic, natural-looking image using this detailed prompt:" format first
    let imagePrompt = '';
    
    const detailedPromptMatch = task.match(/using this detailed prompt:\s*([\s\S]*?)(?:\n\nAdditional requirements:|$)/i);
    if (detailedPromptMatch) {
      imagePrompt = detailedPromptMatch[1]?.trim();
    } else {
      // Fall back to original "Prompt:" format
      const promptMatch = task.match(/Prompt:\s*([\s\S]*?)(?:\n\nAdditional requirements:|$)/i);
      imagePrompt = promptMatch?.[1]?.trim() || task.split('\n')[0];
    }
    
    if (!imagePrompt) {
      imagePrompt = task.split('\n')[0]; // Use first line as fallback
    }

    // Extract filename from task
    const filenameMatch = task.match(/filename:\s*([^\s\n]+)/i) || task.match(/Save.*?as:\s*([^\s\n]+)/i);
    const suggestedFilename = filenameMatch?.[1] || `generated-image-${Date.now()}.jpg`;
    const cleanFilename = suggestedFilename.replace(/[^a-zA-Z0-9.-]/g, '-');

    console.log('🖼️ Generating image with StabilityAI:', {
      prompt: imagePrompt.substring(0, 100) + '...',
      dimensions: `${width}x${height}`,
      aspectRatio
    });

    // Prepare StabilityAI request
    const stabilityRequest: StabilityGenerationRequest = {
      text_prompts: [
        {
          text: imagePrompt,
          weight: 1
        }
      ],
      cfg_scale: 7,
      height: height,
      width: width,
      samples: 1,
      steps: 30,
      style_preset: 'photographic', // Use photographic style for more realistic results
    };

    // Call StabilityAI API
    const response = await fetch(`${STABILITY_API_HOST}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
      },
      body: JSON.stringify(stabilityRequest),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ StabilityAI API error:', response.status, errorData);
      throw new Error(`StabilityAI API error: ${response.status} - ${errorData}`);
    }

    const responseData = await response.json();
    
    if (!responseData.artifacts || responseData.artifacts.length === 0) {
      throw new Error('No images generated by StabilityAI');
    }

    // Get the first generated image
    const imageData = responseData.artifacts[0];
    const base64Image = imageData.base64;

    // Upload image to Cloudinary instead of saving to local filesystem
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const imageStorage = getImageStorageProvider();
    
    console.log('📤 Uploading image to Cloudinary...');
    const uploadResult = await imageStorage.upload(imageBuffer, cleanFilename, {
      folder: 'ai-blog-writer/generated-images',
      tags: ['ai-generated', 'blog-content', 'stability-ai']
    });

    const publicUrl = uploadResult.url;

    console.log('✅ Successfully generated and uploaded image with StabilityAI + Cloudinary:', {
      filename: cleanFilename,
      size: `${width}x${height}`,
      url: publicUrl,
      publicId: uploadResult.publicId
    });

    const successResponse = {
      success: true,
      url: publicUrl,
      filename: cleanFilename,
      aspectRatio: aspectRatio,
      cloudinary: {
        publicId: uploadResult.publicId,
        secureUrl: uploadResult.secureUrl,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes
      },
      size: {
        width: width,
        height: height
      },
      format: 'png',
      generated: true,
      provider: 'StabilityAI',
      model: 'stable-diffusion-xl-1024-v1-0',
      timestamp: Date.now(),
      task_context: context,
      seed: imageData.seed || null,
    };

    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('❌ Image generation/upload error:', error);
    
    // Return proper error response without fallback URLs
    const errorResponse = {
      success: false,
      error: 'Image generation or upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
