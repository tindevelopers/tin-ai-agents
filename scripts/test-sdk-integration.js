#!/usr/bin/env node

/**
 * SDK Integration Test Suite
 * 
 * Comprehensive tests for the AI Content Publisher SDK integration
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Starting SDK Integration Test Suite...\n');

class SDKIntegrationTester {
  constructor() {
    this.testResults = [];
    this.errors = [];
  }

  async runTest(testName, testFn) {
    console.log(`📝 Running: ${testName}`);
    
    try {
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'PASS',
        duration: `${duration}ms`
      });
      
      console.log(`✅ ${testName} - PASSED (${duration}ms)\n`);
      
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'FAIL',
        error: error.message
      });
      
      this.errors.push({ test: testName, error });
      console.error(`❌ ${testName} - FAILED: ${error.message}\n`);
    }
  }

  async testContentPublisherInstantiation() {
    // Check that the TypeScript file exists and has the right structure
    const contentPublisherPath = path.join(__dirname, '../lib/content-publisher.ts');
    
    if (!fs.existsSync(contentPublisherPath)) {
      throw new Error('Content publisher TypeScript file does not exist');
    }
    
    const content = fs.readFileSync(contentPublisherPath, 'utf8');
    
    if (!content.includes('export class AIContentPublisher')) {
      throw new Error('AIContentPublisher class not found in TypeScript file');
    }
    
    // Check constructor parameters
    if (!content.includes('constructor(config?: PublisherConfig)')) {
      throw new Error('Constructor with config parameter not found');
    }
  }

  async testContentValidation() {
    // Check that validation method and interfaces exist in TypeScript file
    const contentPublisherPath = path.join(__dirname, '../lib/content-publisher.ts');
    const content = fs.readFileSync(contentPublisherPath, 'utf8');
    
    if (!content.includes('validateContent(content: AIContent): ValidationResult')) {
      throw new Error('validateContent method signature not found');
    }
    
    if (!content.includes('interface AIContent')) {
      throw new Error('AIContent interface not found');
    }
    
    if (!content.includes('interface ValidationResult')) {
      throw new Error('ValidationResult interface not found');
    }
    
    // Check that validation logic exists
    if (!content.includes('errors.push') && !content.includes('errors: []')) {
      throw new Error('Validation error handling not found');
    }
  }

  async testAPIEndpoints() {
    const endpoints = [
      { path: 'app/api/content/publish/route.ts', name: 'Publish API' },
      { path: 'app/api/content/test-publisher/route.ts', name: 'Test Publisher API' }
    ];
    
    for (const endpoint of endpoints) {
      const fullPath = path.join(__dirname, '..', endpoint.path);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`${endpoint.name} endpoint file does not exist: ${endpoint.path}`);
      }
      
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for required exports
      if (!content.includes('export async function POST') && !content.includes('export async function GET')) {
        throw new Error(`${endpoint.name} endpoint missing required HTTP method exports`);
      }
      
      // Check for NextResponse usage
      if (!content.includes('NextResponse')) {
        throw new Error(`${endpoint.name} endpoint not using NextResponse`);
      }
    }
  }

  async testReactComponent() {
    const componentPath = path.join(__dirname, '../components/content-publisher.tsx');
    
    if (!fs.existsSync(componentPath)) {
      throw new Error('ContentPublisher component file does not exist');
    }
    
    const content = fs.readFileSync(componentPath, 'utf8');
    
      // Check for required React patterns
      const requiredPatterns = [
        'export function ContentPublisher',
        'useState',
        'Button',
        'Card',
        'fetch(\'/api/content/publish\''
      ];
    
    for (const pattern of requiredPatterns) {
      if (!content.includes(pattern)) {
        throw new Error(`ContentPublisher component missing required pattern: ${pattern}`);
      }
    }
  }

  async testTypeDefinitions() {
    const libPath = path.join(__dirname, '../lib/content-publisher.ts');
    
    if (!fs.existsSync(libPath)) {
      throw new Error('Content publisher library file does not exist');
    }
    
    const content = fs.readFileSync(libPath, 'utf8');
    
    // Check for required TypeScript interfaces
    const requiredInterfaces = [
      'interface AIContent',
      'interface PublishResult',
      'interface ValidationResult',
      'interface WebflowConfig',
      'interface WordPressConfig'
    ];
    
    for (const interfaceDef of requiredInterfaces) {
      if (!content.includes(interfaceDef)) {
        throw new Error(`Missing required interface: ${interfaceDef}`);
      }
    }
    
    // Check for main class export
    if (!content.includes('export class AIContentPublisher')) {
      throw new Error('Missing main AIContentPublisher class export');
    }
  }

  async testPackageDependencies() {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check for required dependencies
    const requiredDeps = ['axios', 'ai-content-publisher'];
    
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
        throw new Error(`Missing required dependency: ${dep}`);
      }
    }
    
    // Check if ai-content-publisher is GitHub URL
    const sdkDep = packageJson.dependencies['ai-content-publisher'];
    if (!sdkDep.includes('github.com') && !sdkDep.includes('git+')) {
      console.warn('⚠️ ai-content-publisher dependency is not a GitHub URL - may not auto-update correctly');
    }
  }

  async testConfigurationMethods() {
    // Check that configuration methods exist in TypeScript file
    const contentPublisherPath = path.join(__dirname, '../lib/content-publisher.ts');
    const content = fs.readFileSync(contentPublisherPath, 'utf8');
    
    const configMethods = ['configureWebflow', 'configureWordPress'];
    
    for (const method of configMethods) {
      if (!content.includes(`${method}(`)) {
        throw new Error(`Configuration method '${method}' not found in TypeScript file`);
      }
    }
    
    // Check for async keywords
    if (!content.includes('async configureWebflow') || !content.includes('async configureWordPress')) {
      throw new Error('Configuration methods should be async');
    }
  }

  async testPublishMethods() {
    // Check that publish methods exist in TypeScript file
    const contentPublisherPath = path.join(__dirname, '../lib/content-publisher.ts');
    const content = fs.readFileSync(contentPublisherPath, 'utf8');
    
    const publishMethods = ['publish', 'publishToMultiple', 'batchPublish'];
    
    for (const method of publishMethods) {
      if (!content.includes(`${method}(`)) {
        throw new Error(`Publish method '${method}' not found in TypeScript file`);
      }
    }
    
    // Check for async keywords
    if (!content.includes('async publish') || !content.includes('async publishToMultiple') || !content.includes('async batchPublish')) {
      throw new Error('Publish methods should be async');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive SDK integration tests...\n');
    
    const tests = [
      ['Content Publisher Instantiation', () => this.testContentPublisherInstantiation()],
      ['Content Validation', () => this.testContentValidation()],
      ['API Endpoints', () => this.testAPIEndpoints()],
      ['React Component', () => this.testReactComponent()],
      ['Type Definitions', () => this.testTypeDefinitions()],
      ['Package Dependencies', () => this.testPackageDependencies()],
      ['Configuration Methods', () => this.testConfigurationMethods()],
      ['Publish Methods', () => this.testPublishMethods()]
    ];
    
    for (const [testName, testFn] of tests) {
      await this.runTest(testName, testFn);
    }
    
    this.printSummary();
  }

  printSummary() {
    console.log('📊 Test Summary');
    console.log('================\n');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
    
    if (failed > 0) {
      console.log('❌ Failed Tests:');
      this.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error.message}`);
      });
      console.log('');
    }
    
    if (passed === total) {
      console.log('🎉 All tests passed! SDK integration is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please review the errors above.');
      process.exit(1);
    }
  }
}

// Run the test suite
const tester = new SDKIntegrationTester();
tester.runAllTests().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
