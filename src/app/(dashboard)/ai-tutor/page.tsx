'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; text: string }

const SUGGESTED = [
  'How do I start a lesson?',
  'What is the Assessment Center?',
  'How do I unlock a test?',
  'What is content creation?',
  'How many messages can I send per day?',
]

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm Bearilly AI Guide. I'm here to help you navigate the platform and answer your learning questions. What would you like to know?" }
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
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return }
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }])
      setRemaining(data.remaining)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 110px)' }}>

      {/* Header Panel — teal gradient */}
      <div
        className="rounded-2xl p-4 mb-4 flex items-center justify-between shadow-md"
        style={{ background: 'linear-gradient(135deg, #4F7C82 0%, #3a5f64 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0 text-2xl">
            🐻
          </div>
          <div>
            <h1 className="text-white font-extrabold text-sm tracking-tight">Bearilly AI Interface</h1>
            <p className="text-white/70 text-xs font-medium">
              {remaining !== null ? `${remaining} requests remaining today` : 'Curriculum & navigation assistance protocol'}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C89B5A] text-[10px] font-bold uppercase tracking-wider text-white">
          <Sparkles size={10} /> Active Node
        </div>
      </div>

      {/* Suggested Chips — horizontal scrollable, outlined teal */}
      {messages.length === 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {SUGGESTED.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="flex-shrink-0 bg-white border-2 border-[#4F7C82]/30 text-[#4F7C82] text-xs font-semibold px-3.5 py-2 rounded-full hover:border-[#4F7C82] hover:bg-[#4F7C82] hover:text-white transition-all duration-200 ease-in-out whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Message Scroller — cream background */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4 pr-1 px-2 -mx-2 bg-[#FAF7F2] rounded-2xl pt-4 scrollbar-thin">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          return (
            <div key={i} className={`flex items-start gap-3 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-[#4F7C82] flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <Bot size={15} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed whitespace-pre-wrap shadow-sm ${
                  isUser
                    ? 'bg-[#C89B5A] text-white rounded-tr-sm'
                    : 'bg-white text-slate-800 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          )
        })}

        {/* Typing State Indicator */}
        {loading && (
          <div className="flex items-start gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#4F7C82] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot size={15} className="text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#C89B5A]"
                    style={{ animation: `bounce 1s infinite ${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs font-semibold text-red-600 text-center shadow-sm mx-2">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Chat Input Dock */}
      <div className="pt-4 px-1">
        <div className="flex gap-3 items-center bg-[#FAF7F2] rounded-full p-2 pl-5 focus-within:ring-2 focus-within:ring-[#4F7C82] shadow-sm transition-all duration-200 ease-in-out">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
            }}
            placeholder="Query workspace parameters..."
            rows={1}
            className="flex-1 bg-transparent px-1 py-1.5 text-sm text-slate-800 placeholder-[#8B7355]/60 resize-none focus:outline-none min-h-[36px] max-h-[120px] font-medium"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ease-in-out disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-sm"
            style={{ background: loading || !input.trim() ? '#CBD5E1' : '#4F7C82' }}
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-[#8B7355]/70 text-[10px] font-semibold uppercase tracking-wider text-center mt-2.5">
          Return Key Executes · Shift+Return Adds Break · Cap Limit: 20 Per Cycle
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}