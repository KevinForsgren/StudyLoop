import { useEffect, useState } from 'react'
import { api } from '../api'

function streakStats(daily) {
  // daily: [{date, percent, ...}] oldest -> newest. Count consecutive trailing
  // days with any activity (percent > 0) as the current streak.
  let current = 0
  for (let i = daily.length - 1; i >= 0; i--) {
    if (daily[i].percent > 0) current++
    else break
  }
  let best = 0
  let run = 0
  for (let i = 0; i < daily.length; i++) {
    run = daily[i].percent > 0 ? run + 1 : 0
    best = Math.max(best, run)
  }
  return { current, best }
}

function Donut({ percent, size = 180, stroke = 18 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - percent / 100)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--border))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-2xl font-semibold tabular-nums">{Math.round(percent)}%</span>
      </div>
    </div>
  )
}

export default function Performance() {
  const [data, setData] = useState(null)
  const [report, setReport] = useState(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const c = new AbortController()
    api
      .performance(7, c.signal)
      .then(setData)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message)
      })
    return () => c.abort()
  }, [])

  async function generate() {
    setLoadingReport(true)
    setError(null)
    try {
      setReport(await api.generateReport({ days: 7 }))
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message)
    } finally {
      setLoadingReport(false)
    }
  }

  const s = data || {}
  const { current, best } = streakStats(s.daily || [])
  const done = s.completed || 0
  const total = s.total_assigned || 0
  const remaining = s.incomplete || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
        <p className="text-muted-foreground text-sm mt-1">Last {data ? (s.daily?.length || 7) : 7} days</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-6 md:grid-cols-3">
        <section className="bg-card border rounded-xl p-5 flex flex-col items-center">
          <h2 className="font-medium">Weekly Progress</h2>
          <p className="text-xs text-muted-foreground">This week</p>
          <Donut percent={s.completion_percentage || 0} />
          <div className="flex gap-4 text-xs mt-2">
            <Stat n={done} label="Completed" />
            <Stat n={remaining} label="Remaining" />
            <Stat n={total} label="Total" />
          </div>
        </section>

        <section className="bg-card border rounded-xl p-5">
          <h2 className="font-medium">Current Streak</h2>
          <p className="text-sm text-success mt-1">Keep the momentum going!</p>
          <p className="text-4xl font-semibold tabular-nums mt-2">{current} {current === 1 ? 'day' : 'days'}</p>
          <p className="text-xs text-muted-foreground">Best: {best} days</p>
        </section>

        <section className="bg-card border rounded-xl p-5">
          <h2 className="font-medium">Weekly Performance</h2>
          <p className="text-xs text-muted-foreground mt-1">Last week's summary</p>
          <button
            onClick={generate}
            disabled={loadingReport}
            className="mt-4 w-full py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50"
          >
            {loadingReport ? 'Writing…' : 'View Report'}
          </button>
        </section>
      </div>

      {report && (
        <section className="bg-card border rounded-xl p-5">
          <header className="flex items-center justify-between">
            <h2 className="font-medium">Report</h2>
            <span className="text-xs text-muted-foreground">
              {report.report.period_start} → {report.report.period_end} · {report.report.performance_percentage}% · {report.report.performance_status}
            </span>
          </header>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{report.report.content}</p>
        </section>
      )}
    </div>
  )
}

function Stat({ n, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-base font-semibold tabular-nums">{n}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}