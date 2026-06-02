'use client';

/**
 * apiFetch: Client-side fetch wrapper
 * 
 * Since all backend calls go through proxy routes (e.g., /api/proxy/agendamentos),
 * and those routes handle session extraction via auth.getSession(req),
 * we no longer need to manually manage tokens on the client.
 * 
 * The Neon Auth session cookies are automatically included in the request,
 * so the proxy routes can validate and extract the org ID + token from the session.
 */

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { skipAuth = false, headers = {}, ...rest } = options;
  const headersOut: Record<string, string> = { ...(headers as Record<string, string>) };

  // Cookies are sent automatically with fetch; no manual auth header needed
  // The /api/proxy/* routes handle session extraction via auth.getSession(req)

  return fetch(url, { ...rest, headers: headersOut });
}

export async function apiPost<T = any>(url: string, body?: any, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> {
  const res = await apiFetch(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`POST ${url} falhou: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function apiPut<T = any>(url: string, body?: any, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> {
  const res = await apiFetch(url, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`PUT ${url} falhou: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function apiDelete<T = any>(url: string, options?: Omit<FetchOptions, 'method'>): Promise<T> {
  const res = await apiFetch(url, { ...options, method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${url} falhou: ${res.status} ${res.statusText}`);
  return res.json();
}