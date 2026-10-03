// Thin API client for the StudyLoop backend.
// Reads the shared API base URL injected by Vite from the root .env.

const API_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const TOKEN_KEY = 'studyloop_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated() {
  return Boolean(getToken())
}

export async function request(method, path, body = undefined) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the StudyLoop server. Is the backend running?')
  }

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { detail: text }
    }
  }

  if (!response.ok) {
    const detail =
      (data && (data.detail || data.message)) ||
      `Request failed with status ${response.status}`
    throw new Error(detail)
  }
  return data
}

export const api = {
  register: (b) => request('POST', '/api/auth/register', b),
  login: (b) => request('POST', '/api/auth/login', b),
  changePassword: (b) => request('POST', '/api/auth/change-password', b),

  getTasks: () => request('GET', '/api/tasks'),
  createTask: (b) => request('POST', '/api/tasks', b),
  updateTask: (id, b) => request('PATCH', `/api/tasks/${id}`, b),
  deleteTask: (id) => request('DELETE', `/api/tasks/${id}`),
  completeTask: (id) => request('POST', `/api/tasks/${id}/complete`),

  createPlan: (b) => request('POST', '/api/plans', b),
  addTasks: (id, b) => request('POST', `/api/plans/${id}/add-tasks`, b),
  generatePlan: (goal) => request('POST', '/api/plans/generate', { goal }),

  getPerformance: (days = 7) => request('GET', `/api/performance?days=${days}`),
  generateReport: (b = { days: 7 }) => request('POST', '/api/performance/report', b),

  chat: (message) => request('POST', '/api/chat', { message }),
}