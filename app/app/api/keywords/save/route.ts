

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { keywords, name, description } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      );
    }

    const savedKeywords = await prisma.keywordCluster.create({
      data: {
        name: name || `Keyword Set - ${new Date().toLocaleDateString()}`,
        keywords: JSON.stringify(keywords),
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      id: savedKeywords.id,
      message: 'Keywords saved successfully'
    });
  } catch (error) {
    console.error('Keywords save error:', error);
    return NextResponse.json(
      { error: 'Failed to save keywords' },
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
