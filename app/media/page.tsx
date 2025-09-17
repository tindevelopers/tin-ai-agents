'use client';

import { SessionProvider } from 'next-auth/react';
import BlogWriterLayout from '@/components/layout/BlogWriterLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, FileText, Video, Music } from 'lucide-react';

export default function MediaLibraryPage() {
  return (
    <SessionProvider>
      <BlogWriterLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Media Library
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your images, videos, and other media assets
            </p>
          </div>

          {/* Upload Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Media
              </CardTitle>
              <CardDescription>
                Drag and drop files here or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Drop files here or click to upload
                </p>
                <Button variant="outline">
                  Choose Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Media Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Sample Media Items */}
            {[
              { name: 'blog-featured-image.jpg', type: 'image', size: '2.4 MB', date: '2024-01-15' },
              { name: 'product-demo.mp4', type: 'video', size: '15.2 MB', date: '2024-01-14' },
              { name: 'podcast-intro.mp3', type: 'audio', size: '3.1 MB', date: '2024-01-13' },
              { name: 'infographic.pdf', type: 'document', size: '1.8 MB', date: '2024-01-12' },
            ].map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3">
                    {item.type === 'image' && <ImageIcon className="w-8 h-8 text-gray-400" />}
                    {item.type === 'video' && <Video className="w-8 h-8 text-gray-400" />}
                    {item.type === 'audio' && <Music className="w-8 h-8 text-gray-400" />}
                    {item.type === 'document' && <FileText className="w-8 h-8 text-gray-400" />}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm truncate">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {item.type}
                      </Badge>
                      <span className="text-xs text-gray-500">{item.size}</span>
                    </div>
                    <p className="text-xs text-gray-500">{item.date}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </BlogWriterLayout>
    </SessionProvider>
  );
}
