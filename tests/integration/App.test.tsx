import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { User as FirebaseUser } from 'firebase/auth';

import App from '@/App';

interface MockAuthState {
  user: FirebaseUser | null;
  idToken: string | null;
  loading: boolean;
}

const defaultAuthState: MockAuthState = {
  user: null,
  idToken: null,
  loading: false,
};

const mockAuthState: MockAuthState = { ...defaultAuthState };

const setMockAuthState = (overrides: Partial<MockAuthState>) => {
  Object.assign(mockAuthState, overrides);
};

const resetMockAuthState = () => {
  Object.assign(mockAuthState, defaultAuthState);
};

const createMockFirebaseUser = (): FirebaseUser =>
  ({
    uid: 'student-123',
    email: 'student@example.com',
    displayName: 'Demo Student',
    providerData: [{ providerId: 'password' }] as any,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    } as any,
  } as unknown as FirebaseUser);

vi.mock('@/common/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

describe('App Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    resetMockAuthState();
    window.history.pushState({}, '', '/');
  });

  const renderApp = () => render(<App />);

  it('renders login screen initially', () => {
    renderApp();
    expect(screen.getByText(/Student Mentor AI/i)).toBeInTheDocument();
  });

  it('shows onboarding after authentication when profile is incomplete', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'student-123',
        name: 'Demo Student',
        onboardingComplete: false,
        role: 'student',
      }),
    } as Response);

    setMockAuthState({
      user: createMockFirebaseUser(),
      idToken: 'test-token',
      loading: false,
    });

    renderApp();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    expect(await screen.findByText(/first name/i)).toBeInTheDocument();

    fetchSpy.mockRestore();
  });
});
