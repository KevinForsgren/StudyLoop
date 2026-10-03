import { useEffect, useState } from 'react'
import { api } from '../api'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function groupTasks(tasks) {
  const grouped = {}
  tasks.forEach((t) => {
    if (!grouped[t.plan_id]) grouped[t.plan_id] = { plan_id: t.plan_id, tasks: [], minutes: 0 }
    grouped[t.plan_id].tasks.push(t)
    grouped[t.plan_id].minutes += t.estimated_duration || 0
  })
  return Object.values(grouped).sort((a, b) => a.plan_id - b.plan_id)
}

export default function Planner({ notify }) {
  const [plans, setPlans] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [goal, setGoal] = useState('')

  async function load() {
    try {
      const res = await api.getTasks()
      setPlans(groupTasks(res.tasks || []))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  async function generateFromGoal(e) {
    e.preventDefault()
    const text = goal.trim()
    if (!text || busy) return
    setBusy(true)
    setError(null)
    try {
      let proposed
      try {
        proposed = await api.generatePlan(text)
      } catch (err) {
        setError(`${err.message} You can still build a plan manually.`)
        return
      }
      await api.createPlan({
        title: proposed.proposal.title,
        tasks: proposed.proposal.tasks,
      })
      setGoal('')
      await load()
      notify('Plan generated and saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function addManualPlan() {
    setBusy(true)
    setError(null)
    try {
      await api.createPlan({ title: `Plan · ${todayISO()}`, tasks: [] })
      await load()
      notify('Empty plan created — add tasks below.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function addTask(planId, e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const taskName = String(fd.get('task_name') || '').trim()
    if (!taskName) return
    const date = fd.get('date') || todayISO()
    const duration = Math.max(Number(fd.get('duration') || 30) || 30, 1)
    setBusy(true)
    setError(null)
    try {
      await api.createTask({ plan_id: planId, task_name: taskName, date, estimated_duration: duration })
      e.target.reset()
      await load()
      notify('Task added.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleTask(task) {
    try {
      if (!task.completed) await api.completeTask(task.id)
      else await api.updateTask(task.id, { completed: false })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteTask(task) {
    try {
      await api.deleteTask(task.id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Planner</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Build a plan from a goal with the assistant, or add tasks directly.
        </p>
      </div>

      <form className="bg-card border rounded-xl p-4 space-y-3" onSubmit={generateFromGoal}>
        <label className="block text-sm">
          <span className="text-muted-foreground">What do you want to accomplish?</span>
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
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>

      {plans.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No plans yet. Generate one with AI or start an empty plan.
        </p>
      )}

      <div className="space-y-4">
        {plans.map((plan) => (
          <section key={plan.plan_id} className="bg-card border rounded-xl p-4">
            <header className="flex justify-between">
              <h3 className="font-medium">Plan #{plan.plan_id}</h3>
              <span className="text-xs text-muted-foreground">
                {plan.tasks.length} task{plan.tasks.length === 1 ? '' : 's'} · {plan.minutes} min planned
              </span>
            </header>
            <ul className="mt-3 space-y-1">
              {plan.tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(t.completed)}
                    onChange={() => toggleTask(t)}
                    aria-label={`Mark ${t.task_name} complete`}
                    className="accent-[rgb(var(--accent))]"
                  />
                  <span className={t.completed ? 'line-through text-muted-foreground' : ''}>
                    {t.task_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.date} · {t.estimated_duration || 0} min
                  </span>
                  <button
                    onClick={() => deleteTask(t)}
                    className="ml-auto text-xs text-destructive hover:underline"
                    aria-label={`Delete ${t.task_name}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => addTask(plan.plan_id, e)}>
              <input name="task_name" placeholder="Add a task…" className="flex-1 min-w-40 px-3 py-2 border border-border rounded-md bg-transparent text-sm" />
              <input name="date" type="date" defaultValue={todayISO()} className="px-2 py-2 border border-border rounded-md bg-transparent text-sm" aria-label="Date" />
              <input name="duration" type="number" min="1" defaultValue="30" className="w-20 px-2 py-2 border border-border rounded-md bg-transparent text-sm" aria-label="Duration in minutes" />
              <button type="submit" className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm">Add</button>
            </form>
          </section>
        ))}
      </div>

      <button
        onClick={addManualPlan}
        disabled={busy}
        className="border border-border rounded-md px-4 py-2 text-sm text-secondary-foreground disabled:opacity-50"
      >
        + New empty plan
      </button>
    </div>
  )
}