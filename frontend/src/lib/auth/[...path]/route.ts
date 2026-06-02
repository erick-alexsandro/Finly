import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // For now, just redirect to dashboard
  // The auth library should handle session automatically via cookies
  return NextResponse.redirect(new URL('/dashboard', request.url));
}