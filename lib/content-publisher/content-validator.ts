import { AIContent, ValidationResult, ValidationError, ValidationWarning } from './types';

export class ContentValidator {
  validate(content: AIContent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validation
    if (!content.title || content.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!content.content || content.content.trim().length === 0) {
      errors.push({
        field: 'content',
        message: 'Content is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!content.type) {
      errors.push({
        field: 'type',
        message: 'Content type is required',
        code: 'REQUIRED_FIELD'
      });
    }

    // Type-specific validation
    this.validateByType(content, errors, warnings);

    // SEO validation
    this.validateSEO(content, errors, warnings);

    // Length validation
    this.validateLengths(content, errors, warnings);

    // Image validation
    this.validateImages(content, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private validateByType(content: AIContent, errors: ValidationError[], warnings: ValidationWarning[]): void {
    switch (content.type) {
      case 'blog':
        this.validateBlogContent(content, errors, warnings);
        break;
      case 'faq':
        this.validateFAQContent(content, errors, warnings);
        break;
      case 'social-post':
        this.validateSocialContent(content, errors, warnings);
        break;
      case 'product-description':
        this.validateProductContent(content, errors, warnings);
        break;
    }
  }

  private validateBlogContent(content: AIContent, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Blog-specific validation
    if (!content.excerpt) {
      warnings.push({
        field: 'excerpt',
        message: 'Blog posts should have an excerpt for better SEO',
        code: 'MISSING_EXCERPT'
      });
    }

    if (!content.categories || content.categories.length === 0) {
      warnings.push({
        field: 'categories',
        message: 'Blog posts should have at least one category',
        code: 'MISSING_CATEGORIES'
      });
    }

    if (content.content.length < 300) {
      warnings.push({
        field: 'content',
        message: 'Blog posts should be at least 300 characters for better SEO',
        code: 'SHORT_CONTENT'
      });
    }
  }

  private validateFAQContent(content: AIContent, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!content.faqs || content.faqs.length === 0) {
      errors.push({
        field: 'faqs',
        message: 'FAQ content must have at least one FAQ item',
        code: 'MISSING_FAQS'
      });
      return;
    }

    content.faqs.forEach((faq, index) => {
      if (!faq.question || faq.question.trim().length === 0) {
        errors.push({
          field: `faqs[${index}].question`,
          message: 'FAQ question is required',
          code: 'REQUIRED_FIELD'
        });
      }

      if (!faq.answer || faq.answer.trim().length === 0) {
        errors.push({
          field: `faqs[${index}].answer`,
          message: 'FAQ answer is required',
          code: 'REQUIRED_FIELD'
        });
      }
    });
  }

  private validateSocialContent(content: AIContent, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Social media character limits
    const platforms = content.socialPlatforms || [];
    
    platforms.forEach(platform => {
      const limit = this.getSocialCharacterLimit(platform);
      if (limit && content.content.length > limit) {
        errors.push({
          field: 'content',
          message: `Content exceeds ${platform} character limit of ${limit}`,
          code: 'CONTENT_TOO_LONG'
        });
      }
    });

    // Hashtag validation
    if (content.hashtags && content.hashtags.length > 10) {
      warnings.push({
        field: 'hashtags',
        message: 'Too many hashtags may reduce engagement',
        code: 'TOO_MANY_HASHTAGS'
      });
    }
  }

  private validateProductContent(content: AIContent, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!content.specifications || content.specifications.length === 0) {
      warnings.push({
        field: 'specifications',
        message: 'Product descriptions should include specifications',
        code: 'MISSING_SPECIFICATIONS'
      });
    }

    if (!content.images || content.images.length === 0) {
      warnings.push({
        field: 'images',
        message: 'Product descriptions should include images',
        code: 'MISSING_IMAGES'
      });
    }
  }

  private validateSEO(content: AIContent, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!content.seo) {
      warnings.push({
        field: 'seo',
        message: 'SEO metadata is recommended for better search visibility',
        code: 'MISSING_SEO'
      });
      return;
    }

    const { seo } = content;

    // Meta title validation
    if (seo.metaTitle) {
      if (seo.metaTitle.length > 60) {
        warnings.push({
          field: 'seo.metaTitle',
          message: 'Meta title should be under 60 characters',
          code: 'META_TITLE_TOO_LONG'
        });
      }
    } else {
      warnings.push({
        field: 'seo.metaTitle',
        message: 'Meta title is recommended for SEO',
        code: 'MISSING_META_TITLE'
      });
    }

    // Meta description validation
    if (seo.metaDescription) {
      if (seo.metaDescription.length > 160) {
        warnings.push({
          field: 'seo.metaDescription',
          message: 'Meta description should be under 160 characters',
          code: 'META_DESCRIPTION_TOO_LONG'
        });
      }
    } else {
      warnings.push({
        field: 'seo.metaDescription',
        message: 'Meta description is recommended for SEO',
        code: 'MISSING_META_DESCRIPTION'
      });
    }
  }

  private validateLengths(content: AIContent, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Title length
    if (content.title.length > 100) {
      warnings.push({
        field: 'title',
        message: 'Title is quite long, consider shortening for better readability',
        code: 'TITLE_TOO_LONG'
      });
    }

    // Excerpt length
    if (content.excerpt && content.excerpt.length > 300) {
      warnings.push({
        field: 'excerpt',
        message: 'Excerpt should be concise (under 300 characters)',
        code: 'EXCERPT_TOO_LONG'
      });
    }
  }

  private validateImages(content: AIContent, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!content.images || content.images.length === 0) {
      return;
    }

    content.images.forEach((image, index) => {
      if (!image.url) {
        errors.push({
          field: `images[${index}].url`,
          message: 'Image URL is required',
          code: 'REQUIRED_FIELD'
        });
      }

      if (!image.alt) {
        warnings.push({
          field: `images[${index}].alt`,
          message: 'Alt text is recommended for accessibility and SEO',
          code: 'MISSING_ALT_TEXT'
        });
      }
    });
  }

  private getSocialCharacterLimit(platform: string): number | null {
    const limits: Record<string, number> = {
      'twitter': 280,
      'linkedin': 3000,
      'facebook': 63206,
      'instagram': 2200,
      'tumblr': 4096
    };

    return limits[platform.toLowerCase()] || null;
  }
}
