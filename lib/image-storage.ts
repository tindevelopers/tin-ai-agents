import { v2 as cloudinary } from 'cloudinary';

// Image storage abstraction interface
export interface ImageStorageProvider {
  upload(buffer: Buffer, filename: string, options?: UploadOptions): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
  transform(url: string, transformations?: TransformOptions): string;
  getOptimizedUrl(publicId: string, options?: TransformOptions): string;
}

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  transformation?: TransformOptions;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  quality?: 'auto' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
}

export interface TransformOptions {
  width?: number;
  height?: number;
  crop?: 'scale' | 'fit' | 'fill' | 'lfill' | 'pad' | 'lpad' | 'mpad' | 'crop' | 'thumb' | 'limit';
  quality?: 'auto' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
  gravity?: 'auto' | 'face' | 'faces' | 'center' | 'north' | 'south' | 'east' | 'west';
  fetch_format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
}

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resourceType: string;
}

// Cloudinary implementation
export class CloudinaryProvider implements ImageStorageProvider {
  private isConfigured: boolean = false;

  constructor() {
    this.configure();
  }

  private configure() {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('⚠️ Cloudinary credentials not found. Image storage will use local fallback.');
      return;
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    this.isConfigured = true;
    console.log('✅ Cloudinary configured successfully');
  }

  async upload(buffer: Buffer, filename: string, options: UploadOptions = {}): Promise<UploadResult> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured. Please check your environment variables.');
    }

    try {
      // Use the exact same approach as the working direct upload
      const uploadOptions = {
        folder: options.folder || 'ai-blog-writer',
        tags: options.tags || ['ai-generated', 'blog-content'],
        resource_type: 'image' as const,
        public_id: filename.replace(/\.[^/.]+$/, ''), // Remove file extension
        overwrite: true
      };

      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        resourceType: result.resource_type
      };
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw new Error(`Failed to upload image to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(publicId: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured. Please check your environment variables.');
    }

    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`✅ Deleted image: ${publicId}`);
    } catch (error) {
      console.error('❌ Cloudinary delete error:', error);
      throw new Error(`Failed to delete image from Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  transform(url: string, transformations: TransformOptions = {}): string {
    if (!this.isConfigured) {
      return url; // Return original URL if not configured
    }

    const defaultTransformations = {
      quality: 'auto',
      fetch_format: 'auto',
      ...transformations
    };

    return cloudinary.url(url, {
      transformation: [defaultTransformations]
    });
  }

  getOptimizedUrl(publicId: string, options: TransformOptions = {}): string {
    if (!this.isConfigured) {
      return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
    }

    const defaultOptions = {
      quality: 'auto',
      fetch_format: 'auto',
      ...options
    };

    return cloudinary.url(publicId, {
      transformation: [defaultOptions]
    });
  }
}

// Local fallback implementation for development/testing
export class LocalStorageProvider implements ImageStorageProvider {
  private baseUrl: string;

  constructor(baseUrl: string = '/generated-images') {
    this.baseUrl = baseUrl;
  }

  async upload(buffer: Buffer, filename: string, options: UploadOptions = {}): Promise<UploadResult> {
    // This is a mock implementation for local storage
    // In a real scenario, you'd save to the filesystem
    const mockUrl = `${this.baseUrl}/${filename}`;
    
    return {
      url: mockUrl,
      publicId: filename.replace(/\.[^/.]+$/, ''),
      secureUrl: mockUrl,
      width: 1024, // Mock values
      height: 768,
      format: filename.split('.').pop() || 'jpg',
      bytes: buffer.length,
      resourceType: 'image'
    };
  }

  async delete(publicId: string): Promise<void> {
    console.log(`🗑️ Local delete: ${publicId}`);
    // Mock implementation
  }

  transform(url: string, transformations: TransformOptions = {}): string {
    return url; // No transformation for local storage
  }

  getOptimizedUrl(publicId: string, options: TransformOptions = {}): string {
    return `${this.baseUrl}/${publicId}`;
  }
}

// Factory function to get the appropriate provider
export function getImageStorageProvider(): ImageStorageProvider {
  const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                       process.env.CLOUDINARY_API_KEY && 
                       process.env.CLOUDINARY_API_SECRET;

  if (useCloudinary) {
    return new CloudinaryProvider();
  } else {
    console.warn('⚠️ Using local storage fallback. Configure Cloudinary for production.');
    return new LocalStorageProvider();
  }
}

// Utility functions
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url.includes('cloudinary.com')) {
    return null;
  }

  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
}

export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com');
}
