import { useEffect, useState } from 'react'
import { api } from '../api'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 16 ? 'Good afternoon' : h < 20 ? 'Good evening' : 'Good night'
}

function displayName(u) {
  const name = (u && u.username) || 'Admin'
  return name[0].toUpperCase() + name.slice(1)
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function getStartOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  // Adjust so Monday is day 0, Sunday is day 6
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getEndOfWeek(startOfWeek) {
  const d = new Date(startOfWeek)
  d.setDate(d.getDate() + 6)
  return d
}

function formatWeekRange() {
  const start = getStartOfWeek()
  const end = getEndOfWeek(start)

  const startDay = start.toLocaleDateString('en-US', { weekday: 'short' })
  const startDate = start.getDate()
  const endDay = end.toLocaleDateString('en-US', { weekday: 'short' })
  const endDate = end.getDate()

  return `${startDay} ${startDate} - ${endDay} ${endDate}`
}

function getDateForDay(dayName) {
  const start = getStartOfWeek()
  const dayIndex = DAYS.indexOf(dayName)
  if (dayIndex === -1) return todayISO()
  
  const targetDate = new Date(start)
  targetDate.setDate(start.getDate() + dayIndex)
  return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`
}

export default function Home({ user }) {
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load(signal) {
    try {
      const res = await api.tasks(signal)
      setTasks(res.tasks || [])
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message)
    }
  }

  useEffect(() => {
    const c = new AbortController()
    load(c.signal)
    return () => {
      c.abort()
    }
  }, [])

  function currentPlanId() {
    return tasks.length ? tasks[0].plan_id : null
  }

  async function addTask(e) {
    e.preventDefault()
    const form = e.currentTarget
    const name = String(form.task_name.value || '').trim()
    if (!name) return
    const duration = Math.max(Number(form.duration.value || 30) || 30, 1)
    const selectedDay = form.day ? form.day.value : 'Monday'
    const computedDate = getDateForDay(selectedDay)

    setBusy(true)
    setError(null)
    try {
      const planId = currentPlanId()
      if (planId) {
        await api.createTask({
          plan_id: planId,
          task_name: name,
          date: computedDate,
          estimated_duration: duration,
          day: selectedDay,
        })
      } else {
        await api.createPlan({
          title: `Plan · ${computedDate}`,
          tasks: [
            {
              task_name: name,
              date: computedDate,
              estimated_duration: duration,
              day: selectedDay,
            },
          ],
        })
      }
      form.reset()
      await load()
      setNotice('Task added successfully.')
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

  async function toggleAllForDay(dayTasks, shouldComplete) {
    try {
      for (const t of dayTasks) {
        if (shouldComplete && !t.completed) {
          await api.completeTask(t.id, null)
        } else if (!shouldComplete && t.completed) {
          await api.updateTask(t.id, { completed: false })
        }
      }
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

  const groupedTasks = DAYS.reduce((acc, day) => {
    acc[day] = tasks.filter((t) => t.day === day || (!t.day && day === 'Monday'))
    return acc
  }, {})

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {displayName(user)} 👋
        </h1>
        <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
          <span>Current Week Plan</span>
          <span>{formatWeekRange()}</span>
        </div>
      </div>

      {/* Notifications */}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {notice && <p className="text-sm text-success">{notice}</p>}

      {/* Main Weekly Container */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-6 shadow-sm">
        {DAYS.map((day, index) => {
          const dayTasks = groupedTasks[day] || []
          const doneCount = dayTasks.filter((t) => t.completed).length
          const allCompleted = dayTasks.length > 0 && doneCount === dayTasks.length

          return (
            <div key={day} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allCompleted}
                    disabled={dayTasks.length === 0}
                    onChange={(e) => toggleAllForDay(dayTasks, e.target.checked)}
                    aria-label={`Mark all tasks for ${day} complete`}
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer disabled:opacity-40"
                  />
                  <h2 className="text-base font-medium">{day}</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {doneCount}/{dayTasks.length} done
                </span>
              </div>

              {dayTasks.length > 0 && (
                <div className="bg-background/50 border border-border rounded-lg overflow-hidden divide-y divide-border">
                  {dayTasks.map((t) => (
                    <div key={t.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(t.completed)}
                          onChange={() => toggle(t)}
                          aria-label={`Mark ${t.task_name} complete`}
                          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                        />
                        <span className={t.completed ? 'line-through text-muted-foreground' : ''}>
                          {t.task_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t.estimated_duration || 0} min
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            t.completed
                              ? 'bg-success/15 text-success'
                              : 'bg-muted/20 text-muted-foreground'
                          }`}
                        >
                          {t.completed ? 'Completed' : 'Pending'}
                        </span>
                        <button
                          onClick={() => remove(t)}
                          className="text-xs text-destructive hover:underline"
                          aria-label={`Delete ${t.task_name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {index < DAYS.length - 1 && <hr className="border-border my-3" />}
            </div>
          )
        })}
      </div>

      {/* Footer Add Task Section */}
      <footer className="bg-card border border-border rounded-xl p-4">
        <form className="flex flex-wrap items-center gap-3" onSubmit={addTask}>
          <select
            name="day"
            className="px-3 py-2 border border-border rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {DAYS.map((d) => (
              <option key={d} value={d} className="bg-card text-foreground">
                {d}
              </option>
            ))}
          </select>
          <input
            name="task_name"
            placeholder="Add a task to planner..."
            required
            className="flex-1 min-w-[200px] px-3 py-2 border border-border rounded-md bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Task name"
          />
          <input
            name="duration"
            type="number"
            min="1"
            defaultValue="30"
            className="w-20 px-3 py-2 border border-border rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Duration in minutes"
          />
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Add Task
          </button>
        </form>
      </footer>
    </div>
  )
}