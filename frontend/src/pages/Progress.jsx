import { useEffect, useState } from 'react'
import { api } from '../api'

// GitHub-style contribution graph for the whole year.
// Uses the backend's performance endpoint over 365 days; each day becomes a
// cell colored by its completion intensity (0/25/50/75/100).
function level(p) {
  if (p <= 0) return 0
  if (p <= 25) return 25
  if (p <= 50) return 50
  if (p <= 75) return 75
  return 100
}

export default function Progress() {
  const [entries, setEntries] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const c = new AbortController()
    api
      .performance(365, c.signal)
      .then((d) => setEntries(d.daily || []))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message)
      })
    return () => c.abort()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your consistency over the last year. Each cell is a day.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <section className="bg-card border rounded-xl p-6 overflow-x-auto">
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity to show yet.</p>
        ) : (
          <div role="img" aria-label="Yearly consistency graph" className="flex flex-wrap gap-[3px]">
            {entries.map((d) => (
              <div
                key={d.date}
                title={`${d.date} · ${d.percent}% complete`}
                className="rounded-[3px]"
                style={{
                  width: 11,
                  height: 11,
                  background: `rgb(var(--graph-${level(d.percent)}))`,
                }}
              />
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Less</span>
          {[0, 25, 50, 75, 100].map((l) => (
            <span key={l} className="rounded-[2px]" style={{ width: 10, height: 10, background: `rgb(var(--graph-${l}))` }} />
          ))}
          <span>More</span>
        </div>
      </section>
    </div>
  )
}