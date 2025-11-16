import type { User as FirebaseAuthUser } from 'firebase/auth';

import type { User } from '@/features/auth/types';

export const mapFirebaseUser = (firebaseUser: FirebaseAuthUser | null): User | null => {
  if (!firebaseUser) {
    return null;
  }

  const provider = firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email';

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    name: firebaseUser.displayName ?? firebaseUser.email ?? 'Student',
    photoURL: firebaseUser.photoURL ?? undefined,
    provider,
    createdAt: firebaseUser.metadata.creationTime ?? new Date().toISOString(),
  };
};
