import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

export default function Chat() {
  const endRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function send(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setBusy(true)
    setError(null)
    try {
      const res = await api.chat(text)
      setMessages((m) => [...m, { role: 'assistant', content: res.response }])
    } catch (err) {
      setError(err.message)
      setMessages((m) => m.slice(0, -1))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const el = endRef.current
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [messages, busy, error])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Assistant</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Talk through your goals and turn them into a workable plan.
        </p>
      </div>

      <div className="bg-card border rounded-xl flex flex-col h-96">
        <div className="flex-1 overflow-auto px-4 py-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Start a conversation about what you want to get done.
            </p>
          )}
          {messages.map((m, i) => (
            <p
              key={i}
              className={`whitespace-pre-wrap text-sm leading-relaxed ${
                m.role === 'user' ? '' : 'text-muted-foreground'
              }`}
            >
              {m.content}
            </p>
          ))}
          <span ref={endRef} />
        </div>
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
        {error && <p className="px-3 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}