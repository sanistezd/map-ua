/* eslint-disable no-restricted-imports */
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { createClient } from '@/shared/api/supabase/client';

import { Button } from './button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card';

export function UpgradeBanner() {
  const supabase = createClient();
  const router = useRouter();
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.is_anonymous) {
        setIsAnonymous(true);
      }
    });
  }, [supabase.auth]);

  if (!isAnonymous) {
    return null;
  }

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-amber-800 dark:text-amber-400">
          Anonymous Session
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-500">
          You are currently logged in anonymously. If you log out or clear your
          browser data, your progress will be lost.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50"
          onClick={() => router.push('/upgrade')}
        >
          Upgrade to Full Account
        </Button>
      </CardContent>
    </Card>
  );
}
