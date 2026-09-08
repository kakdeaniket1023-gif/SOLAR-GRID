'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-slate-400 font-mono text-xs">
      Redirecting to MLM Executive Dashboard...
    </div>
  );
}

