'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { apiRequest } from '@/shared/api/client';
import { createClient } from '@/shared/api/supabase/client';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Field, FieldContent, FieldLabel } from '@/shared/ui/field';
import { FileUpload } from '@/shared/ui/file-upload';
import { Input } from '@/shared/ui/input';

export function ProfileForm() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [userId, setUserId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await apiRequest<any>('/users/me');
      setUserId(user.id);
      setEmail(user.email || '');
      setDisplayName(user.displayName || '');
      setAvatarUrl(user.avatarUrl || '');
    } catch (error: any) {
      if (error?.code === 'auth.unauthorized') {
        window.location.href = '/login';
      } else {
        console.warn('Failed to load profile:', error?.message || 'Unknown error');
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiRequest('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ displayName, avatarUrl }),
      });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    
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
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      setAvatarUrl(data.publicUrl);
      toast.success('Avatar uploaded successfully. Remember to save your profile.');
    } catch (error: any) {
      toast.error(error.message || 'Error uploading avatar');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Update your profile information and avatar.</CardDescription>
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
                  <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border" />
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
                window.location.reload();
              }}
            >
              Sign Out
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
