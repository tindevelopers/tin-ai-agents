/**
 * Universal Content Model - Platform-Agnostic Content Representation
 * This abstraction layer allows content to be adapted for multiple publishing platforms
 * while maintaining consistency and enabling intelligent backlink strategies.
 */

// =============================================================================
// CORE CONTENT TYPES
// =============================================================================

export interface UniversalContent {
  // Core content (platform-agnostic)
  title: string;
  content: string; // Markdown source - the canonical format
  excerpt: string;
  metaDescription: string;
  keywords: string[];
  tags: string[];

  // Media assets
  featuredImage?: string;
  bodyImages: ContentImage[];

  // SEO & Structure
  seoTitle: string;
  slug: string;
  headingStructure: ContentHeading[];

  // Internal linking data
  internalLinkOpportunities: LinkOpportunity[];
  externalLinkTargets: ExternalLink[];
  
  // Metadata
  author?: string;
  category?: string;
  publishedAt?: Date;
  updatedAt?: Date;
  language?: string;
  readingTime?: number; // estimated reading time in minutes
}

// =============================================================================
// CONTENT IMAGE TYPES
// =============================================================================

export interface ContentImage {
  id: string;
  url: string;
  altText: string;
  caption?: string;
  width?: number;
  height?: number;
  position: ImagePosition;
  placement: ImagePlacement;
  optimization: ImageOptimization;
}

export interface ImagePosition {
  type: 'inline' | 'featured' | 'gallery' | 'background';
  order: number; // order in content
  alignment?: 'left' | 'center' | 'right' | 'full-width';
}

export interface ImagePlacement {
  beforeHeading?: string; // heading text to place image before
  afterHeading?: string; // heading text to place image after
  paragraphIndex?: number; // specific paragraph to place after
  customMarker?: string; // custom markdown marker like [IMAGE:hero]
}

export interface ImageOptimization {
  cloudinaryUrl?: string;
  formats: string[]; // ['webp', 'jpg', 'png']
  sizes: ImageSize[];
  lazyLoad: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
}

export interface ImageSize {
  width: number;
  height: number;
  breakpoint?: 'mobile' | 'tablet' | 'desktop' | 'xl';
}

// =============================================================================
// CONTENT STRUCTURE TYPES
// =============================================================================

export interface ContentHeading {
  level: 1 | 2 | 3 | 4 | 5 | 6; // H1, H2, H3, etc.
  text: string;
  id: string; // for anchor links
  order: number; // position in content
  wordCount: number;
  keywords: string[]; // keywords found in this heading
  subsections: ContentHeading[]; // nested headings
}

// =============================================================================
// LINKING TYPES
// =============================================================================

export interface LinkOpportunity {
  id: string;
  sourceText: string; // text that should be linked
  targetType: 'internal' | 'external' | 'authority';
  targetUrl?: string; // if already determined
  anchorText: string; // suggested anchor text
  context: string; // surrounding paragraph context
  relevanceScore: number; // 0-1 relevance score
  position: LinkPosition;
  linkIntent: LinkIntent;
}

export interface LinkPosition {
  paragraphIndex: number;
  sentenceIndex: number;
  characterStart: number;
  characterEnd: number;
  headingContext?: string; // which heading section this falls under
}

export interface LinkIntent {
  type: 'definition' | 'reference' | 'example' | 'source' | 'related' | 'product' | 'service';
  purpose: 'seo' | 'user_experience' | 'authority' | 'conversion';
  priority: 'high' | 'medium' | 'low';
}

export interface ExternalLink {
  id: string;
  url: string;
  anchorText: string;
  domain: string;
  title?: string;
  description?: string;
  linkType: ExternalLinkType;
  nofollow: boolean;
  newTab: boolean;
  sponsored: boolean;
}

export interface ExternalLinkType {
  category: 'corporate' | 'authority' | 'source' | 'tool' | 'competitor' | 'partner';
  purpose: 'backlink' | 'attribution' | 'reference' | 'promotion';
  trustLevel: 'high' | 'medium' | 'low';
}

// =============================================================================
// PLATFORM ADAPTATION TYPES
// =============================================================================

export interface PlatformCapabilities {
  name: string;
  supportsInternalLinks: boolean;
  supportsCustomSlugs: boolean;
  supportsCategories: boolean;
  supportsTags: boolean;
  supportsFeaturedImages: boolean;
  supportsImageGalleries: boolean;
  supportsCustomFields: boolean;
  supportsHTMLContent: boolean;
  supportsMarkdownContent: boolean;
  supportsRichTextEditor: boolean;
  
