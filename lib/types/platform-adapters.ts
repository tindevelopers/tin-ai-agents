/**
 * Platform Adapter Interfaces
 * Defines how content is adapted for different publishing platforms
 */

import {
  UniversalContent,
  PlatformContent,
  PlatformCapabilities,
  ContentTransformationOptions,
  ContentTransformationResult,
  LinkOpportunity,
  ExternalLink
} from './universal-content';

// =============================================================================
// CORE ADAPTER INTERFACE
// =============================================================================

export interface PlatformAdapter {
  readonly name: string;
  readonly version: string;
  readonly capabilities: PlatformCapabilities;
  
  // Content transformation
  transform(
    content: UniversalContent, 
    options?: ContentTransformationOptions
  ): Promise<ContentTransformationResult>;
  
  // Reverse transformation (for syncing back)
  reverse(
    platformContent: PlatformContent
  ): Promise<UniversalContent>;
  
  // Link generation
  generateBacklinks(
    content: UniversalContent,
    context: ProjectContext
  ): Promise<LinkStrategy>;
  
  // Validation
  validate(content: UniversalContent): Promise<ValidationResult>;
  
  // Publishing
  publish(
    adaptedContent: PlatformContent,
    publishingConfig: PublishingConfiguration
  ): Promise<PublishingResult>;
  
  // Content management
  update(
    contentId: string,
    adaptedContent: PlatformContent,
    publishingConfig: PublishingConfiguration
  ): Promise<PublishingResult>;
  
  delete(contentId: string): Promise<boolean>;
  
  // Status checking
  getPublishingStatus(contentId: string): Promise<PublishingStatus>;
}

// =============================================================================
// PLATFORM CONTEXT TYPES
// =============================================================================

export interface ProjectContext {
  projectId: string;
  projectName: string;
  primaryWebsite: string;
  industry: string;
  existingContent: ContentInventory;
  websiteScanData?: WebsiteScanData;
  backlinkStrategy: BacklinkStrategy;
  contentStrategy: ContentStrategy;
}

export interface ContentInventory {
  pillarPages: ContentReference[];
  subArticles: ContentReference[];
  externalContent: ContentReference[];
  linkableAssets: LinkableAsset[];
}

export interface ContentReference {
  id: string;
  title: string;
  url: string;
  slug: string;
  keywords: string[];
  contentType: 'pillar' | 'support' | 'product' | 'service' | 'about';
  linkPriority: number; // 1-10 priority for internal linking
}

export interface LinkableAsset {
  id: string;
  title: string;
  url: string;
  assetType: 'page' | 'tool' | 'resource' | 'download' | 'contact';
  linkValue: number; // SEO/conversion value
}

// =============================================================================
// LINKING STRATEGY TYPES
// =============================================================================

export interface LinkStrategy {
  internalLinks: ProcessedInternalLink[];
  externalLinks: ProcessedExternalLink[];
  restrictedLinks: RestrictedLink[];
  linkingRules: LinkingRules;
}

export interface ProcessedInternalLink {
  sourceText: string;
  targetUrl: string;
  anchorText: string;
  linkType: 'contextual' | 'navigational' | 'promotional';
  relevanceScore: number;
  position: LinkPosition;
  seoValue: number;
}

export interface ProcessedExternalLink {
  sourceText: string;
  targetUrl: string;
  anchorText: string;
  domain: string;
  linkPurpose: 'backlink' | 'authority' | 'reference' | 'source';
  attributes: {
    nofollow: boolean;
    newTab: boolean;
    sponsored: boolean;
  };
  position: LinkPosition;
}

export interface RestrictedLink {
  reason: string;
  originalOpportunity: LinkOpportunity;
  platformLimitation: string;
  alternatives?: string[];
}

export interface LinkingRules {
  maxInternalLinks: number;
  maxExternalLinks: number;
  requiredExternalLinks: string[]; // must-include URLs
  forbiddenDomains: string[];
  linkPositionPreferences: LinkPositionPreference[];
  anchorTextRules: AnchorTextRules;
}

export interface LinkPosition {
  paragraphIndex: number;
  sentenceIndex: number;
  characterPosition: number;
  headingContext?: string;
}

export interface LinkPositionPreference {
  position: 'introduction' | 'body' | 'conclusion';
  linkType: 'internal' | 'external';
  maxCount: number;
}

export interface AnchorTextRules {
  maxLength: number;
  avoidGeneric: boolean; // avoid "click here", "read more"
  includeKeywords: boolean;
  preferBrandNames: boolean;
}

// =============================================================================
// BACKLINK STRATEGY TYPES
// =============================================================================

