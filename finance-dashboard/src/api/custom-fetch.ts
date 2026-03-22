import { getIdToken, refreshTokens, forceLogout } from '@/auth/auth'

const MAIN_BASE_URL = import.meta.env.VITE_MAIN_API_BASE_URL || '/api/v1/main'

export const mainFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  return customFetch<T>(MAIN_BASE_URL, url, options)
}

async function customFetch<T>(baseUrl: string, url: string, options: RequestInit): Promise<T> {
  const targetUrl = `${baseUrl}${url}`

  let res = await fetch(targetUrl, {
    ...options,
    headers: {
      Authorization: `Bearer ${getIdToken()}`,
      ...options.headers,
    },
  })

  // Retry with refreshed token on 401
  if (res.status === 401) {
    const refreshed = await refreshTokens()
    if (refreshed) {
      res = await fetch(targetUrl, {
        ...options,
        headers: {
          Authorization: `Bearer ${getIdToken()}`,
          ...options.headers,
        },
      })
    }
    if (res.status === 401) {
      forceLogout()
      return { data: undefined, status: 401, headers: res.headers } as T
    }
  }

  if (res.status === 204) {
    return { data: undefined, status: 204, headers: res.headers } as T
  }
  const data = await res.json()
  return { data, status: res.status, headers: res.headers } as T
}
