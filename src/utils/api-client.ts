export async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

export async function authPost(url: string, data?: unknown): Promise<Response> {
  return authFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function authGet(url: string): Promise<Response> {
  return authFetch(url, { method: 'GET' });
}
