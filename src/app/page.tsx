import Link from 'next/link'
import {
  Camera, Smartphone, Video, BookOpen, Palette, DollarSign,
  Bot, Wrench, ClipboardList, BarChart2,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="bg-[#FAF7F2] text-[#334155] font-sans overflow-x-hidden min-h-screen selection:bg-user-lightgold selection:text-admin-slate">

      {/* NAVBAR */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-[#EEF1F4] shadow-sm px-8 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <span className="text-[#4F7C82] font-black text-2xl tracking-tight">
            🐻 Bearilly
          </span>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#334155]">
            <Link href="/" className="hover:text-[#4F7C82] transition-colors">Home</Link>
            <Link href="/browse" className="hover:text-[#4F7C82] transition-colors">Courses</Link>
            <Link href="#" className="hover:text-[#4F7C82] transition-colors">About</Link>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/login" className="text-[#4F7C82] border border-[#4F7C82] text-sm font-bold px-5 py-2 rounded-full hover:bg-[#4F7C82] hover:text-white transition-all duration-200">
            Sign In
          </Link>
          <Link href="/register" className="bg-[#C89B5A] text-white text-sm px-5 py-2 rounded-full font-bold shadow-md hover:bg-[#4F7C82] transition-all duration-200">
            Get Started
          </Link>
        </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#FAF7F2] to-[#F0EAE0] px-8 py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E7C997]/20 rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
          {/* Left copy */}
          <div className="flex-1 text-left">
            <span className="inline-block text-[#C89B5A] text-xs font-bold uppercase tracking-widest mb-4 bg-white px-4 py-1.5 rounded-full shadow-sm border border-[#E7C997]/50">
              Premium Educational SaaS
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-[#1E293B] tracking-tight leading-tight mb-6">
              Learn Anything,{' '}
              <span className="text-[#4F7C82] relative inline-block">
                Your Way
                <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-[#E7C997] rounded-full" />
              </span>
            </h1>
            <p className="text-[#334155]/80 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-medium">
              A growing collection of AI-powered learning tracks — pick a subject, learn at your own pace, with an AI tutor by your side.
            </p>
            <div className="flex gap-4 items-center flex-wrap">
              <Link href="/register" className="bg-[#C89B5A] text-white text-base px-8 py-4 rounded-full font-bold shadow-lg hover:bg-[#4F7C82] hover:shadow-[0_6px_20px_rgba(200,155,90,0.35)] transition-all duration-200">
                Get Started
              </Link>
              <Link href="/browse" className="text-[#4F7C82] border-2 border-[#4F7C82] text-base px-8 py-4 rounded-full font-bold hover:bg-[#4F7C82] hover:text-white transition-all duration-200">
                Explore Courses
              </Link>
            </div>
          </div>
          {/* Right floating mockup */}
          <div className="flex-shrink-0 w-full md:w-[420px]">
            <div className="relative bg-white rounded-2xl shadow-2xl border border-[#EEF1F4] p-6 rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="ml-2 text-xs text-[#94A3B8] font-medium">bearilly.com/dashboard</span>
              </div>
              <div className="bg-[#FAF7F2] rounded-xl p-4 mb-3">
                <p className="text-xs text-[#8B7355] font-bold uppercase tracking-wider mb-2">Current Track</p>
                <p className="text-[#1E293B] font-black text-lg">Your Track</p>
                <div className="mt-2 h-2 bg-[#EEF1F4] rounded-full"><div className="h-2 bg-[#4F7C82] rounded-full w-[68%]" /></div>
                <p className="text-xs text-[#8B7355] mt-1 font-semibold">68% Complete</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['AI Tutor', 'Assessments', 'Toolkit', 'Analytics'].map(t => (
                  <div key={t} className="bg-[#F8F5EF] rounded-lg p-3 text-center border border-[#EEF1F4]">
                    <p className="text-xs font-bold text-[#4F7C82]">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BANNER */}
      <section className="bg-[#1E293B] px-8 py-16 text-center">
        <div className="max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { stat: '2,000+', label: 'Learners' },
            { stat: '8',      label: 'Tracks' },
            { stat: '95%',    label: 'Pass Rate' },
            { stat: '4.9★',   label: 'Avg Rating' },
          ].map(({ stat, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-3xl md:text-4xl font-black text-[#C89B5A]">{stat}</span>
              <span className="text-[#94A3B8] text-xs font-semibold uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT YOU LEARN */}
      <section className="bg-[#F8F5EF] px-8 py-20 text-center border-y border-[#EEF1F4]">
        <h2 className="text-3xl md:text-4xl font-bold text-admin-deep tracking-tight mb-2">Pick a Track, Start Learning</h2>
        <p className="text-admin-teal font-bold mb-12 uppercase tracking-widest text-xs">New tracks added regularly — here's a preview</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl mx-auto">
          {[
            { Icon: Camera,      title: 'Content Creation', accent: '#4F7C82' },
            { Icon: Smartphone,  title: 'Social Media',     accent: '#C89B5A' },
            { Icon: Video,       title: 'Video Editing',    accent: '#4F7C82' },
            { Icon: BookOpen,    title: 'Storytelling',     accent: '#C89B5A' },
            { Icon: Palette,     title: 'Design',           accent: '#4F7C82' },
            { Icon: DollarSign,  title: 'Business',         accent: '#C89B5A' },
          ].map(({ Icon, title, accent }) => (
            <div key={title} className="bg-[#FFFFFF] border border-[#EEF1F4] rounded-2xl p-5 flex flex-col items-center gap-3 shadow-sm hover:shadow-md hover:border-user-gold/40 hover:-translate-y-1 transition-all duration-300 group">
              <div className="p-3 rounded-xl bg-[#FAF7F2] group-hover:bg-[#F8F5EF] transition-colors duration-200">
                <Icon size={22} style={{ color: accent }} />
              </div>
              <p className="text-admin-slate font-bold text-sm">{title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-[#FFFFFF] px-8 py-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-admin-deep tracking-tight mb-2">Everything You Need</h2>
        <p className="text-admin-teal font-bold mb-8 uppercase tracking-widest text-xs">Built for serious learners</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
          {[
            { Icon: Bot,          title: 'Bearilly AI Guide', desc: 'Ask any question and obtain instantaneous context-aware feedback from your embedded AI companion.', accent: '#4F7C82' },
            { Icon: Wrench,       title: 'Toolkit',           desc: 'Deploy modular blueprints, dynamic elements, structured logs, and premium configurations instantly.', accent: '#C89B5A' },
            { Icon: ClipboardList,title: 'Assessment Hub',    desc: 'Verify execution metrics by finalizing production benchmarks and submitting work to manual verification layers.', accent: '#4F7C82' },
            { Icon: BarChart2,    title: 'Analytics Engine',  desc: 'Monitor visual indicators, tracking parameters, execution metrics, and milestones cleanly over cycles.', accent: '#C89B5A' },
          ].map(({ Icon, title, desc, accent }) => (
            <div key={title} className="bg-[#FAF7F2] border border-[#EEF1F4] rounded-2xl p-5 text-left hover:shadow-md hover:bg-white hover:border-user-gold/30 transition-all duration-300">
              <div className="inline-flex items-center justify-center p-2 rounded-xl bg-white shadow-sm mb-4 border border-[#EEF1F4]">
                <Icon size={20} style={{ color: accent }} />
              </div>
              <h3 className="text-admin-deep font-bold text-sm mb-2">{title}</h3>
              <p className="text-admin-slate/90 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#F8F5EF] px-8 py-20 text-center border-t border-[#EEF1F4]">
        <h2 className="text-3xl md:text-4xl font-bold text-admin-deep tracking-tight mb-2">How It Works</h2>
        <p className="text-admin-teal font-bold mb-12 text-xs uppercase tracking-widest">3 steps to start your journey</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto relative">
          {[
            { step: '1', title: 'Register',       desc: 'Create your account and set up your workspace profile.', accent: '#4F7C82' },
            { step: '2', title: 'Subscribe',      desc: 'Complete payment to unlock your full platform access.', accent: '#C89B5A' },
            { step: '3', title: 'Start Learning', desc: 'Dive into tracks, AI tutoring and live assessments.', accent: '#4F7C82' },
          ].map(({ step, title, desc, accent }) => (
            <div key={step} className="bg-[#FFFFFF] border border-[#EEF1F4] rounded-2xl p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-base mb-4 shadow-md" style={{ background: accent }}>
                {step}
              </div>
              <h3 className="text-admin-deep font-bold text-sm mb-2">{title}</h3>
              <p className="text-admin-slate/80 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[#F8F5EF] px-8 py-20 border-t border-[#EEF1F4] text-center">
        <h2 className="text-3xl md:text-4xl font-black text-[#1E293B] tracking-tight mb-2">What Our Learners Say</h2>
        <p className="text-[#4F7C82] text-xs font-bold uppercase tracking-widest mb-12">Real stories from the Bearilly community</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { name: 'Amaka O.', role: 'Creators Track', text: 'Bearilly transformed how I approach my craft. The AI Tutor alone is worth every naira.', initial: 'A' },
            { name: 'Tunde B.', role: 'Design Track', text: 'The structured lessons gave me a clear path. I went from zero to confident in 6 weeks.', initial: 'T' },
            { name: 'Chidi N.', role: 'Business Track', text: 'I loved the assessment system — real feedback, not generic scores. Premium experience all the way.', initial: 'C' },
          ].map(({ name, role, text, initial }) => (
            <div key={name} className="bg-white rounded-2xl shadow-md border border-[#EEF1F4] p-6 hover:shadow-lg transition-all duration-200">
              <span className="text-5xl text-[#C89B5A]/30 font-black leading-none block mb-2">"</span>
              <p className="text-[#334155] text-sm leading-relaxed font-medium mb-5">{text}</p>
              <div className="text-[#C89B5A] text-sm mb-4">★★★★★</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4F7C82] flex items-center justify-center text-white font-black text-sm">{initial}</div>
                <div>
                  <p className="text-[#1E293B] font-bold text-sm">{name}</p>
                  <p className="text-[#8B7355] text-xs font-semibold">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white px-8 py-20 border-t border-[#EEF1F4]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-[#1E293B] tracking-tight text-center mb-2">Frequently Asked Questions</h2>
          <p className="text-[#4F7C82] text-xs font-bold uppercase tracking-widest text-center mb-12">Everything you need to know</p>
          <div className="space-y-3">
            {[
              { q: 'How much does Bearilly cost?', a: 'Access starts at ₦1,000/month — full platform, no hidden fees.' },
              { q: 'Can I access content on mobile?', a: 'Yes, Bearilly is fully responsive and works on any device.' },
              { q: 'What tracks are available?', a: 'New tracks are added regularly — browse the current lineup after you sign up.' },
              { q: 'Is there an AI tutor included?', a: 'Yes — unlimited conversations with the Bearilly AI Tutor are included in your subscription.' },
            ].map(({ q, a }) => (
              <details key={q} className="group border border-[#EEF1F4] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-bold text-[#1E293B] text-sm list-none hover:bg-[#FAF7F2] transition-colors">
                  {q}
                  <svg className="w-4 h-4 text-[#4F7C82] group-open:rotate-180 transition-transform duration-200 flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-[#334155]/80 leading-relaxed font-medium border-t border-[#EEF1F4] pt-3">{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1E293B] px-8 py-24 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#4F7C82_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.07]"></div>
        <h2 className="text-3xl md:text-4xl font-black text-white mb-3 relative">Ready to Start Your Journey?</h2>
        <p className="text-[#94A3B8] text-base max-w-md mx-auto mb-8 relative">Join a growing community of learners, across every track.</p>
        <Link href="/register" className="bg-[#C89B5A] text-white text-base px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-[#B3874B] hover:scale-105 transition-all duration-200 inline-block relative">
          Join Bearilly — Sign Up Now
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1E293B] px-8 md:px-16 py-16 text-[#94A3B8]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <p className="text-[#C89B5A] font-black text-2xl mb-2">🐻 Bearilly</p>
            <p className="text-[#4F7C82] text-xs tracking-wider font-semibold uppercase mb-4">Learn. Create. Get Assessed.</p>
            <p className="text-xs leading-relaxed text-[#64748B]">AI-powered learning tracks for the next generation of skilled learners.</p>
          </div>
          <div>
            <p className="text-[#F1F5F9] font-bold text-sm mb-4 uppercase tracking-wider">Platform</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="hover:text-[#C89B5A] transition-colors">Courses</Link></li>
              <li><Link href="/login" className="hover:text-[#C89B5A] transition-colors">AI Tutor</Link></li>
              <li><Link href="/login" className="hover:text-[#C89B5A] transition-colors">Assessments</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[#F1F5F9] font-bold text-sm mb-4 uppercase tracking-wider">Account</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="hover:text-[#C89B5A] transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-[#C89B5A] transition-colors">Register</Link></li>
              <li><Link href="/payment" className="hover:text-[#C89B5A] transition-colors">Payment</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[#F1F5F9] font-bold text-sm mb-4 uppercase tracking-wider">Support</p>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@bearilly.com" className="hover:text-[#C89B5A] transition-colors">support@bearilly.com</a></li>
              <li><a href="#" className="hover:text-[#C89B5A] transition-colors">Help Center</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-[#334155] mt-10 pt-8 text-center">
          <p className="text-[#475569] text-xs font-medium">© 2026 Bearilly. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}