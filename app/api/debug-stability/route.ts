import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Comprehensive Stability AI debugging...');

    // Check environment variables
    const stabilityApiKey = process.env.STABILITY_AI_API_KEY;
    if (!stabilityApiKey) {
      return NextResponse.json({
        success: false,
        error: 'STABILITY_AI_API_KEY environment variable not found'
      }, { status: 500 });
    }

    const STABILITY_API_HOST = 'https://api.stability.ai';
    
    // Test 1: List available engines/models
    console.log('🔍 Step 1: Checking available engines...');
    try {
      const enginesResponse = await fetch(`${STABILITY_API_HOST}/v1/engines/list`, {
        headers: {
          'Authorization': `Bearer ${stabilityApiKey}`,
        },
      });
      
      const enginesText = await enginesResponse.text();
      console.log('Engines response:', enginesResponse.status, enginesText.substring(0, 500));
      
      if (enginesResponse.ok) {
        const engines = JSON.parse(enginesText);
        console.log('✅ Available engines:', engines);
      }
    } catch (engineError) {
      console.log('❌ Engine list failed:', engineError);
    }

    // Test 2: Check account balance
    console.log('🔍 Step 2: Checking account balance...');
    try {
      const balanceResponse = await fetch(`${STABILITY_API_HOST}/v1/user/balance`, {
        headers: {
          'Authorization': `Bearer ${stabilityApiKey}`,
        },
      });
      
      const balanceText = await balanceResponse.text();
      console.log('Balance response:', balanceResponse.status, balanceText);
      
      if (balanceResponse.ok) {
        const balance = JSON.parse(balanceText);
        console.log('✅ Account balance:', balance);
      }
    } catch (balanceError) {
      console.log('❌ Balance check failed:', balanceError);
    }

    // Test 3: Try image generation with different models
    const modelsToTest = [
      'stable-diffusion-xl-1024-v1-0',
      'stable-diffusion-v1-6',
      'stable-diffusion-512-v2-1'
    ];

    const results = [];

    for (const model of modelsToTest) {
      console.log(`🔍 Step 3: Testing model ${model}...`);
      
      const stabilityRequest = {
        text_prompts: [
          {
            text: 'A simple blue sky with white clouds, photorealistic',
            weight: 1
          }
        ],
        cfg_scale: 7,
        height: 512,
        width: 512,
        samples: 1,
        steps: 20,
        style_preset: 'photographic'
      };

      try {
        const response = await fetch(`${STABILITY_API_HOST}/v1/generation/${model}/text-to-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${stabilityApiKey}`,
          },
          body: JSON.stringify(stabilityRequest),
        });

        const responseText = await response.text();
        console.log(`${model} response:`, response.status, responseText.substring(0, 200));

        results.push({
          model,
          status: response.status,
          success: response.ok,
          response: responseText.substring(0, 500),
          error: !response.ok ? responseText : null
        });

        if (response.ok) {
          console.log(`✅ ${model} works!`);
          break; // Found a working model
        } else {
          console.log(`❌ ${model} failed:`, response.status);
        }
      } catch (error) {
        console.log(`❌ ${model} error:`, error);
        results.push({
          model,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Stability AI debugging completed',
      api_key_provided: !!stabilityApiKey,
      api_key_preview: stabilityApiKey.substring(0, 10) + '...',
      test_results: results
    });

  } catch (error) {
    console.error('❌ Stability AI debugging error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Stability AI debugging failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
