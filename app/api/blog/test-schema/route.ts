
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('🔍 Testing blog_posts table schema');
    
    // Check if table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_posts'
      );
    `;
    
    // Get table schema
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'blog_posts' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    // Try a simple insert test
    let insertTest = 'NOT_ATTEMPTED';
    try {
      const testPost = await prisma.blogPost.create({
        data: {
          title: 'Test Post ' + Date.now(),
          content: 'Test content',
          keywords: '["test"]',
          status: 'draft',
        },
      });
      insertTest = { success: true, id: testPost.id };
      
      // Clean up test post
      await prisma.blogPost.delete({
        where: { id: testPost.id }
      });
    } catch (insertError) {
      insertTest = { 
        success: false, 
        error: insertError instanceof Error ? insertError.message : String(insertError) 
      };
    }

    return NextResponse.json({
      tableExists,
      columns,
      insertTest,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Schema test failed',
      details: String(error)
    }, { status: 500 });
  }
}
