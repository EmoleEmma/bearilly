import { DollarSign, Users, TrendingUp, MessageCircle } from 'lucide-react'

export const metadata = {
  title: 'Bearilly — Affiliate JV Page',
  description: 'Everything affiliates need to promote Bearilly: commission, audience, swipe copy.',
}

export default function JVPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#334155] font-sans min-h-screen">

      <nav className="bg-white/95 backdrop-blur-md border-b border-[#EEF1F4] shadow-sm px-8 py-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <span className="text-[#4F7C82] font-black text-2xl tracking-tight">
            🐻 Bearilly
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-[#C89B5A] bg-white px-3 py-1.5 rounded-full border border-[#E7C997]/50">
            Affiliate JV Page
          </span>
        </div>
      </nav>

      <section className="px-8 py-16 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-black text-[#1E293B] tracking-tight mb-4">
          Promote Bearilly
        </h1>
        <p className="text-[#334155]/80 text-lg max-w-xl mb-10 leading-relaxed font-medium">
          An AI-powered learning platform people actually finish. Here's everything you need to start sending traffic.
        </p>

        {/* Quick facts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            { icon: DollarSign, label: 'Commission', value: 'See product page' },
            { icon: Users, label: 'Audience', value: 'Self-improvers, students' },
            { icon: TrendingUp, label: 'Price Point', value: 'Affordable, high-convert' },
            { icon: MessageCircle, label: 'Support', value: 'hello@stakecut.com' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-[#EEF1F4] text-center shadow-sm">
              <Icon size={18} className="text-[#4F7C82] mx-auto mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8B7355]">{label}</p>
              <p className="text-xs font-bold text-[#1E293B] mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* Why promote */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-[#1E293B] mb-4">Why promote Bearilly</h2>
          <ul className="space-y-3">
            {[
              'Real product, real content — not a rehashed PLR course. Easier to stand behind when you recommend it.',
              'Clean, working checkout and onboarding — fewer refund requests from a broken buying experience.',
              'Broad appeal: anyone wanting to learn a skill at their own pace is a fit.',
            ].map(point => (
              <li key={point} className="flex items-start gap-3 text-sm font-medium text-[#334155]/80">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C89B5A] shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Swipe copy */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-[#1E293B] mb-4">Swipe copy</h2>
          <div className="bg-white rounded-xl p-5 border border-[#EEF1F4] shadow-sm space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#8B7355] mb-1.5">Short (social post)</p>
              <p className="text-sm text-[#334155]/80 italic">
                "Been using Bearilly to learn at my own pace — structured lessons plus an AI tutor that
                actually explains things instead of just repeating the lesson. Worth checking out 👇"
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#8B7355] mb-1.5">Medium (email/DM)</p>
              <p className="text-sm text-[#334155]/80 italic">
                "Quick one — if you've been meaning to actually learn something new instead of just
                bookmarking tutorials you'll never finish, Bearilly is worth a look. It's a self-paced
                track with real lessons, an AI tutor for when you're stuck, and actual assessments so you
                know if it's sinking in. One payment, lifetime access. Link below."
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#1E293B] rounded-xl p-6 text-center">
          <p className="text-white font-bold mb-2">Ready to promote?</p>
          <p className="text-[#CBD5E1] text-sm mb-4">
            Grab your affiliate link from your Stakecut dashboard and start sharing.
          </p>
          <a
            href="https://app.stakecut.com/dashboard/marketplace"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#C89B5A] text-white text-sm px-6 py-2.5 rounded-full font-bold hover:bg-[#4F7C82] transition-all duration-200"
          >
            Go to Stakecut Marketplace
          </a>
        </div>
      </section>
    </div>
  )
}
