
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const cwd = process.cwd();
    const publicDir = path.join(cwd, 'public');
    const generatedImagesDir = path.join(cwd, 'public', 'generated-images');
    
    console.log('🔍 Debugging paths:', {
      cwd,
      publicDir,
      generatedImagesDir
    });
    
    // Test writing a simple file
    const testFilename = `test-${Date.now()}.txt`;
    const testPath = path.join(generatedImagesDir, testFilename);
    
    try {
      await mkdir(generatedImagesDir, { recursive: true });
      await writeFile(testPath, 'Test file content');
      console.log('✅ Test file written successfully:', testPath);
    } catch (writeError) {
      console.error('❌ Test file write error:', writeError);
    }
    
    return NextResponse.json({
      success: true,
      paths: {
        cwd,
        publicDir,
        generatedImagesDir,
        testFilename,
        testPath
      }
    });
    
  } catch (error) {
    console.error('❌ Debug paths error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
