/** Framework-independent user representation shared across applications. */
export interface UserDto {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isAnonymous: boolean;
  role: string;
  createdAt: string;
}
