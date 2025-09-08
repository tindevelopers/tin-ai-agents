
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { prompt, maxTokens = 2000, temperature = 0.7 } = await request.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🤖 AI Generate API called:', {
      promptLength: prompt.length,
      maxTokens,
      temperature
    });

    // Call AbacusAI for text generation
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        stream: false,
        max_tokens: maxTokens,
        temperature: temperature
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AbacusAI API error:', response.status, errorText);
      throw new Error(`AbacusAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedContent = data?.choices?.[0]?.message?.content || '';

    console.log('✅ AI generation successful:', {
      contentLength: generatedContent.length
    });

    return NextResponse.json({
      success: true,
      content: generatedContent,
      text: generatedContent, // For backwards compatibility
      model: 'gpt-4o-mini',
      usage: data.usage
    });

  } catch (error) {
    console.error('❌ AI generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate AI content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
