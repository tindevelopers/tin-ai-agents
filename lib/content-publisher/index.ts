// Main exports for the Content Publisher SDK integration

export { AIContentPublisher } from './content-publisher';
export { ContentValidator } from './content-validator';
export { ContentTester } from './content-tester';
export { ContentScheduler } from './content-scheduler';

// Platform publishers
export { WebflowPublisher } from './platforms/webflow-publisher';
export { SocialMediaPublisher } from './platforms/social-media-publisher';

// Types
export type {
  AIContent,
  PublishResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  PlatformConfig,
  ContentTestResult,
  ScheduleConfig,
  BulkPublishConfig,
  ContentManagerConfig,
  WebflowConfig,
  WordPressConfig,
  SocialMediaConfig,
  ContentImage,
  FAQItem,
  ProductSpecification
} from './types';

// Utility functions
export const createAIContentPublisher = () => new AIContentPublisher();

export const validateContent = (content: AIContent) => {
  const validator = new ContentValidator();
  return validator.validate(content);
};

export const testContentForPlatform = async (content: AIContent, platform: string) => {
  const tester = new ContentTester();
  return await tester.testForPlatform(content, platform);
};
