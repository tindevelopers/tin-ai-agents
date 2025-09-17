
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Type for generated images
interface GeneratedImage {
  url: string;
  type: 'featured' | 'body';
  altText?: string;
  description?: string;
  filename?: string;
  placement?: string;
}

export const runtime = 'nodejs'; // Edge runtime cannot open TCP sockets (Prisma won't work)

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Blog save attempt started');
    
    // Check if database is accessible
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: String(dbError) },
        { status: 500 }
      );
    }

    const { id, title, content, keywords, status, featuredImage, generatedImages } = await request.json() as {
      id?: string;
      title: string;
      content: string;
      keywords?: string[];
      status?: string;
      featuredImage?: { url: string; alt?: string; filename?: string };
      generatedImages?: GeneratedImage[];
    };
    console.log('📝 Received blog data:', { 
      hasId: !!id,
      title: title?.substring(0, 50) + '...', 
      contentLength: content?.length || 0,
      keywordsLength: keywords?.length || 0,
      status,
      hasFeaturedImage: !!featuredImage,
      generatedImagesCount: generatedImages?.length || 0
    });

    // Process and embed generated images into content
    let processedContent = content || '';
    let finalFeaturedImage = featuredImage;
    
    if (generatedImages && generatedImages.length > 0) {
      console.log('🖼️ Processing generated images for embedding:', generatedImages.length);
      
      // Find featured image and body images
      const featuredImg = generatedImages.find(img => img.type === 'featured');
      const bodyImages = generatedImages.filter(img => img.type === 'body');
      
      // If we have a featured image, use it
      if (featuredImg?.url) {
        finalFeaturedImage = {
          url: featuredImg.url,
          alt: featuredImg.altText || featuredImg.description || 'Featured image',
          filename: featuredImg.filename
        };
        console.log('✅ Using generated featured image:', finalFeaturedImage.url);
      }
      
      // Embed body images into content based on their placement
      if (bodyImages.length > 0) {
        console.log('📝 Embedding body images into content:', bodyImages.length);
        
        bodyImages.forEach((img, index) => {
          const imageMarkdown = `\n\n![${img.altText || img.description || `Image ${index + 1}`}](${img.url})\n\n`;
          
          // Insert images based on placement preference
          if (img.placement && img.placement.includes('beginning')) {
            // Insert near the beginning (after first paragraph)
            const firstParagraphEnd = processedContent.indexOf('\n\n');
            if (firstParagraphEnd > 0) {
              processedContent = processedContent.slice(0, firstParagraphEnd) + imageMarkdown + processedContent.slice(firstParagraphEnd);
            } else {
              processedContent = imageMarkdown + processedContent;
            }
          } else if (img.placement && img.placement.includes('end')) {
            // Insert near the end
            processedContent = processedContent + imageMarkdown;
          } else {
            // Insert in the middle (default behavior)
            const contentLength = processedContent.length;
            const midPoint = Math.floor(contentLength / 2);
            const nextParagraph = processedContent.indexOf('\n\n', midPoint);
            
            if (nextParagraph > 0) {
              processedContent = processedContent.slice(0, nextParagraph) + imageMarkdown + processedContent.slice(nextParagraph);
            } else {
              processedContent = processedContent + imageMarkdown;
            }
          }
        });
        
        console.log('✅ Embedded images into content. New content length:', processedContent.length);
      }
    }

    // Check if blog_posts table exists
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'blog_posts'
        );
      `;
      console.log('📋 blog_posts table exists:', tableCheck);
    } catch (tableError) {
      console.error('❌ Table check failed:', tableError);
    }

    let blogPost;
    
    if (id) {
      // Update existing blog post
      console.log('📝 Updating existing blog post with ID:', id);
      blogPost = await prisma.blogPost.update({
        where: { id },
        data: {
          title: title || 'Untitled',
          content: processedContent || '',
          keywords: JSON.stringify(keywords || []),
          status: status || 'draft',
          featured_image: finalFeaturedImage?.url || null,
        },
      });
    } else {
      // Create new blog post
      console.log('📝 Creating new blog post');
      blogPost = await prisma.blogPost.create({
        data: {
          title: title || 'Untitled Blog Post',
          content: processedContent || '',
          keywords: JSON.stringify(keywords || []),
          status: status || 'draft',
          featured_image: finalFeaturedImage?.url || null,
        },
      });
    }
    
    console.log('✅ Blog post saved successfully:', blogPost.id);
    return NextResponse.json({ success: true, blogPost });
  } catch (error) {
    console.error('❌ Blog save error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save blog post',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
