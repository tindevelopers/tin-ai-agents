
import { NextRequest, NextResponse } from 'next/server';
// Temporarily disabled due to build issues
// import * as cheerio from 'cheerio';

export const runtime = 'nodejs';

interface CrawledPage {
  url: string;
  title: string;
  description?: string;
  h1?: string;
}

export async function POST(request: NextRequest) {
  // Temporarily disabled due to build issues with cheerio/File dependency
  return NextResponse.json({
    success: false,
    error: 'Website crawling temporarily disabled during build fixes',
    pages: []
  }, { status: 503 });
  
  /* try {
    const { websiteUrl } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    console.log('🕷️ Starting website crawl for:', websiteUrl);

    // Normalize the URL
    const baseUrl = websiteUrl.replace(/\/$/, '');
    const sitePagesSet = new Set<string>();
    const crawledPages: CrawledPage[] = [];

    // Function to crawl a single page
    const crawlPage = async (url: string): Promise<CrawledPage | null> => {
      try {
        console.log('📄 Crawling page:', url);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SEO-Crawler/1.0)',
          },
          // Note: AbortSignal.timeout might not be available in all Node.js versions
          // signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          console.log(`❌ Failed to fetch ${url}: ${response.status}`);
          return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extract page information
        const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';
        const description = $('meta[name="description"]').attr('content')?.trim() || 
                          $('meta[property="og:description"]').attr('content')?.trim() ||
                          $('p').first().text().trim().substring(0, 160);
        const h1 = $('h1').first().text().trim();

        // Find internal links on this page
        $('a[href]').each((_: number, element: any) => {
          const href = $(element).attr('href');
          if (href) {
            let fullUrl: string;
            
            // Handle different types of URLs
            if (href.startsWith('http')) {
              // Absolute URL - check if it's internal
              if (href.startsWith(baseUrl)) {
                fullUrl = href;
              } else {
                return; // External link, skip
              }
            } else if (href.startsWith('/')) {
              // Root-relative URL
              fullUrl = baseUrl + href;
            } else if (href.startsWith('./') || !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
              // Relative URL
              const currentDir = url.substring(0, url.lastIndexOf('/') + 1);
              fullUrl = new URL(href, currentDir).href;
            } else {
              return; // Skip anchors, mailto, tel, etc.
            }

            // Clean URL (remove fragments, normalize)
            try {
              const urlObj = new URL(fullUrl);
              const cleanUrl = `${urlObj.origin}${urlObj.pathname}`.replace(/\/$/, '');
              
              // Only add if it's really internal and not already found
              if (cleanUrl.startsWith(baseUrl) && !sitePagesSet.has(cleanUrl)) {
                sitePagesSet.add(cleanUrl);
              }
            } catch (e) {
              // Invalid URL, skip
            }
          }
        });

        return {
          url,
          title,
          description,
          h1,
        };
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
        return null;
      }
    };

    // Start crawling from the homepage
    const homePage = await crawlPage(baseUrl);
    if (homePage) {
      crawledPages.push(homePage);
    }

    // Add common pages to check
    const commonPages = [
      '/about',
      '/about-us',
      '/services',
      '/products',
      '/blog',
      '/contact',
      '/contact-us',
      '/privacy-policy',
      '/terms-of-service',
      '/sitemap.xml'
    ];

    // Check common pages
    for (const path of commonPages) {
      const pageUrl = baseUrl + path;
      if (!sitePagesSet.has(pageUrl)) {
        sitePagesSet.add(pageUrl);
      }
    }

    // Crawl additional pages (limit to first 15 for performance)
    const additionalUrls = Array.from(sitePagesSet).slice(0, 15);
    
    for (const url of additionalUrls) {
      if (url !== baseUrl) { // Skip homepage as we already crawled it
        const pageData = await crawlPage(url);
        if (pageData) {
          crawledPages.push(pageData);
        }
      }
    }

    console.log('✅ Crawl completed. Found pages:', crawledPages.length);

    return NextResponse.json({
      success: true,
      website: baseUrl,
      pages: crawledPages,
      totalPages: crawledPages.length,
      crawledAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Website crawl error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to crawl website',
      details: error instanceof Error ? error.message : 'Unknown error',
      pages: [],
    });
  } */
}
