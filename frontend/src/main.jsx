import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { setToken, isAuthenticated } from './api'
import Auth from './components/Auth'
import Planner from './components/Planner'
import Performance from './components/Performance'
import Chat from './components/Chat'
import Pomodoro from './components/Pomodoro'

const THEME_KEY = 'studyloop_theme'

function initialTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark'
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

const NAV = [
  { id: 'planner', label: 'Planner', icon: '☑' },
  { id: 'performance', label: 'Performance', icon: '▤' },
  { id: 'assistant', label: 'Assistant', icon: '✦' },
  { id: 'timer', label: 'Focus timer', icon: '◷' },
]

const TITLES = {
  planner: 'Planner',
  performance: 'Performance',
  assistant: 'Assistant',
  timer: 'Focus timer',
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [view, setView] = useState('planner')
  const [theme, setTheme] = useState(initialTheme())
  const [notice, setNotice] = useState(null)

  applyTheme(theme)

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem(THEME_KEY, next)
  }

  function logout() {
    setToken(null)
    setAuthed(false)
  }

  function flash(msg) {
    setNotice(msg)
    setTimeout(() => setNotice(null), 2600)
  }

  if (!authed) {
    return <Auth onAuthed={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setView('planner') }}
            className="text-lg font-semibold tracking-tight"
          >
            StudyLoop
          </a>
          <nav className="flex gap-1" aria-label="Main navigation">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  view === n.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {n.icon} {n.label}
              </button>
            ))}
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground"
              aria-label="Toggle color theme"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>

      {notice && (
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-sm text-success">{notice}</p>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 py-8">
        {view === 'planner' && <Planner notify={flash} />}
        {view === 'performance' && <Performance />}
        {view === 'assistant' && <Chat />}
        {view === 'timer' && <Pomodoro />}
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-6">
        <p className="text-xs text-muted-foreground">
          StudyLoop · consistency over intensity
        </p>
      </footer>
    </div>
  )
}

createRoot(document.getElementById('app')).render(<App />)