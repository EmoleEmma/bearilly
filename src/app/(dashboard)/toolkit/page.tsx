'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { Star, Wrench, Search, ExternalLink } from 'lucide-react'

type Tool = {
  id: string
  category: string
  tool_name: string
  tool_url: string
  description: string | null
  is_free: boolean
  isFavorited?: boolean
}

export default function ToolkitPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setError('')

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Authorization session missing. Re-authenticate to access directory structures.')
        setLoading(false)
        return
      }
      setUserId(user.id)

      const { data: toolData, error: toolError } = await supabase
        .from('tool_directory')
        .select('*')
        .order('category')

      if (toolError) {
        console.error('Tool directory load error:', toolError)
        setError('Failed to securely synchronize resource listings.')
        setLoading(false)
        return
      }

      const { data: favData } = await supabase
        .from('tool_favorites')
        .select('tool_id')
        .eq('user_id', user.id)

      const favoritedIds = new Set((favData || []).map(f => f.tool_id))

      const enriched: Tool[] = (toolData || []).map(t => ({
        ...t,
        isFavorited: favoritedIds.has(t.id),
      }))

      setTools(enriched)
    } catch (err) {
      console.error('Toolkit load error:', err)
      setError('An error occurred indexing the sandbox asset framework.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleFavorite(tool: Tool) {
    if (!userId) return

    const supabase = createClient()

    setTools(prev =>
      prev.map(t => (t.id === tool.id ? { ...t, isFavorited: !t.isFavorited } : t))
    )

    if (tool.isFavorited) {
      await supabase
        .from('tool_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('tool_id', tool.id)
    } else {
      await supabase
        .from('tool_favorites')
        .upsert(
          { user_id: userId, tool_id: tool.id },
          { onConflict: 'user_id,tool_id' }
        )
    }
  }

  const categories = ['All', ...Array.from(new Set(tools.map(t => t.category)))]

  const filteredTools = tools.filter(t => {
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory
    const matchesSearch =
      searchQuery.trim() === '' ||
      t.tool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">Creator Toolkit</h1>
        <p className="text-[#C89B5A] text-sm font-semibold">Open-source and verified tools to power your creative workflow.</p>
      </div>

      {/* Search bar — rounded-full, teal focus ring */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8B7355]/60">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 text-sm rounded-full bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F7C82] placeholder-[#8B7355]/60 font-medium shadow-sm transition-all duration-200 ease-in-out"
        />
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map((cat) => {
          const isActive = cat === activeCategory
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-full transition-all duration-200 ease-in-out border ${
                isActive
                  ? 'bg-[#4F7C82] border-[#4F7C82] text-white shadow-sm'
                  : 'bg-white border-[#E8E0D0] text-[#8B7355] hover:border-[#C89B5A] hover:bg-[#FAF7F2]'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Master Assets Render Grid Block */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-md animate-pulse h-32" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md">
          <p className="text-sm font-semibold text-red-500 px-4">{error}</p>
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md text-[#8B7355]">
          <Wrench className="w-10 h-10 mx-auto mb-3 opacity-40 text-[#C89B5A]" />
          <p className="text-xs font-semibold uppercase tracking-wider">
            No tools found{searchQuery ? ` matching "${searchQuery}"` : ''}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => (
            <div key={tool.id} className="relative bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-200 ease-in-out flex flex-col justify-between group">
              <button
                onClick={() => toggleFavorite(tool)}
                aria-label={tool.isFavorited ? 'Remove bookmark' : 'Add bookmark'}
                className={`absolute top-4 right-4 transition-colors ${tool.isFavorited ? 'text-[#C89B5A]' : 'text-slate-300 hover:text-[#C89B5A]'}`}
              >
                <Star className="w-4.5 h-4.5" fill={tool.isFavorited ? '#C89B5A' : 'none'} />
              </button>

              <div>
                <h3 className="font-bold text-sm text-slate-900 pr-6 mb-1.5 tracking-tight line-clamp-1">
                  {tool.tool_name}
                </h3>

                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#4F7C82] mb-2">
                  {tool.category}
                </span>

                {tool.description && (
                  <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-3 leading-relaxed">{tool.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#E8E0D0] pt-3 mt-auto">
                {tool.is_free ? (
                  <span className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    Open Source
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-[#FAF7F2] text-[#C89B5A]">
                    Commercial
                  </span>
                )}

                
                <a href={tool.tool_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#4F7C82] hover:text-[#C89B5A] transition-colors"
                >
                  Mount External <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}