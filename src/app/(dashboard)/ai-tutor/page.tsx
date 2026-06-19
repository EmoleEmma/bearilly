'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  role: 'user' | 'assistant'
  text: string
}

const SUGGESTED = [
  'How do I start a lesson?',
  'What is the Assessment Center?',
  'How do I unlock a test?',
  'What is content creation?',
  'How many messages can I send per day?',
]

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Hi! I'm Bearilly AI Guide 🐻 I'm here to help you navigate the platform and answer your learning questions. What would you like to know?"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    setError('')

    const userMsg: Message = { role: 'user', text: text.trim() }
    const history = messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) !== 0)

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: history.map(m => ({ role: m.role, text: m.text }))
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setLoading(false)
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }])
      setRemaining(data.remaining)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '20px', padding: '20px 24px', marginBottom: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontSize: '40px' }}>🤖</div>
        <div>
          <h1 style={{ fontWeight: 'bold', fontSize: '20px', margin: '0 0 4px' }}>Bearilly AI Guide</h1>
          <p style={{ opacity: 0.85, fontSize: '13px', margin: 0 }}>
            {remaining !== null ? `${remaining} messages left today` : 'Ask me anything about the platform or your courses'}
          </p>
        </div>
      </div>

      {/* Suggested questions — only show at start */}
      {messages.length === 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {SUGGESTED.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              style={{ background: '#F0FFF8', border: '1px solid #10B98130', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', color: '#059669', cursor: 'pointer', fontWeight: '500' }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '8px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: '32px', height: '32px', background: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, marginRight: '8px', alignSelf: 'flex-end' }}>
                🤖
              </div>
            )}
            <div style={{
              maxWidth: '75%',
              background: msg.role === 'user' ? '#10B981' : 'white',
              color: msg.role === 'user' ? 'white' : '#1E293B',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '12px 16px',
              fontSize: '14px',
              lineHeight: 1.6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: msg.role === 'assistant' ? '1px solid #E2E8F0' : 'none',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%', animation: `bounce 1s infinite ${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #EF444430', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#EF4444', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Ask me anything..."
            rows={1}
            style={{
              flex: 1,
              border: '2px solid #E2E8F0',
              borderRadius: '14px',
              padding: '12px 16px',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? '#E2E8F0' : '#10B981',
              color: loading || !input.trim() ? '#94a3b8' : 'white',
              border: 'none',
              borderRadius: '14px',
              width: '48px',
              height: '48px',
              fontSize: '20px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            ➤
          </button>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '11px', margin: '8px 0 0', textAlign: 'center' }}>
          Press Enter to send · Shift+Enter for new line · 20 messages per day
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}