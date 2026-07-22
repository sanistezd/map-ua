'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { createClient } from '@/shared/api/supabase/client';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Field, FieldContent, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

export function UpgradeForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // For anonymous users, updating email & password promotes them to a full account
      const { error } = await supabase.auth.updateUser({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Account upgraded successfully! Please verify your email.');
      router.push('/');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upgrade account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upgrade Account</CardTitle>
        <CardDescription>Upgrade your anonymous session to a full account to save your progress.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpgrade} className="space-y-4">
          <Field>
            <FieldLabel>Email</FieldLabel>
            <FieldContent>
              <Input
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Password</FieldLabel>
            <FieldContent>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </FieldContent>
          </Field>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Upgrading...' : 'Upgrade Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
