'use client';

import { SessionProvider } from 'next-auth/react';
import BlogWriterLayout from '@/components/layout/BlogWriterLayout';
import ApiConfiguration from '@/components/api-configuration';

export default function ApiSettingsPage() {
  return (
    <SessionProvider>
      <BlogWriterLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              API Configuration
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor and configure your blog writer API connections and endpoints
            </p>
          </div>
          
          <ApiConfiguration />
        </div>
      </BlogWriterLayout>
    </SessionProvider>
  );
}
