import Link from 'next/link'
import {
  Bot, BookOpen, ClipboardList, BarChart2, Sparkles, ShieldCheck, Clock,
} from 'lucide-react'
<script src="https://cdn.stakecut.com/pixel/pixel.min.js"></script>

export const metadata = {
  title: 'Bearilly — Learn Anything, Your Way',
  description: 'A growing collection of AI-powered learning tracks — pick a subject, learn at your own pace, with an AI tutor by your side.',
}

export default function SalesPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#334155] font-sans overflow-x-hidden min-h-screen selection:bg-user-lightgold selection:text-admin-slate">

      {/* NAVBAR */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-[#EEF1F4] shadow-sm px-8 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <span className="text-[#4F7C82] font-black text-2xl tracking-tight">
            🐻 Bearilly
          </span>
          <Link
            href="/register"
            className="bg-[#C89B5A] text-white text-sm px-5 py-2 rounded-full font-bold shadow-md hover:bg-[#4F7C82] transition-all duration-200"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#FAF7F2] to-[#F0EAE0] px-8 py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E7C997]/20 rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="max-w-3xl mx-auto text-center relative">
          <span className="inline-block text-[#C89B5A] text-xs font-bold uppercase tracking-widest mb-5 bg-white px-4 py-1.5 rounded-full shadow-sm border border-[#E7C997]/50">
            Premium Educational SaaS
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1E293B] tracking-tight leading-tight mb-6">
            Learn Anything,{' '}
            <span className="text-[#4F7C82] relative inline-block">
              Your Way
              <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-[#E7C997] rounded-full" />
            </span>
          </h1>
          <p className="text-[#334155]/80 text-lg md:text-xl max-w-xl mx-auto mb-3 leading-relaxed font-medium">
            A structured learning track with real lessons, an AI tutor that actually answers your questions,
            and assessments that tell you if the content is sticking — not just another course you'll abandon on slide 3.
          </p>
          <p className="text-[#C89B5A] font-black text-2xl mb-8">
            $25 <span className="text-sm font-bold text-[#8B7355] align-middle">/ one-time payment</span>
          </p>
          <a
            href="https://pay.stakecut.com/?p=YOUR_PRODUCT_ID"
            className="inline-block bg-[#C89B5A] text-white text-base px-10 py-4 rounded-full font-bold shadow-lg hover:bg-[#4F7C82] hover:shadow-[0_6px_20px_rgba(200,155,90,0.35)] transition-all duration-200"
          >
            <img src="https://cdn.stakecut.com/buttons/button1.png" alt="394895" id="stakecut-button" width="100%" height="auto"></img>
          </a>
          <p className="text-xs text-[#8B7355] font-semibold mt-4">
            One payment. Lifetime access to your track.
          </p>
          <p className="text-xs text-[#8B7355] mt-2">
            Already purchased?{' '}
            <Link href="/register" className="font-semibold underline">Register your account</Link>
            {' '}or{' '}
            <Link href="/login" className="font-semibold underline">Sign in</Link>
          </p>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="px-8 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-[#1E293B] text-center mb-10">
            What's inside
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: BookOpen, title: 'Structured Lessons', desc: 'Pre-recorded, organized in order — no digging through a messy folder of files.' },
              { icon: Bot, title: 'AI Tutor, Always On', desc: 'Stuck on a concept at 1am? Ask the tutor. It explains, doesn\'t just repeat the lesson.' },
              { icon: ClipboardList, title: 'Real Assessments', desc: 'Graded checkpoints so you actually know if you\'re learning or just watching.' },
              { icon: BarChart2, title: 'Progress You Can See', desc: 'Track completion and performance as you move through the material.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-5 border border-[#EEF1F4] shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-[#4F7C82]/10 flex items-center justify-center mb-3">
                  <Icon size={20} className="text-[#4F7C82]" />
                </div>
                <p className="font-bold text-[#1E293B] mb-1">{title}</p>
                <p className="text-sm text-[#334155]/70 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="px-8 py-10 bg-white border-y border-[#EEF1F4]">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-2 text-sm font-bold text-[#4F7C82]">
            <ShieldCheck size={18} /> Secure Checkout
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-[#4F7C82]">
            <Clock size={18} /> Instant Access After Payment
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-[#4F7C82]">
            <Sparkles size={18} /> Self-Paced Learning
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-8 py-20 bg-gradient-to-br from-[#FAF7F2] to-[#F0EAE0] text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-[#1E293B] mb-4">
            Ready to start?
          </h2>
          <p className="text-[#334155]/70 font-medium mb-8">
            Get in, get learning — no waiting, no back-and-forth.
          </p>
          <a
            href="https://pay.stakecut.com/?p=YOUR_PRODUCT_ID"
            className="inline-block bg-[#C89B5A] text-white text-base px-10 py-4 rounded-full font-bold shadow-lg hover:bg-[#4F7C82] transition-all duration-200"
          >
            Get Instant Access
          </a>
        </div>
      </section>

      <footer className="px-8 py-6 text-center text-xs text-[#8B7355] font-medium">
        🐻 Bearilly — by Beyond Horizon
      </footer>
    </div>
  )
}
