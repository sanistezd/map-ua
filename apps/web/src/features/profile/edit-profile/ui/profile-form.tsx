'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/navigation';
import { apiRequest, createBrowserClient as createClient } from '@/shared/api';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldContent,
  FieldLabel,
  FileUpload,
  Input,
} from '@/shared/ui';

export function ProfileForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [userId, setUserId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const loadProfile = async () => {
    try {
      const user = (await apiRequest<unknown>('/users/me')) as Record<
        string,
        unknown
      >;
      setUserId(user.id as string);
      setEmail((user.email as string) || '');
      setDisplayName((user.displayName as string) || '');
      setAvatarUrl((user.avatarUrl as string) || '');
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)?.code === 'auth.unauthorized') {
        router.push('/login');
      } else {
        console.warn(
          'Failed to load profile:',
          (error as Error)?.message || 'Unknown error',
        );
      }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiRequest('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ displayName, avatarUrl }),
      });
      toast.success('Profile updated successfully');
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (files: File[]) => {
    if (!files.length) {
      return;
    }
    const file = files[0];

    if (!file) {
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      toast.success(
        'Avatar uploaded successfully. Remember to save your profile.',
      );
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Error uploading avatar');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Update your profile information and avatar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-6">
          <Field>
            <FieldLabel>Email (Read-only)</FieldLabel>
            <FieldContent>
              <Input type="email" value={email} disabled />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Display Name</FieldLabel>
            <FieldContent>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Avatar</FieldLabel>
            <FieldContent>
              {avatarUrl && (
                <div className="mb-4">
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover border"
                  />
                </div>
              )}
              <FileUpload
                title={isUploading ? 'Uploading...' : 'Upload Avatar'}
                subtitle="Drag and drop or click to upload a new avatar"
                onChange={handleAvatarUpload}
              />
            </FieldContent>
          </Field>
          <div className="flex justify-between">
            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
            >
              Sign Out
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-border mt-6">
          <h3 className="text-lg font-medium text-destructive mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={async () => {
              if (
                confirm(
                  'Are you sure you want to delete your account? This action cannot be undone.',
                )
              ) {
                setIsDeleting(true);
                try {
                  await apiRequest('/users/me', { method: 'DELETE' });
                  await supabase.auth.signOut();
                  router.push('/login');
                } catch (error: unknown) {
                  toast.error(
                    (error as Error).message || 'Failed to delete account',
                  );
                  setIsDeleting(false);
                }
              }
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
