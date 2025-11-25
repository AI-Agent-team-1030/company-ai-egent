import { supabase } from './supabase'

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('API Client: Session error', error)
      // エラーがある場合でもリクエストを続行（認証なし）
    }

    const headers = new Headers(options.headers)

    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`)
    }

    return fetch(url, {
      ...options,
      headers,
    })
  } catch (error) {
    console.error('API Client: Failed to get session', error)
    // エラーが発生してもリクエストを続行
    return fetch(url, options)
  }
}

export async function apiGet(url: string): Promise<Response> {
  return apiRequest(url, { method: 'GET' })
}

export async function apiPost(
  url: string,
  body?: any
): Promise<Response> {
  return apiRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function apiPut(
  url: string,
  body?: any
): Promise<Response> {
  return apiRequest(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function apiDelete(url: string): Promise<Response> {
  return apiRequest(url, { method: 'DELETE' })
}
