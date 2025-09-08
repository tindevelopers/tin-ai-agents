
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

    // Generate internal link suggestions
    let internalLinks: any[] = [];
    if (websiteUrl) {
      const internalPrompt = `Based on this blog post about "${title}" with keywords [${keywords?.join(', ')}], suggest 3-5 internal pages that should exist on the website "${websiteUrl}" and would be relevant to link to. 

Content excerpt: ${content.substring(0, 800)}

Return ONLY valid JSON in this format:
{
  "internalLinks": [
    {
      "linkText": "descriptive anchor text",
      "suggestedUrl": "${websiteUrl}/suggested-page-path",
      "reason": "why this link is relevant",
      "pageTitle": "suggested internal page title"
    }
  ]
}`;

      try {
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
                content: 'You are an SEO expert specializing in internal linking strategies. Suggest relevant internal pages that would enhance the user experience and SEO value.'
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
        }
      } catch (error) {
        console.error('Error generating internal links:', error);
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
