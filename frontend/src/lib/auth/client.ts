'use client';

import { createAuthClient } from '@neondatabase/auth/next';

export const authClient = createAuthClient({
  baseUrl: process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL,
});