export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isAnonymous: boolean;
  role: string;
  createdAt: Date;
}
