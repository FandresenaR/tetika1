'use client';

import dynamic from 'next/dynamic';

const InteractiveScraper = dynamic(() => import('@/components/InteractiveScraper'), {
  ssr: false,
});

export default function InteractiveScraperPage() {
  return <InteractiveScraper />;
}
