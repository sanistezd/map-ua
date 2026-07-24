import { ProfileForm } from '@/features/profile/edit-profile';

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      <ProfileForm />
    </main>
  );
}
