import { useEffect, useState } from 'react'

const MODES = {
  pomodoro: { label: 'Pomodoro', minutes: 25 },
  short: { label: 'Short break', minutes: 5 },
  long: { label: 'Long break', minutes: 15 },
}

function format(seconds) {
  const m = String(Math.floor(Math.max(seconds, 0) / 60)).padStart(2, '0')
  const s = String(Math.max(seconds, 0) % 60).padStart(2, '0')
  return `${m}:${s}`
}

const RADIUS = 96
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function Pomodoro() {
  const [mode, setMode] = useState('pomodoro')
  const [seconds, setSeconds] = useState(MODES.pomodoro.minutes * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    setSeconds(MODES[mode].minutes * 60)
    setRunning(false)
  }, [mode])

  useEffect(() => {
    if (!running) return
    if (seconds <= 0) {
      setRunning(false)
      return
    }
    const id = setTimeout(() => setSeconds(seconds - 1), 1000)
    return () => clearTimeout(id)
  }, [running, seconds])

  const total = MODES[mode].minutes * 60
  const progress = 1 - seconds / total
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  const finished = !running && seconds <= 0 && total >= seconds

  function start() {
    if (seconds <= 0) setSeconds(total)
    setRunning(!running)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Focus timer</h2>
        <p className="text-muted-foreground text-sm mt-1">
          A simple Pomodoro to stay in the flow without leaving the app.
        </p>
      </div>

      <div className="flex gap-2" role="listbox" aria-label="Timer mode">
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`px-3 py-1.5 rounded-md text-sm border ${
              mode === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-muted-foreground border-border'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-56 h-56">
          <svg width="224" height="224" viewBox="0 0 224 224" className="w-56 h-56">
            <circle
              cx="112"
              cy="112"
              r={RADIUS}
              fill="none"
              stroke="rgb(var(--border))"
              strokeWidth="10"
            />
            <circle
              cx="112"
              cy="112"
              r={RADIUS}
              fill="none"
              stroke="rgb(var(--primary))"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 112 112)"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span
              className={`text-5xl tabular-nums ${finished ? 'text-accent' : ''}`}
              aria-live="polite"
            >
              {format(seconds)}
            </span>
          </div>
        </div>
        <button
          onClick={start}
          className="mt-4 px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <p className="text-muted-foreground text-xs mt-2">
          {finished
            ? 'Session finished — take a breath, then continue.'
            : `${MODES[mode].label} · focused work`}
        </p>
      </div>
    </div>
  )
}