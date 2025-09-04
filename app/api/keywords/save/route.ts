

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Keyword save attempt started');
    
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

    const { keywords, name, description } = await request.json();
    console.log('📝 Received data:', { keywordsLength: keywords?.length, name, hasDescription: !!description });

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      console.log('❌ Invalid keywords provided');
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      );
    }

    // Check if table exists
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'keyword_clusters'
        );
      `;
      console.log('📋 Table exists check:', tableCheck);
    } catch (tableError) {
      console.error('❌ Table check failed:', tableError);
    }

    const savedKeywords = await prisma.keywordCluster.create({
      data: {
        name: name || `Keyword Set - ${new Date().toLocaleDateString()}`,
        keywords: JSON.stringify(keywords),
        description: description || null,
      },
    });

    console.log('✅ Keywords saved successfully:', savedKeywords.id);
    return NextResponse.json({
      success: true,
      id: savedKeywords.id,
      message: 'Keywords saved successfully'
    });
  } catch (error) {
    console.error('❌ Keywords save error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save keywords', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const keywordClusters = await prisma.keywordCluster.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedClusters = keywordClusters.map(cluster => ({
      ...cluster,
      keywords: JSON.parse(cluster.keywords)
    }));

    return NextResponse.json({
      clusters: formattedClusters
    });
  } catch (error) {
    console.error('Error fetching keyword clusters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keyword clusters' },
      { status: 500 }
    );
  }
}
