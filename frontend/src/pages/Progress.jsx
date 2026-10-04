import { useEffect, useState, useMemo } from 'react'
import { api } from '../api'

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

    // Dynamically calculate days for leap year
    const year = new Date().getFullYear()
    const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365

    api
      .performance(daysInYear, c.signal)
      .then((d) => setEntries(d?.daily || []))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message || 'Failed to load progress')
      })
    return () => c.abort()
  }, [])

  // Process entries into 7-day columns and compute month headers safely
  const { weeks, monthLabels } = useMemo(() => {
    if (!Array.isArray(entries) || entries.length === 0) {
      return { weeks: [], monthLabels: [] }
    }

    const weeksList = []
    let currentWeek = []
    const monthMap = []
    let lastSeenMonth = -1

    entries.forEach((day, index) => {
      const weekIndex = Math.floor(index / 7)
      
      // Parse date safely
      if (day && day.date) {
        const dayDate = new Date(day.date)
        if (!isNaN(dayDate.getTime())) {
          const monthIndex = dayDate.getMonth()
          // Identify when a new month starts to place the label above the column
          if (monthIndex !== lastSeenMonth) {
            const monthName = dayDate.toLocaleString('default', { month: 'short' })
            monthMap.push({ weekIndex, name: monthName })
            lastSeenMonth = monthIndex
          }
        }
      }

      currentWeek.push(day)

      if (currentWeek.length === 7 || index === entries.length - 1) {
        weeksList.push(currentWeek)
        currentWeek = []
      }
    })

    return { weeks: weeksList, monthLabels: monthMap }
  }, [entries])

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
          <div className="inline-block min-w-max">
            {/* Month Header Row */}
            <div className="relative h-5 mb-1 text-[11px] text-muted-foreground">
              {monthLabels.map((m, idx) => (
                <span
                  key={idx}
                  className="absolute"
                  style={{ left: `${m.weekIndex * 14 + 32}px` }}
                >
                  {m.name}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              {/* Y-Axis Day Labels (Alternating Days) */}
              <div className="grid grid-rows-7 gap-[3px] text-[11px] text-muted-foreground pr-1 select-none">
                <span className="h-[11px] leading-[11px]"></span>
                <span className="h-[11px] leading-[11px]">Mon</span>
                <span className="h-[11px] leading-[11px]"></span>
                <span className="h-[11px] leading-[11px]">Wed</span>
                <span className="h-[11px] leading-[11px]"></span>
                <span className="h-[11px] leading-[11px]">Fri</span>
                <span className="h-[11px] leading-[11px]"></span>
              </div>

              {/* Matrix Grid */}
              <div
                role="img"
                aria-label="Yearly consistency graph"
                className="flex gap-[3px]"
              >
                {weeks.map((week, wIndex) => (
                  <div key={wIndex} className="grid grid-rows-7 gap-[3px]">
                    {week.map((d, dIndex) => (
                      <div
                        key={d?.date || `${wIndex}-${dIndex}`}
                        title={d?.date ? `${d.date} · ${d.percent}% complete` : ''}
                        className="rounded-[2px]"
                        style={{
                          width: 11,
                          height: 11,
                          background: `rgb(var(--graph-${level(d?.percent || 0)}))`,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend Bar */}
            <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
              <span>Less</span>
              {[0, 25, 50, 75, 100].map((l) => (
                <span
                  key={l}
                  className="rounded-[2px]"
                  style={{
                    width: 10,
                    height: 10,
                    background: `rgb(var(--graph-${l}))`,
                  }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}