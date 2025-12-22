import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    useSearchParams: () => ({
        get: vi.fn(),
    }),
    usePathname: () => '/',
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: { user: { name: 'Test User', email: 'test@example.com' } },
        status: 'authenticated',
    }),
    signIn: vi.fn(),
    signOut: vi.fn(),
}));
