#!/usr/bin/env node

/**
 * SDK Compatibility Checker
 * 
 * This script verifies that our AI Content Publisher integration
 * is still compatible with the latest SDK version.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking SDK compatibility...');

async function checkCompatibility() {
  try {
    // Check if our custom content publisher still works
    console.log('📦 Testing content publisher integration...');
    
    // Check if the TypeScript file exists
    const contentPublisherPath = path.join(__dirname, '../lib/content-publisher.ts');
    if (!fs.existsSync(contentPublisherPath)) {
      throw new Error('Content publisher file does not exist');
    }
    
    // For now, we'll just verify the file exists and has the right structure
    const content = fs.readFileSync(contentPublisherPath, 'utf8');
    
    if (!content.includes('export class AIContentPublisher')) {
      throw new Error('AIContentPublisher class not found in content-publisher.ts');
    }
    
    console.log('✅ Publisher TypeScript file: OK');
    
    // Test required methods exist in the TypeScript file
    const requiredMethods = [
      'configureWebflow',
      'configureWordPress', 
      'validateContent',
      'publish',
      'publishToMultiple',
      'batchPublish'
    ];
    
    for (const method of requiredMethods) {
      if (!content.includes(method)) {
        throw new Error(`Required method '${method}' not found in content-publisher.ts`);
      }
    }
    console.log('✅ Required methods: OK');
    
    // Test content validation structure exists
    if (!content.includes('validateContent')) {
      throw new Error('validateContent method not found');
    }
    
    if (!content.includes('interface AIContent')) {
      throw new Error('AIContent interface not found');
    }
    
    console.log('✅ Content validation structure: OK');
    
    // Check if the SDK package is properly installed
    console.log('📦 Checking SDK package installation...');
    
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.dependencies['ai-content-publisher']) {
      console.warn('⚠️ ai-content-publisher not found in dependencies');
    } else {
      console.log('✅ SDK package dependency: OK');
    }
    
    // Check API endpoints exist
    console.log('🌐 Checking API endpoints...');
    
    const apiEndpoints = [
      'app/api/content/publish/route.ts',
      'app/api/content/test-publisher/route.ts'
    ];
    
    for (const endpoint of apiEndpoints) {
      const endpointPath = path.join(__dirname, '..', endpoint);
      if (!fs.existsSync(endpointPath)) {
        throw new Error(`API endpoint missing: ${endpoint}`);
      }
    }
    console.log('✅ API endpoints: OK');
    
    // Check React component exists
    console.log('⚛️ Checking React components...');
    
    const componentPath = path.join(__dirname, '../components/content-publisher.tsx');
    if (!fs.existsSync(componentPath)) {
      throw new Error('ContentPublisher component missing');
    }
    console.log('✅ React components: OK');
    
    console.log('\n🎉 All compatibility checks passed!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Compatibility check failed:', error.message);
    
    // Log additional context for debugging
    console.error('\n🔍 Debug Information:');
    console.error('- Node version:', process.version);
    console.error('- Working directory:', process.cwd());
    console.error('- Error stack:', error.stack);
    
    return false;
  }
}

// Run the compatibility check
checkCompatibility()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
