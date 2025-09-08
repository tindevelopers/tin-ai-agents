import { getImageStorageProvider, ImageStorageProvider, UploadOptions, TransformOptions } from './image-storage';

// Image utility functions using the abstraction layer
export class ImageService {
  private provider: ImageStorageProvider;

  constructor() {
    this.provider = getImageStorageProvider();
  }

  /**
   * Upload an image buffer to the configured storage provider
   */
  async uploadImage(
    buffer: Buffer, 
    filename: string, 
    options: UploadOptions = {}
  ) {
    try {
      const result = await this.provider.upload(buffer, filename, options);
      console.log(`✅ Image uploaded successfully: ${result.publicId}`);
      return result;
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete an image from storage
   */
  async deleteImage(publicId: string) {
    try {
      await this.provider.delete(publicId);
      console.log(`✅ Image deleted successfully: ${publicId}`);
    } catch (error) {
      console.error('❌ Image deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get an optimized URL for an image
   */
  getOptimizedImageUrl(publicId: string, options: TransformOptions = {}) {
    return this.provider.getOptimizedUrl(publicId, options);
  }

  /**
   * Transform an image URL with specific transformations
   */
  transformImageUrl(url: string, transformations: TransformOptions = {}) {
    return this.provider.transform(url, transformations);
  }

  /**
   * Generate responsive image URLs for different screen sizes
   */
  getResponsiveImageUrls(publicId: string, baseOptions: TransformOptions = {}) {
    const sizes = [
      { width: 320, suffix: 'sm' },
      { width: 640, suffix: 'md' },
      { width: 1024, suffix: 'lg' },
      { width: 1920, suffix: 'xl' }
    ];

    return sizes.reduce((urls, size) => {
      urls[size.suffix] = this.provider.getOptimizedUrl(publicId, {
        ...baseOptions,
        width: size.width,
        crop: 'scale',
        quality: 'auto',
        fetch_format: 'auto'
      });
      return urls;
    }, {} as Record<string, string>);
  }

  /**
   * Generate a featured image URL with blog-specific optimizations
   */
  getFeaturedImageUrl(publicId: string, aspectRatio: '16:9' | '4:3' | '1:1' = '16:9') {
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
    const baseWidth = 1200;
    const baseHeight = Math.round((baseWidth * heightRatio) / widthRatio);

    return this.provider.getOptimizedUrl(publicId, {
      width: baseWidth,
      height: baseHeight,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });
  }

  /**
   * Generate a thumbnail URL
   */
  getThumbnailUrl(publicId: string, size: number = 300) {
    return this.provider.getOptimizedUrl(publicId, {
      width: size,
      height: size,
      crop: 'thumb',
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });
  }
}

// Singleton instance
export const imageService = new ImageService();

// Helper functions for common use cases
export async function uploadBlogImage(
  buffer: Buffer, 
  blogTitle: string, 
  imageType: 'featured' | 'body' = 'body'
) {
  const timestamp = Date.now();
  const sanitizedTitle = blogTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  const filename = `blog-${imageType}-${sanitizedTitle}-${timestamp}.jpg`;
  
  const options: UploadOptions = {
    folder: `ai-blog-writer/blog-images`,
    tags: ['ai-generated', 'blog-content', imageType],
    quality: 'auto',
    format: 'auto'
  };

  return imageService.uploadImage(buffer, filename, options);
}

export async function uploadClusterImage(
  buffer: Buffer, 
  clusterTitle: string, 
  clusterId: string
) {
  const timestamp = Date.now();
  const sanitizedTitle = clusterTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  const filename = `cluster-${sanitizedTitle}-${clusterId}-${timestamp}.jpg`;
  
  const options: UploadOptions = {
    folder: `ai-blog-writer/cluster-images`,
    tags: ['ai-generated', 'cluster-content', clusterId],
    quality: 'auto',
    format: 'auto'
  };

  return imageService.uploadImage(buffer, filename, options);
}

// Type definitions for better TypeScript support
export interface BlogImageUpload {
  url: string;
  publicId: string;
  filename: string;
  type: 'featured' | 'body';
  altText?: string;
  placement?: string;
}

export interface ClusterImageUpload {
  url: string;
  publicId: string;
  filename: string;
  clusterId: string;
  promptUsed?: string;
}
