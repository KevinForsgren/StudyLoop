// Thin API client for the StudyLoop backend.
//
// Authentication uses an HttpOnly session cookie set by the backend on login.
// Requests are same-origin (the Vite dev server proxies /api -> the backend),
// so the browser sends the cookie automatically — no token in localStorage.
// Every request accepts an optional `AbortController` signal so a page can
// cancel in-flight work when the user navigates away.

const API_URL = import.meta.env.VITE_API_URL || '/api'
const UNREACHABLE = 'Cannot reach the StudyLoop server. Is the backend running?'

export async function request(method, path, body = undefined, { signal } = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    // Re-throw aborts so pages can clean up; everything else is unreachable.
    if (err && (err.name === 'AbortError' || err.message === 'canceled')) throw err
    throw new Error(UNREACHABLE)
  }

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { detail: text }
    }
  }

  if (!res.ok) {
    const detail =
      (data && (data.detail || data.message)) || `Request failed (HTTP ${res.status})`
    const err = new Error(detail)
    err.status = res.status
    if (res.status === 401) err.unauthorized = true
    throw err
  }
  return data
}

export const api = {
  register: (b) => request('POST', '/auth/register', b),
  login: (b) => request('POST', '/auth/login', b),
  me: (signal) => request('GET', '/auth/me', undefined, { signal }),
  logout: () => request('POST', '/auth/logout'),
  changePassword: (b) => request('POST', '/auth/change-password', b),

  tasks: (signal) => request('GET', '/tasks/', undefined, { signal }),
  createTask: (b) => request('POST', '/tasks/', b),
  completeTask: (id, signal) => request('POST', `/tasks/${id}/complete`, undefined, { signal }),
  updateTask: (id, b) => request('PATCH', `/tasks/${id}`, b),
  deleteTask: (id) => request('DELETE', `/tasks/${id}`),

  createPlan: (b) => request('POST', '/plans/', b),
  generatePlan: (goal, signal) => request('POST', '/plans/generate', { goal }, { signal }),

  performance: (days, signal) =>
    request('GET', `/performance/?days=${days || 7}`, undefined, { signal }),
  generateReport: (b, signal) =>
    request('POST', '/performance/report', b || { days: 7 }, { signal }),

  chat: (message, signal) => request('POST', '/chat/', { message }, { signal }),
  chatHistory: (signal) => request('GET', '/chat/history', undefined, { signal }),
}