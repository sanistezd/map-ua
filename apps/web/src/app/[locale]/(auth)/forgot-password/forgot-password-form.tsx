import Link from 'next/link';
('use client');

import { useState } from 'react';
import { toast } from 'sonner';

// eslint-disable-next-line no-restricted-imports
import { createClient } from '@/shared/api/supabase/client';
import { Button } from '@/shared/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui';
import { Field, FieldContent, FieldLabel } from '@/shared/ui';
import { Input } from '@/shared/ui';

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/reset-password`,
      });
      if (error) {
        throw error;
      }
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your email to receive a password reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleReset} className="space-y-4">
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending link...' : 'Send reset link'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Remember your password? <Link href=""></Link>
        </p>
      </CardFooter>
    </Card>
  );
}
