import { useEffect, useState } from 'react'
import { api } from '../api'

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function todayISO() {
  return toISO(new Date())
}
function currentWeekDates() {
  // Monday start of current week.
  const mon = new Date()
  mon.setHours(0, 0, 0, 0)
  mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { mon: toISO(mon), sun: toISO(sun) }
}
function shortDate(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function weekStreak(daily, today) {
  // Only days up to today count toward the streak (future days are empty).
  const rel = (daily || []).filter((d) => d.date <= today)
  let current = 0
  for (let i = rel.length - 1; i >= 0; i--) {
    if (rel[i].percent > 0) current++
    else break
  }
  let best = 0
  let run = 0
  for (const d of rel) {
    run = d.percent > 0 ? run + 1 : 0
    best = Math.max(best, run)
  }
  return { current, best }
}

function Donut({ percent, size = 160, stroke = 14 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - percent / 100)
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-muted/20"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-emerald-500"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-foreground">{Math.round(percent)}%</span>
        <span className="text-xs text-muted-foreground uppercase font-medium mt-0.5">Completed</span>
      </div>
    </div>
  )
}

function LegendItem({ dotClass, label, value }) {
  return (
    <div className="flex items-center justify-between gap-6 text-sm mb-3 last:mb-0 w-full">
      <div className="flex items-center gap-2.5">
        <div className={`w-3 h-3 rounded-full ${dotClass}`} />
        <span className="text-muted-foreground font-medium">{label}</span>
      </div>
      <span className="font-bold tabular-nums text-base">{value}</span>
    </div>
  )
}

function StreakBars({ daily }) {
  // daily is the current week (Mon..Sun). Each bar fills with that day's
  // completion percentage.
  const days = (Array.isArray(daily) && daily.length === 7 ? daily : Array(7).fill({ percent: 0, date: null }))

  return (
    <div className="flex items-end justify-between mt-auto h-40 gap-3 pt-6">
      {days.map((d, i) => {
        let dayLabel = 'DAY'
        if (d.date) {
          try {
            dayLabel = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
          } catch (e) {
            dayLabel = d.date.substring(0, 3)
          }
        }
        const height = Math.max(Number(d.percent) || 0, 0)

        return (
          <div key={i} className="flex flex-col items-center gap-3 flex-1 h-full">
            <div className="w-full max-w-[16px] bg-muted/30 rounded-full h-full flex items-end overflow-hidden">
              <div
                className="w-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">{dayLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

const CalendarIcon = () => (
  <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

export default function Performance() {
  const [data, setData] = useState(null)
  const [report, setReport] = useState(null)
  const [reportExists, setReportExists] = useState(false)
  const [reportPeriod, setReportPeriod] = useState(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const c = new AbortController()
    const { mon, sun } = currentWeekDates()

    api
      .performanceRange(mon, sun, c.signal)
      .then(setData)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message)
      })

    // Check whether the previous week's report already exists.
    api
      .performanceReport()
      .then((d) => {
        setReportPeriod([d.period_start, d.period_end])
        if (d.report) {
          setReport({ report: d.report })
          setReportExists(true)
        }
      })
      .catch(() => {})

    return () => c.abort()
  }, [])

  async function generate() {
    setLoadingReport(true)
    setError(null)
    try {
      const r = await api.generateReport()
      setReport(r)
      setReportExists(true)
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message)
    } finally {
      setLoadingReport(false)
    }
  }

  const s = data || {}
  const { current, best } = weekStreak(s.daily, todayISO())
  const done = s.completed || 0
  const total = s.total_assigned || 0
  const remaining = s.incomplete || 0

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-4 md:p-8">
      <div className="flex justify-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground bg-background px-6 py-2 rounded-xl">
          Performance
        </h1>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-base text-center font-medium">
          {error}
        </div>
      )}

      {/* Strict Grid to ensure identical dimensions */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 auto-rows-fr">
        {/* Weekly Progress Card */}
        <section className="bg-card border rounded-[2rem] p-8 shadow-sm flex flex-col min-h-[380px]">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-muted/30 rounded-xl">
              <CalendarIcon />
            </div>
            <div>
              <h2 className="text-xl font-semibold leading-none">Weekly Progress</h2>
              <p className="text-base text-muted-foreground mt-1.5">This week (Mon - Sun)</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <Donut percent={s.completion_percentage || 0} />

            <div className="flex flex-col flex-1 ml-10">
              <LegendItem dotClass="bg-emerald-500" label="Completed" value={done} />
              <LegendItem dotClass="bg-muted-foreground/30" label="Remaining" value={remaining} />
              <div className="h-px bg-border my-3 w-full" />
              <LegendItem dotClass="bg-transparent" label="Total" value={total} />
            </div>
          </div>
        </section>

        {/* Current Streak Card */}
        <section className="bg-card border rounded-[2rem] p-8 shadow-sm flex flex-col min-h-[380px]">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Current Streak</h2>
            <p className="text-base text-muted-foreground">Keep the momentum going!</p>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold tracking-tight">{current}</span>
              <span className="text-2xl text-muted-foreground font-medium">days</span>
            </div>
            <p className="text-base text-muted-foreground mt-2 font-medium">Best: {best} days</p>
          </div>

          <StreakBars daily={s.daily} />
        </section>

        {/* Weekly Performance / Report Card */}
        <section className="bg-card border rounded-[2rem] p-8 shadow-sm flex flex-col min-h-[380px]">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-muted/30 rounded-xl">
              <DocumentIcon />
            </div>
            <div>
              <h2 className="text-xl font-semibold leading-none">Weekly Performance</h2>
              <p className="text-base text-muted-foreground mt-1.5">Last week's summary</p>
            </div>
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-6 mt-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-500 text-white rounded-lg p-1.5">
                <DocumentIcon />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {reportExists ? 'Report available' : 'No report yet'}
              </h3>
            </div>
            <p className="text-base text-muted-foreground mb-6">
              {reportPeriod ? `${shortDate(reportPeriod[0])} – ${shortDate(reportPeriod[1])}` : 'Last week'}
            </p>

            <button
              onClick={generate}
              disabled={loadingReport || reportExists}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-base font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
            >
              {loadingReport ? 'Writing…' : reportExists ? 'View Report' : 'Generate Report'}
              <span className="text-xl leading-none">›</span>
            </button>
          </div>
        </section>
      </div>

      {report && (
        <section className="bg-card border rounded-[2rem] p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-5">
            <h2 className="text-xl font-semibold">Performance Report</h2>
            <div className="flex items-center gap-3 text-base text-muted-foreground">
              <span className="bg-card px-3 py-1.5 rounded-lg">{report.report.period_start} → {report.report.period_end}</span>
              <span>•</span>
              <span className="font-medium">{report.report.performance_percentage}%</span>
              <span>•</span>
              <span className="capitalize">{report.report.performance_status}</span>
            </div>
          </header>
          <p className="text-base leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {report.report.content}
          </p>
        </section>
      )}
    </div>
  )
}