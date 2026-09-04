'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardWithdrawalsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/withdrawal');
  }, [router]);

  return null;
}
