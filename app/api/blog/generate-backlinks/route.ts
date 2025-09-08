
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { title, content, keywords, websiteUrl } = await request.json();

    console.log('🔗 Generating backlinks for:', { title, keywords: keywords?.length, websiteUrl });

    if (!process.env.ABACUSAI_API_KEY) {
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Generate internal link suggestions from REAL website pages
    let internalLinks: any[] = [];
    if (websiteUrl) {
      try {
        console.log('🕷️ Crawling website for real internal pages...');
        
        // First, crawl the actual website to get real pages
        const crawlResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/blog/crawl-website`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteUrl }),
        });

        if (crawlResponse.ok) {
          const crawlData = await crawlResponse.json();
          console.log('✅ Website crawl completed, found pages:', crawlData.pages?.length || 0);
          
          if (crawlData.pages && crawlData.pages.length > 0) {
            // Use AI to match real pages to the content
            const realPages = crawlData.pages.map((page: any) => ({
              url: page.url,
              title: page.title,
              description: page.description,
            }));

            const internalPrompt = `Based on this blog post about "${title}" with keywords [${keywords?.join(', ')}], analyze these REAL pages from the website and suggest 3-5 that would be most relevant to link to.

Content excerpt: ${content.substring(0, 800)}

REAL WEBSITE PAGES (choose from these only):
${realPages.map((page: any) => `- URL: ${page.url}\n  Title: ${page.title}\n  Description: ${page.description || 'No description'}`).join('\n')}

Return ONLY valid JSON selecting from the real pages above:
{
  "internalLinks": [
    {
      "linkText": "descriptive anchor text for the real page",
      "url": "exact URL from the list above",
      "reason": "why this real page is relevant to the blog post",
      "pageTitle": "exact title from the list above"
    }
  ]
}`;

            const internalResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'system',
                    content: 'You are an SEO expert. You MUST only suggest internal links from the real pages provided. Never invent or hallucinate URLs.'
                  },
                  {
                    role: 'user',
                    content: internalPrompt
                  }
                ],
                response_format: { type: "json_object" },
                max_tokens: 1500,
              }),
            });

            if (internalResponse.ok) {
              const internalData = await internalResponse.json();
              const parsedInternal = JSON.parse(internalData.choices[0].message.content || '{"internalLinks": []}');
              internalLinks = parsedInternal.internalLinks || [];
              console.log('✅ Generated internal links from real pages:', internalLinks.length);
            }
          }
        } else {
          console.log('⚠️ Website crawl failed, skipping internal links');
        }
      } catch (error) {
        console.error('Error crawling website for internal links:', error);
      }
    }

    // Generate external link suggestions
    const externalPrompt = `Based on this blog post about "${title}" with keywords [${keywords?.join(', ')}], suggest 4-6 high-quality external websites/resources that would be valuable to link to for readers.

Content excerpt: ${content.substring(0, 800)}

Focus on authoritative sources like:
- Industry publications
- Research studies
- Government resources
- Educational institutions
- Reputable tools/platforms

Return ONLY valid JSON in this format:
{
  "externalLinks": [
    {
      "linkText": "descriptive anchor text",
      "url": "https://example.com",
      "domain": "example.com",
      "reason": "why this resource is valuable",
      "type": "study|tool|article|resource"
    }
  ]
}`;

    let externalLinks: any[] = [];
    try {
      const externalResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an SEO expert specializing in external linking strategies. Suggest high-quality, authoritative external resources that add value to readers.'
            },
            {
              role: 'user',
              content: externalPrompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1500,
        }),
      });

      if (externalResponse.ok) {
        const externalData = await externalResponse.json();
        const parsedExternal = JSON.parse(externalData.choices[0].message.content || '{"externalLinks": []}');
        externalLinks = parsedExternal.externalLinks || [];
      }
    } catch (error) {
      console.error('Error generating external links:', error);
      // Fallback external links
      externalLinks = [
        {
          linkText: "Industry Research Report",
          url: "https://example.com/research",
          domain: "example.com",
          reason: "Provides authoritative data on the topic",
          type: "study"
        }
      ];
    }

    console.log('✅ Generated backlinks:', { internal: internalLinks.length, external: externalLinks.length });

    return NextResponse.json({
      success: true,
      internalLinks,
      externalLinks,
      totalSuggestions: internalLinks.length + externalLinks.length
    });

  } catch (error) {
    console.error('❌ Backlink generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate backlinks',
      internalLinks: [],
      externalLinks: []
    });
  }
}
