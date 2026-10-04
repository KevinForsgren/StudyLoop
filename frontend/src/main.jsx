import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './styles.css'
import { api } from './api'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Performance from './pages/Performance'
import Progress from './pages/Progress'
import Timer from './pages/Timer'
import Layout from './components/Layout'

const THEME_KEY = 'studyloop_theme'
function initialTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark'
}
function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function Loading() {
  return (
    <div className="min-h-screen grid place-items-center">
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState(initialTheme)
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [startError, setStartError] = useState(null)

  applyTheme(theme)

  // Restore any persisted session (HttpOnly cookie) on first load.
  useEffect(() => {
    api
      .me()
      .then((d) => setUser(d.user))
      .catch((err) => {
        if (!err.unauthorized) setStartError(err.message)
      })
      .finally(() => setChecking(false))
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem(THEME_KEY, next)
  }

  async function logout() {
    try {
      await api.logout()
    } catch {
      /* cookie cleared client-leaning; still drop the local session */
    }
    setUser(null)
  }

  if (checking) return <Loading />

  if (!user) {
    return (
      <BrowserRouter>
        <Auth onAuthed={setUser} serverError={startError} />
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Layout user={user} theme={theme} onToggleTheme={toggleTheme} onLogout={logout}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('app')).render(<App />)