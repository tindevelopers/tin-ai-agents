'use client';

import { SessionProvider } from 'next-auth/react';
import BlogWriterLayout from '@/components/layout/BlogWriterLayout';
import ContentIdeas from '@/components/content-ideas';

export default function ContentIdeasPage() {
  return (
    <SessionProvider>
      <BlogWriterLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Content Ideas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Generate creative content ideas and topics for your blog posts
            </p>
          </div>
          
          <ContentIdeas />
        </div>
      </BlogWriterLayout>
    </SessionProvider>
  );
}
