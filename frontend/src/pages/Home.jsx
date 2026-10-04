import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
function fmt(dateISO) {
  try {
    const d = new Date(`${dateISO}T00:00:00`)
    return d.toDateString().replace(/^\w+ /, '')
  } catch {
    return dateISO
  }
}
function displayName(u) {
  const name = (u && u.username) || 'friend'
  return name[0].toUpperCase() + name.slice(1)
}

export default function Home({ user }) {
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)
  const [goal, setGoal] = useState('')
  const active = useRef(null)

  async function load(signal) {
    try {
      const res = await api.tasks(signal)
      setTasks((res.tasks || []).filter((t) => t.date === todayISO()))
    } catch (err) {
      if (err.name === 'AbortError') return // aborted
      setError(err.message)
    }
  }

  useEffect(() => {
    const c = new AbortController()
    load(c.signal)
    return () => {
      // Cancel an in-flight AI generation (and any fetch) when leaving the page.
      if (active.current) active.current.abort()
      c.abort()
    }
  }, [])

  function currentPlanId() {
    return tasks.length ? tasks[0].plan_id : null
  }

  async function addTask(e) {
    e.preventDefault()
    const name = String(e.target.task_name.value || '').trim()
    if (!name) return
    const duration = Math.max(Number(e.target.duration.value || 30) || 30, 1)
    setBusy(true)
    setError(null)
    try {
      const planId = currentPlanId()
      if (planId) {
        await api.createTask({ plan_id: planId, task_name: name, date: todayISO(), estimated_duration: duration })
      } else {
        await api.createPlan({ title: `Plan · ${todayISO()}`, tasks: [{ task_name: name, date: todayISO(), estimated_duration: duration }] })
      }
      e.target.reset()
      await load()
      setNotice('Task added to today’s plan.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggle(t) {
    try {
      if (!t.completed) await api.completeTask(t.id, null)
      else await api.updateTask(t.id, { completed: false })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(t) {
    try {
      await api.deleteTask(t.id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function generateFromGoal(e) {
    e.preventDefault()
    const text = goal.trim()
    if (!text || busy) return
    setBusy(true)
    setError(null)
    const c = new AbortController()
    if (active.current) active.current.abort()
    active.current = c
    try {
      let proposed
      try {
        proposed = await api.generatePlan(text, c.signal)
      } catch (err) {
        if (err.name === 'AbortError') return
        setError(`${err.message} You can add tasks manually below.`)
        return
      }
      await api.createPlan({ title: proposed.proposal.title, tasks: proposed.proposal.tasks })
      setGoal('')
      await load()
      setNotice('Plan generated and added to your planner.')
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message)
    } finally {
      if (active.current === c) active.current = null
      setBusy(false)
    }
  }

  const done = tasks.filter((t) => t.completed).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {displayName(user)} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your goals. Your plans. Your progress.
        </p>
      </div>

      <form className="bg-card border rounded-xl p-4 space-y-3" onSubmit={generateFromGoal}>
        <label className="block text-sm">
          <span className="text-muted-foreground">Generate a plan from a goal</span>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={2}
            maxLength={400}
            placeholder="e.g. Prepare for my math exam this week"
            className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-transparent resize-none"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !goal.trim()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {busy ? 'Thinking…' : 'Generate plan'}
        </button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {notice && <p className="text-sm text-success">{notice}</p>}

      <section className="bg-card border rounded-xl">
        <header className="px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Today’s Plan</h2>
            <p className="text-xs text-muted-foreground">{fmt(todayISO())}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {done}/{tasks.length} done
          </span>
        </header>

        {tasks.length === 0 && (
          <p className="px-4 py-6 text-muted-foreground text-sm">
            Nothing planned today. Add a task below or generate a plan.
          </p>
        )}

        <ul className="divide-y divide-border">
          {tasks.map((t) => (
            <li key={t.id} className="px-4 py-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={Boolean(t.completed)}
                onChange={() => toggle(t)}
                aria-label={`Mark ${t.task_name} complete`}
                className="accent-[rgb(var(--accent))]"
              />
              <span className={t.completed ? 'line-through text-muted-foreground' : ''}>
                {t.task_name}
              </span>
              <span className="text-xs text-muted-foreground">{t.estimated_duration || 0} min</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  t.completed ? 'bg-success/15 text-success' : 'bg-muted/10 text-muted-foreground'
                }`}
              >
                {t.completed ? 'Completed' : 'Pending'}
              </span>
              <button
                onClick={() => remove(t)}
                className="ml-auto text-xs text-destructive hover:underline"
                aria-label={`Delete ${t.task_name}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        <form className="px-4 py-3 flex flex-wrap gap-2" onSubmit={addTask}>
          <input
            name="task_name"
            placeholder="Add a task to today…"
            className="flex-1 min-w-48 px-3 py-2 border border-border rounded-md bg-transparent text-sm"
            aria-label="Task name"
          />
          <input
            name="duration"
            type="number"
            min="1"
            defaultValue="30"
            className="w-24 px-2 py-2 border border-border rounded-md bg-transparent text-sm"
            aria-label="Duration in minutes"
          />
          <button
            type="submit"
            disabled={busy}
            className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
          >
            Add
          </button>
        </form>
      </section>
    </div>
  )
}