  // Content limitations
  maxTitleLength?: number;
  maxExcerptLength?: number;
  maxContentLength?: number;
  maxTagsCount?: number;
  maxImagesCount?: number;
  
  // SEO capabilities
  supportsMetaDescription: boolean;
  supportsCustomMetaTags: boolean;
  supportsStructuredData: boolean;
  supportsCanonicalUrls: boolean;
  
  // Publishing features
  supportsScheduling: boolean;
  supportsDrafts: boolean;
  supportsVersioning: boolean;
  supportsCollaborativeEditing: boolean;
}

export interface PlatformContent {
  platform: string;
  adaptedContent: string; // platform-specific content format
  adaptedTitle: string;
  adaptedExcerpt: string;
  adaptedSlug: string;
  adaptedTags: string[];
  adaptedImages: AdaptedImage[];
  adaptedLinks: AdaptedLink[];
  platformSpecificFields: Record<string, any>;
  publishingSettings: PublishingSettings;
}

export interface AdaptedImage {
  originalId: string;
  platformUrl: string;
  platformId?: string;
  altText: string;
  caption?: string;
  position: string; // platform-specific position format
  customAttributes?: Record<string, any>;
}

export interface AdaptedLink {
  originalId: string;
  url: string;
  anchorText: string;
  attributes: LinkAttributes;
  platformSpecific?: Record<string, any>;
}

export interface LinkAttributes {
  rel?: string; // nofollow, noopener, etc.
  target?: string; // _blank, _self
  title?: string;
  class?: string;
  id?: string;
}

export interface PublishingSettings {
  status: 'draft' | 'published' | 'scheduled' | 'private';
  publishDate?: Date;
  author?: string;
  category?: string;
  visibility: 'public' | 'private' | 'password_protected';
  allowComments?: boolean;
  featured?: boolean;
  customFields?: Record<string, any>;
}

// =============================================================================
// CONTENT ANALYSIS TYPES
// =============================================================================

export interface ContentAnalysis {
  wordCount: number;
  readingTime: number; // minutes
  keywordDensity: KeywordDensity[];
  readabilityScore: number;
  seoScore: number;
  headingStructureScore: number;
  linkDistribution: LinkDistribution;
  imageOptimizationScore: number;
  contentQualityMetrics: ContentQualityMetrics;
}

export interface KeywordDensity {
  keyword: string;
  count: number;
  density: number; // percentage
  prominence: number; // weighted score based on position
  inTitle: boolean;
  inHeadings: boolean;
  inMetaDescription: boolean;
}

export interface LinkDistribution {
  totalLinks: number;
  internalLinks: number;
  externalLinks: number;
  authorityLinks: number;
  averageLinksPerParagraph: number;
  linkToContentRatio: number;
}

export interface ContentQualityMetrics {
  paragraphCount: number;
  averageParagraphLength: number;
  sentenceComplexity: number;
  vocabularyDiversity: number;
  topicalConsistency: number;
  expertiseIndicators: string[];
  originalityScore: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface ContentValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  platformCompatibility: PlatformCompatibilityCheck[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestions?: string[];
}

export interface ValidationWarning {
  field: string;
  message: string;
  impact: 'seo' | 'user_experience' | 'platform_compatibility';
  autoFixAvailable: boolean;
}

export interface PlatformCompatibilityCheck {
  platform: string;
  compatible: boolean;
  issues: string[];
  adaptationRequired: boolean;
  adaptationSuggestions?: string[];
}

// =============================================================================
// CONTENT TRANSFORMATION TYPES
// =============================================================================

export interface ContentTransformationOptions {
  targetPlatform: string;
  preserveFormatting: boolean;
  optimizeImages: boolean;
  adaptLinks: boolean;
  customizations?: Record<string, any>;
}

export interface ContentTransformationResult {
  success: boolean;
  transformedContent: PlatformContent;
  warnings: string[];
  errors: string[];
  metadata: TransformationMetadata;
}

export interface TransformationMetadata {
  transformedAt: Date;
  originalWordCount: number;
  transformedWordCount: number;
  linksProcessed: number;
  imagesProcessed: number;
  platform: string;
  version: string;
}
