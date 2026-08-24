import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DAILY_LIMIT = 20

const SYSTEM_PROMPT = `You are Bearilly AI Guide, a friendly assistant built into the Bearilly learning platform. 

About Bearilly:
- Bearilly is a PWA learning platform for beginners to learn content creation, digital marketing, entrepreneurship, career development, business skills, productivity, technology, and financial literacy
- Users pay ₦1,000/month to access the platform
- The platform has: Learning Hub (8 categories with lessons), AI Guide (you), Assessment Center (20-question tests, 5 minutes, 100 marks),Creator Toolkit (free video, design, audio, and writing tools), and a Profile page
- To unlock the test for a category, users must complete all lessons in that category
- Each lesson has content and a real-life example

Your job:
- Help users navigate the platform
- Answer questions about their courses and content creation topics
- Be friendly, encouraging and simple — users are beginners
- Keep responses concise and clear
- If asked something unrelated to learning or the platform, gently redirect back to Bearilly topics`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Check daily usage limit
    const today = new Date().toISOString().split('T')[0]

    const { data: usage } = await supabase
      .from('ai_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()

    const currentCount = usage?.count ?? 0

    if (currentCount >= DAILY_LIMIT) {
      return NextResponse.json({
        error: `You have reached your daily limit of ${DAILY_LIMIT} messages. Come back tomorrow!`
      }, { status: 429 })
    }

    // Build conversation history for Groq (OpenAI-compatible message format)
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...( history || []).map((msg: { role: string; text: string }) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.text
      })),
      {
        role: 'user',
        content: message
      }
    ]

    // Call Groq API (primary)
    let reply: string | null = null

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      })
    })

    const groqData = await groqRes.json()

    if (groqRes.ok) {
      reply = groqData.choices?.[0]?.message?.content ?? null
    } else {
      console.warn('Groq failed, falling back to Gemini. Status:', groqRes.status, groqData)
    }

    // Fallback to Gemini if Groq failed or returned no reply
    if (!reply) {
      const geminiMessages = messages
        .filter(m => m.role !== 'system')
        .map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: geminiMessages,
            generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
          })
        }
      )

      const geminiData = await geminiRes.json()

      if (!geminiRes.ok) {
        console.error('Gemini error:', geminiData)
        return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 500 })
      }

      reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? null
    }

    if (!reply) {
      return NextResponse.json({ error: 'No response from AI. Please try again.' }, { status: 500 })
    }

    // Update daily usage count
    await supabase
      .from('ai_usage')
      .upsert({
        user_id: user.id,
        date: today,
        count: currentCount + 1
      }, { onConflict: 'user_id,date' })

    return NextResponse.json({
      reply,
      remaining: DAILY_LIMIT - (currentCount + 1)
    })

  } catch (err) {
    console.error('AI chat error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}