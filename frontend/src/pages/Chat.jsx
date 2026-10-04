import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

// Coerce arbitrary API values into a flat string so React children never crash.
// (AI output is rendered as plain, pre-wrapped text.)
function toText(value) {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    // Prefer a nested string field if one is present (e.g. { content }, { response }).
    const pick = ['content', 'response', 'text', 'message'].find(
      (k) => typeof value[k] === 'string',
    )
    if (pick) return value[pick]
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

// When the AI decides to make a plan it returns a fenced ```json block of
// {tasks:[{task_name,date,estimated_duration}]}. Split it off so the user only
// sees the natural-language reply, and return the collected plan task arrays.
function extractPlans(text) {
  const raw = toText(text)
  const taskSets = []
  let visible = raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, (m, inner) => {
    try {
      const obj = JSON.parse(inner)
      if (obj && Array.isArray(obj.tasks)) taskSets.push(obj.tasks)
      else if (obj && typeof obj === 'object') taskSets.push([obj])
    } catch {
      // malformed JSON -> drop the block, don't crash
    }
    return ''
  })

  // Edge case: the whole response is a bare {tasks:[...]} JSON object.
  const trimmed = raw.trim()
  try {
    const obj = JSON.parse(trimmed)
    if (obj && Array.isArray(obj.tasks)) {
      taskSets.push(obj.tasks)
      visible = ''
    }
  } catch {
    /* not a bare JSON document */
  }
  return { visible: visible.trim(), taskSets }
}

// Accept only well-formed plan items (non-empty name + a date). Durations
// default to 30 min. Arbitrary natural-language text is ignored.
function normalizePlanTask(t) {
  if (!t || typeof t !== 'object') return null
  const name = String(t.task_name || t.name || '').trim()
  const date = String(t.date || '').trim()
  if (!name || !date) return null
  let dur = Number(t.estimated_duration ?? t.duration ?? 30)
  if (!Number.isFinite(dur) || dur <= 0) dur = 30
  return { task_name: name, date, estimated_duration: Math.floor(dur) }
}

// Create every plan task via the existing task API. The backend rejects past
// dates and over-limit durations, so those count as failed (skipped).
async function persistTasks(sets) {
  const seen = new Set()
  const tasks = []
  for (const set of sets) {
    for (const t of set || []) {
      const n = normalizePlanTask(t)
      if (!n) continue
      const key = `${n.task_name}|${n.date}`
      if (seen.has(key)) continue
      seen.add(key)
      tasks.push(n)
    }
  }
  let created = 0
  let failed = 0
  for (const t of tasks) {
    try {
      const r = await api.createTask(t)
      if (r && r.task) created++
    } catch (err) {
      if (err && err.name === 'AbortError') throw err
      failed++
    }
  }
  return { created, failed }
}

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const active = useRef(null)
  const endRef = useRef(null)

  useEffect(() => {
    const c = new AbortController()
    active.current = c
    api
      .chatHistory(c.signal)
      .then((d) => setHistory(d.chats || []))
      .catch(() => {})
    return () => {
      if (active.current) active.current.abort()
      c.abort()
    }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages])

  async function send(e) {
    if (e) e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setBusy(true)
    setError(null)
    setNotice(null)
    
    const c = new AbortController()
    if (active.current) active.current.abort()
    active.current = c
    
    try {
      const res = await api.chat(text, c.signal)
      const reply = toText(res.response)
      const { visible, taskSets } = extractPlans(reply)
      if (visible) {
        setMessages((m) => [...m, { role: 'assistant', content: visible }])
      }
      if (taskSets.length) {
        try {
          const { created, failed } = await persistTasks(taskSets)
          if (created > 0) {
            setNotice(
              `Added ${created} task${created === 1 ? '' : 's'} to your planner` +
                (failed ? ` · ${failed} skipped (past/invalid)` : '') +
                '.',
            )
          } else if (failed > 0) {
            setNotice('No tasks added — the proposed dates/values were invalid.')
          }
        } catch {
          /* keep chat stable if task creation fails */
        }
      }
      api.chatHistory().then((d) => setHistory(d.chats || [])).catch(() => {})
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Something went wrong')
      setMessages((m) => m.slice(0, -1))
    } finally {
      setBusy(false)
    }
  }

  function stopGeneration() {
    if (active.current) {
      active.current.abort()
      setBusy(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function loadHistory(m) {
    // Normalize history content to strings before rendering.
    setMessages([
      { role: 'user', content: toText(m.message) },
      { role: 'assistant', content: toText(m.response) },
    ])
  }

  return (
    <div className="w-[calc(100vw-15rem)] relative left-1/2 -translate-x-1/2 flex gap-6 px-6 h-[calc(100vh-9rem)] min-h-125">
      
      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-card z-10 shadow-sm">
          <h1 className="font-semibold text-lg">Assistant</h1>
          <p className="text-sm text-muted-foreground">Plan, brainstorm, and clarify your work.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm text-center">
                Start a conversation about what you want to get done.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`w-fit max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground self-end rounded-tr-sm'
                  : 'bg-secondary text-secondary-foreground self-start rounded-tl-sm shadow-sm border border-border/50'
              }`}
            >
              <div className="whitespace-pre-wrap">{toText(m.content)}</div>
            </div>
          ))}
          {busy && (
            <div className="w-fit max-w-[85%] px-5 py-3 rounded-2xl text-sm bg-secondary text-secondary-foreground self-start rounded-tl-sm animate-pulse border border-border/50">
              Generating response...
            </div>
          )}
          <span ref={endRef} />
        </div>

        {error && <p className="px-5 py-2 text-sm text-destructive bg-destructive/10 border-t border-destructive/20">{error}</p>}
        {notice && <p className="px-5 py-2 text-sm text-success bg-success/10 border-t border-success/20">{notice}</p>}

        {/* INPUT AREA */}
        <div className="p-4 border-t border-border bg-card">
          <form onSubmit={send} className="relative flex flex-col gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message the assistant... (Shift+Enter for new line)"
              aria-label="Message"
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                AI can make mistakes. Check important info.
              </span>
              <div className="flex gap-2">
                {busy && (
                  <button
                    type="button"
                    onClick={stopGeneration}
                    className="px-4 py-2 rounded-md border border-border bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
                  >
                    Stop
                  </button>
                )}
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* PAST CHATS SIDEBAR */}
      <aside className="w-80 shrink-0 flex flex-col border border-border rounded-xl bg-card overflow-hidden">
        <div className="px-4 py-4 border-b border-border bg-card">
          <h2 className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
            Past chats
          </h2>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-border">
          {history.length === 0 && (
            <li className="px-4 py-6 text-sm text-center text-muted-foreground">No history yet.</li>
          )}
          {history.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => loadHistory(m)}
                className="w-full text-left px-4 py-3 text-sm text-muted-foreground hover:bg-secondary transition-colors focus:outline-none focus:bg-secondary"
                title={toText(m.message)}
              >
                <span className="line-clamp-2 text-foreground font-medium mb-1">{toText(m.message)}</span>
                <span className="block text-[11px] opacity-60">{toText(m.date)} {toText(m.time)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}