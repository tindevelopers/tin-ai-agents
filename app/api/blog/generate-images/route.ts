
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface ImageSuggestion {
  type: 'featured' | 'body';
  prompt: string;
  description: string;
  placement?: string; // For body images - where to place them
  altText: string;
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, keywords } = await request.json();

    console.log('🎨 Generating image suggestions for:', { title, keywords: keywords?.length });

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required for image generation' },
        { status: 400 }
      );
    }

    // Analyze content to create targeted image prompts
    const contentSections = content ? content.split('\n\n').filter((section: string) => section.trim().length > 100) : [];
    
    const imageSuggestions: ImageSuggestion[] = [];

    // 1. Generate featured image prompt
    const featuredImagePrompt = `Create a professional, eye-catching featured image for a blog post titled "${title}". The image should be modern, clean, and relevant to ${keywords?.join(', ') || 'the topic'}. Style: professional blog header, high quality, engaging, suitable for social media sharing. Aspect ratio: 16:9 landscape orientation.`;

    imageSuggestions.push({
      type: 'featured',
      prompt: featuredImagePrompt,
      description: 'Main featured image for the blog post header',
      altText: `Featured image for ${title}`,
    });

    // 2. Generate body images based on content sections
    if (contentSections.length > 0) {
      // Take up to 3 most substantial sections for body images
      const selectedSections = contentSections.slice(0, 3);
      
      for (let i = 0; i < selectedSections.length; i++) {
        const section = selectedSections[i];
        const sectionPreview = section.substring(0, 200) + '...';
        
        // Extract key concepts from the section
        const sectionKeywords = extractKeywords(section);
        
        const bodyImagePrompt = `Create an illustration or graphic that supports this blog content: "${sectionPreview}". Focus on ${sectionKeywords.join(', ')}. Style: modern, professional, informative graphic or illustration that enhances the text content. Aspect ratio: 16:10 or square.`;
        
        imageSuggestions.push({
          type: 'body',
          prompt: bodyImagePrompt,
          description: `Supporting image for section ${i + 1}`,
          placement: `after-section-${i + 1}`,
          altText: `Illustration showing ${sectionKeywords.slice(0, 2).join(' and ')}`,
        });
      }
    }

    // If no content sections, create generic supporting images based on title and keywords
    if (imageSuggestions.length === 1) {
      const topicKeywords = keywords || [title];
      
      for (let i = 0; i < 2; i++) {
        const concepts = topicKeywords.slice(i * 2, (i + 1) * 2);
        const bodyImagePrompt = `Create a professional illustration or infographic about ${concepts.join(' and ')} related to "${title}". Style: modern, clean, informative graphic that supports blog content about ${title}. Aspect ratio: 16:10.`;
        
        imageSuggestions.push({
          type: 'body',
          prompt: bodyImagePrompt,
          description: `Supporting image ${i + 1}`,
          placement: `body-image-${i + 1}`,
          altText: `Illustration about ${concepts.join(' and ')}`,
        });
      }
    }

    console.log('✅ Generated image suggestions:', imageSuggestions.length);

    return NextResponse.json({
      success: true,
      images: imageSuggestions,
      totalImages: imageSuggestions.length,
    });

  } catch (error) {
    console.error('❌ Image generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate image suggestions',
      details: error instanceof Error ? error.message : 'Unknown error',
      images: [],
    });
  }
}

// Helper function to extract key concepts from text
function extractKeywords(text: string): string[] {
  // Simple keyword extraction - in production, you might use NLP libraries
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'this', 'that', 'these', 'those'];
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));
  
  // Count word frequency
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Return top 3 most frequent words
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([word]) => word);
}
