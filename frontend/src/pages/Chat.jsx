import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const active = useRef(null)
  const endRef = useRef(null)

  // Each visit is a fresh session. Load the persisted history, and abort any
  // in-flight request when the user navigates away.
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
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  async function send(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setBusy(true)
    setError(null)
    const c = new AbortController()
    if (active.current) active.current.abort()
    active.current = c
    try {
      const res = await api.chat(text, c.signal)
      setMessages((m) => [...m, { role: 'assistant', content: res.response }])
      // refresh the persisted history sidebar in the background (no abort)
      api.chatHistory().then((d) => setHistory(d.chats || [])).catch(() => {})
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message)
      setMessages((m) => m.slice(0, -1))
    } finally {
      setBusy(false)
    }
  }

  function loadHistory(m) {
    // Clicking a past exchange reopens it as a fresh active conversation.
    setMessages([
      { role: 'user', content: m.message },
      { role: 'assistant', content: m.response },
    ])
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 flex flex-col bg-card border rounded-xl min-h-[28rem]">
        <div className="px-4 py-3 border-b border-border">
          <h1 className="font-semibold">Assistant</h1>
          <p className="text-xs text-muted-foreground">Plan, brainstorm, and clarify your work.</p>
        </div>

        <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Start a conversation about what you want to get done.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground self-end ml-auto'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {m.content}
            </div>
          ))}
          <span ref={endRef} />
        </div>

        {error && <p className="px-3 py-1 text-xs text-destructive">{error}</p>}

        <form onSubmit={send} className="flex gap-2 border-t border-border px-3 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message the assistant…"
            aria-label="Message"
            className="flex-1 px-3 py-2 border border-border rounded-md bg-transparent text-sm"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50"
          >
            {busy ? '…' : 'Send'}
          </button>
        </form>
      </div>

      <aside className="w-64 border rounded-xl bg-card self-start">
        <h2 className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">
          Past chats
        </h2>
        <ul className="divide-y divide-border max-h-[24rem] overflow-auto">
          {history.length === 0 && (
            <li className="px-3 py-3 text-xs text-muted-foreground">No history yet.</li>
          )}
          {history.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => loadHistory(m)}
                className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-secondary truncate"
                title={m.message}
              >
                {m.message}
                <span className="block text-[10px] opacity-70">{m.date} {m.time}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}