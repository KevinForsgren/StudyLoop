// GitHub-style consistency graph (UI.md §9). Renders one cell per day at an
// intensity derived from the day's completion percentage.
export function levelFor(percent) {
  if (percent <= 0) return 0
  if (percent <= 25) return 25
  if (percent <= 50) return 50
  if (percent <= 75) return 75
  return 100
}

export default function Graph({ daily = [] }) {
  return (
    <div className="flex flex-wrap gap-1" role="img" aria-label="Daily consistency graph">
      {daily.map((d) => (
        <div
          key={d.date}
          title={`${d.date} · ${d.percent}% complete`}
          className={`graph-cell graph-${levelFor(d.percent)}`}
        />
      ))}
      {daily.length === 0 && <span className="text-muted-foreground text-sm">No data yet.</span>}
    </div>
  )
}