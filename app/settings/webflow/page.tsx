'use client';

import { SessionProvider } from 'next-auth/react';
import BlogWriterLayout from '@/components/layout/BlogWriterLayout';
import WebflowConfig from '@/components/webflow-config';
import WebflowTestPublisher from '@/components/webflow-test-publisher';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WebflowSettingsPage() {
  return (
    <SessionProvider>
      <BlogWriterLayout>
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="configuration" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="test">Test Publishing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="configuration" className="mt-6">
              <WebflowConfig />
            </TabsContent>
            
            <TabsContent value="test" className="mt-6">
              <WebflowTestPublisher />
            </TabsContent>
          </Tabs>
        </div>
      </BlogWriterLayout>
    </SessionProvider>
  );
}
