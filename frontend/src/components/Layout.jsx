import { Link, NavLink } from 'react-router-dom'
import { CalendarDays, Home, LogOut, MessageSquare, Moon, Sun, Timer, TrendingUp } from 'lucide-react'

const NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/performance', label: 'Performance', icon: TrendingUp },
  { to: '/progress', label: 'Progress', icon: CalendarDays },
  { to: '/timer', label: 'Focus timer', icon: Timer },
]

function navClass({ isActive }) {
  return [
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
  ].join(' ')
}

function IconBox({ icon: I, size = 16 }) {
  return (
    <span className="w-5 inline-grid place-items-center" aria-hidden="true">
      <I size={size} strokeWidth={2} />
    </span>
  )
}

export default function Layout({ user, theme, onToggleTheme, onLogout, children }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-border flex flex-col shrink-0">
        <Link to="/" className="px-5 py-4 text-lg font-semibold tracking-tight">
          StudyLoop
        </Link>

        <nav className="mt-2 px-3 space-y-1" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={navClass}>
              <IconBox icon={n.icon} />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-5 pt-6 pb-5 text-center">
          <p className="text-sm leading-relaxed text-foreground/70 font-medium">
            Small steps every day lead to big results.
          </p>
          <p className="text-xs text-accent mt-1">Keep going!</p>
          <p className="text-[11px] text-muted-foreground mt-4 inline-flex items-center gap-1.5">
            <span
              className="rounded-full"
              style={{ width: 8, height: 8, background: 'rgb(var(--success))' }}
              aria-hidden="true"
            />
            System Online · v1.0.0
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border px-6 py-3 flex items-center justify-end gap-3">
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-md border border-border text-foreground hover:bg-secondary grid place-items-center"
            aria-label="Toggle color theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm">
            {user.username[0].toUpperCase()}
          </div>
          <span className="text-sm">{user.username}</span>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-md border border-border text-sm text-muted-foreground hover:bg-secondary inline-flex items-center gap-1.5"
          >
            <LogOut size={14} strokeWidth={2} aria-hidden="true" />
            Log out
          </button>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
      </div>
    </div>
  )
}