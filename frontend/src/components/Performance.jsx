import { useEffect, useState } from 'react'
import { api } from '../api'
import Graph from './Graph'

export default function Performance() {
  const [data, setData] = useState(null)
  const [report, setReport] = useState(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    try {
      setData(await api.getPerformance(7))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  async function generate() {
    setLoadingReport(true)
    setError(null)
    try {
      setReport(await api.generateReport({ days: 7 }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingReport(false)
    }
  }

  const s = data || {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Performance</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your consistency over the last {data ? `${data.daily?.length || 7} days` : 'week'}.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="bg-card border rounded-xl p-5">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <Stat label="Completion" value={`${s.completion_percentage || 0}%`} />
          <Stat label="Assigned" value={s.total_assigned || 0} />
          <Stat label="Completed" value={s.completed || 0} />
          <Stat label="Trend" value={s.performance_status || '—'} />
        </div>
      </div>

      <section className="bg-card border rounded-xl p-5">
        <h3 className="font-medium mb-3">Consistency graph</h3>
        <Graph daily={data?.daily || []} />
        <p className="text-xs text-muted-foreground mt-2">
          {data?.period_start} → {data?.period_end}
        </p>
      </section>

      <section className="bg-card border rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Weekly report</h3>
          <button
            onClick={generate}
            disabled={loadingReport}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {loadingReport ? 'Writing…' : 'Generate report'}
          </button>
        </div>
        {report ? (
          <div className="space-y-2 text-sm leading-relaxed">
            <p className="text-center">
              <span className="text-muted-foreground">{report.report.period_start} → {report.report.period_end}</span>
              {' '}·{' '}
              <span className="font-medium">{report.report.performance_percentage}%</span>
              {' '}·{' '}
              <span className="text-muted-foreground">{report.report.performance_status}</span>
            </p>
            <p className="whitespace-pre-wrap">{report.report.content}</p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Generate a written summary of your recent performance.
          </p>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold tabular-nums mt-1">{value}</p>
    </div>
  )
}