export interface BacklinkStrategy {
  primaryTarget: string; // main website URL
  linkingApproach: LinkingApproach;
  platformSpecificRules: PlatformSpecificRule[];
  crossPlatformLinking: boolean;
  trackingParameters?: TrackingParameters;
}

export interface LinkingApproach {
  strategy: 'aggressive' | 'moderate' | 'conservative';
  internalLinkRatio: number; // 0-1, how much to prioritize internal links
  externalLinkRatio: number; // 0-1, how much to prioritize external links
  corporateLinkRequirement: boolean; // must include link to corporate site
  maxLinksPerArticle: number;
}

export interface PlatformSpecificRule {
  platform: string;
  allowInternalLinks: boolean;
  maxExternalLinks: number;
  requiredLinks: string[];
  forbiddenLinks: string[];
  linkAttributeRules: LinkAttributeRule[];
}

export interface LinkAttributeRule {
  linkType: 'internal' | 'external' | 'authority';
  requiredAttributes: Record<string, string>;
  forbiddenAttributes: string[];
}

export interface TrackingParameters {
  utmSource: string;
  utmMedium: string;
  utmCampaign?: string;
  customParameters?: Record<string, string>;
}

// =============================================================================
// CONTENT STRATEGY TYPES
// =============================================================================

export interface ContentStrategy {
  contentGoals: ContentGoal[];
  targetAudience: TargetAudience;
  contentPillars: ContentPillar[];
  distributionStrategy: DistributionStrategy;
  performanceMetrics: PerformanceMetric[];
}

export interface ContentGoal {
  type: 'awareness' | 'engagement' | 'conversion' | 'retention';
  priority: number;
  targetMetrics: string[];
  measurementPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface TargetAudience {
  demographics: Demographics;
  interests: string[];
  painPoints: string[];
  contentPreferences: ContentPreference[];
  platforms: string[];
}

export interface Demographics {
  ageRange?: string;
  location?: string[];
  industry?: string[];
  jobRoles?: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';
}

export interface ContentPreference {
  format: 'short' | 'medium' | 'long';
  style: 'formal' | 'conversational' | 'technical' | 'educational';
  mediaTypes: ('text' | 'images' | 'video' | 'infographics')[];
}

export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  targetPages: number; // how many articles to create
  priority: number;
  contentTypes: ContentType[];
}

export interface ContentType {
  type: 'pillar' | 'support' | 'how-to' | 'comparison' | 'listicle' | 'case-study';
  count: number;
  averageWordCount: number;
  linkingStrategy: 'heavy' | 'moderate' | 'light';
}

export interface DistributionStrategy {
  platforms: PlatformDistribution[];
  publishingSchedule: PublishingSchedule;
  crossPromotionRules: CrossPromotionRule[];
  contentSyndication: boolean;
}

export interface PlatformDistribution {
  platform: string;
  contentTypes: string[];
  publishingFrequency: string;
  adaptationLevel: 'minimal' | 'moderate' | 'heavy';
  customization: PlatformCustomization;
}

export interface PlatformCustomization {
  titleFormat?: string;
  contentStructure?: string;
  callToActionStyle?: string;
  linkingApproach?: string;
  imageStyle?: string;
}

export interface PublishingSchedule {
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  daysOfWeek: string[];
  timeOfDay: string;
  timezone: string;
  seasonalAdjustments?: SeasonalAdjustment[];
}

export interface SeasonalAdjustment {
  period: string;
  frequencyChange: string;
  contentFocus: string[];
}

export interface CrossPromotionRule {
  sourcePlatform: string;
  targetPlatforms: string[];
  promotionType: 'mention' | 'link' | 'embed' | 'reference';
  delay: number; // days to wait before cross-promotion
}

export interface PerformanceMetric {
  name: string;
  type: 'engagement' | 'traffic' | 'conversion' | 'seo';
  target: number;
  measurement: string;
  reportingFrequency: string;
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100 quality score
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  platformCompatibility: PlatformCompatibility[];
}

export interface ValidationError {
  code: string;
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoFixable: boolean;
}

export interface ValidationWarning {
  code: string;
  field: string;
  message: string;
  impact: 'seo' | 'readability' | 'engagement' | 'conversion';
  recommendation: string;
}

export interface ValidationSuggestion {
  type: 'content' | 'structure' | 'seo' | 'linking';
  suggestion: string;
  expectedImpact: 'high' | 'medium' | 'low';
  implementationDifficulty: 'easy' | 'medium' | 'hard';
}

