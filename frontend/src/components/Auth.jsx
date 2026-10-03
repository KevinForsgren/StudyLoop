import { useState } from 'react'
import { api, setToken } from '../api'

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      if (mode === 'register') {
        await api.register({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        })
        setNotice('Account created — you can log in now.')
        setMode('login')
        return
      }
      const res = await api.login({ username: form.username.trim(), password: form.password })
      setToken(res.access_token)
      onAuthed(res.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login')
    setError(null)
    setNotice(null)
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <p className="text-2xl font-semibold tracking-tight">StudyLoop</p>
          <p className="text-sm text-border" aria-hidden="true"></p>
          <p className="text-muted-foreground text-sm">
            Plan. Show up. Build consistency.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="bg-card border rounded-xl p-6 space-y-4"
        >
          <div className="flex border border-border rounded-lg" role="tablist">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setError(null)
                  setNotice(null)
                }}
                className={`flex-1 py-2 text-sm ${
                  mode === m
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground'
                }`}
                role="tab"
              >
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <label className="block text-sm">
              <span className="text-muted-foreground">Email</span>
              <input
                value={form.email}
                onChange={set('email')}
                type="email"
                required
                placeholder="you@example.com"
                className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-transparent"
              />
            </label>
          )}

          <label className="block text-sm">
            <span className="text-muted-foreground">Username</span>
            <input
              value={form.username}
              onChange={set('username')}
              autoComplete="username"
              required
              placeholder="username"
              className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-transparent"
            />
          </label>

          <label className="block text-sm">
            <span className="text-muted-foreground">Password</span>
            <input
              value={form.password}
              onChange={set('password')}
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              placeholder="••••••••"
              className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-transparent"
            />
          </label>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {notice && <p className="text-sm text-success">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {loading
              ? 'Please wait…'
              : mode === 'login'
                ? 'Log in'
                : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === 'login' ? "Don't have an account?" : "Already have one?"}{' '}
          <button
            type="button"
            onClick={switchMode}
            className="underline text-accent"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}