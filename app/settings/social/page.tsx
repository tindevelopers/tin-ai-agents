'use client';

import { SessionProvider } from 'next-auth/react';
import BlogWriterLayout from '@/components/layout/BlogWriterLayout';
import SocialMediaConfig from '@/components/social-media-config';

export default function SocialMediaSettingsPage() {
  return (
    <SessionProvider>
      <BlogWriterLayout>
        <div className="p-6">
          <SocialMediaConfig />
        </div>
      </BlogWriterLayout>
    </SessionProvider>
  );
}