export interface PlatformCompatibility {
  platform: string;
  compatible: boolean;
  adaptationRequired: string[];
  limitations: string[];
  recommendations: string[];
}

// =============================================================================
// PUBLISHING TYPES
// =============================================================================

export interface PublishingConfiguration {
  platform: string;
  credentials: PlatformCredentials;
  settings: PublishingSettings;
  workflow: PublishingWorkflow;
}

export interface PlatformCredentials {
  type: 'api_key' | 'oauth' | 'username_password' | 'token';
  credentials: Record<string, string>;
  expiresAt?: Date;
  refreshToken?: string;
}

export interface PublishingSettings {
  status: 'draft' | 'published' | 'scheduled' | 'private';
  publishDate?: Date;
  author?: string;
  category?: string;
  tags?: string[];
  visibility: 'public' | 'private' | 'password_protected';
  allowComments?: boolean;
  featured?: boolean;
  notifications?: NotificationSettings;
}

export interface NotificationSettings {
  emailOnPublish: boolean;
  socialMediaShare: boolean;
  webhookUrls: string[];
  slackChannel?: string;
}

export interface PublishingWorkflow {
  requiresReview: boolean;
  autoPublish: boolean;
  schedulingEnabled: boolean;
  versionControl: boolean;
  backupEnabled: boolean;
  rollbackEnabled: boolean;
}

export interface PublishingResult {
  success: boolean;
  contentId?: string;
  publishedUrl?: string;
  status: PublishingStatus;
  errors?: PublishingError[];
  warnings?: string[];
  metadata: PublishingMetadata;
}

export interface PublishingStatus {
  status: 'pending' | 'processing' | 'published' | 'failed' | 'scheduled';
  progress?: number; // 0-100
  message?: string;
  estimatedCompletion?: Date;
  retryCount?: number;
}

export interface PublishingError {
  code: string;
  message: string;
  field?: string;
  recoverable: boolean;
  suggestions?: string[];
}

export interface PublishingMetadata {
  publishedAt?: Date;
  platform: string;
  contentVersion: string;
  originalContentId: string;
  wordCount: number;
  imageCount: number;
  linkCount: number;
  processingTime: number; // milliseconds
}

// =============================================================================
// WEBSITE SCAN DATA TYPES
// =============================================================================

export interface WebsiteScanData {
  domain: string;
  scanDate: Date;
  pages: ScannedPage[];
  siteStructure: SiteStructure;
  linkingPatterns: LinkingPattern[];
  seoInsights: SEOInsights;
}

export interface ScannedPage {
  url: string;
  title: string;
  metaDescription?: string;
  headings: PageHeading[];
  wordCount: number;
  internalLinks: string[];
  externalLinks: string[];
  images: PageImage[];
  contentType: 'blog' | 'product' | 'service' | 'about' | 'contact' | 'other';
  seoScore: number;
  linkPotential: number; // how valuable this page is for linking
}

export interface PageHeading {
  level: number;
  text: string;
  keywords: string[];
}

export interface PageImage {
  src: string;
  alt: string;
  title?: string;
  optimized: boolean;
}

export interface SiteStructure {
  navigation: NavigationStructure;
  categories: ContentCategory[];
  taxonomies: Taxonomy[];
}

export interface NavigationStructure {
  primary: NavigationItem[];
  secondary?: NavigationItem[];
  footer?: NavigationItem[];
}

export interface NavigationItem {
  label: string;
  url: string;
  children?: NavigationItem[];
}

export interface ContentCategory {
  name: string;
  url: string;
  pageCount: number;
  keywords: string[];
}

export interface Taxonomy {
  type: 'category' | 'tag' | 'custom';
  name: string;
  terms: TaxonomyTerm[];
}

export interface TaxonomyTerm {
  name: string;
  slug: string;
  count: number;
  url?: string;
}

export interface LinkingPattern {
  pattern: string;
  frequency: number;
  effectiveness: number;
  examples: string[];
}

export interface SEOInsights {
  averagePageScore: number;
  commonIssues: SEOIssue[];
  opportunities: SEOOpportunity[];
  competitorComparison?: CompetitorComparison;
}

export interface SEOIssue {
  type: 'missing_meta' | 'duplicate_content' | 'broken_links' | 'slow_loading' | 'missing_headings';
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedPages: string[];
  recommendation: string;
}

export interface SEOOpportunity {
  type: 'internal_linking' | 'content_gaps' | 'keyword_optimization' | 'technical_seo';
  potential: 'high' | 'medium' | 'low';
  description: string;
  actionItems: string[];
  estimatedImpact: string;
}

export interface CompetitorComparison {
  competitors: string[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}
