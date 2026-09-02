'use client'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL — 40% dark navy */}
      <div className="hidden md:flex md:w-2/5 bg-[#1E293B] flex-col items-center justify-center p-10 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#4F7C82_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Logo */}
        <div className="mb-10 text-center z-10">
          <h1 className="text-[#C89B5A] font-black text-4xl tracking-tight mb-1">🐻 Bearilly</h1>
          <p className="text-[#4F7C82] text-xs font-bold uppercase tracking-widest">Learn. Create. Get Assessed.</p>
        </div>

        {/* Bear mascot */}
        <div className="w-36 h-36 rounded-full bg-[#C89B5A]/20 border-4 border-[#C89B5A]/40 flex items-center justify-center text-7xl mb-10 z-10 shadow-lg">
          🐻
        </div>

        {/* Feature bullets */}
        <ul className="space-y-4 z-10 w-full max-w-xs">
          {[
            '8+ AI-powered learning tracks',
            'Unlimited AI Tutor access',
            'Real assessment & project grading',
          ].map(item => (
            <li key={item} className="flex items-center gap-3 text-sm text-[#CBD5E1] font-semibold">
              <span className="w-5 h-5 rounded-full bg-[#4F7C82]/20 border border-[#4F7C82] flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-[#4F7C82]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* RIGHT PANEL — 60% warm cream */}
      <div className="flex-1 bg-[#FAF7F2] flex flex-col items-center justify-start md:justify-center p-6 md:p-12 selection:bg-[#E7C997] selection:text-[#1E293B] overflow-y-auto">
        {/* Mobile-only logo */}
        <div className="md:hidden mb-8 text-center">
          <h1 className="text-[#4F7C82] font-black text-3xl">🐻 Bearilly</h1>
          <p className="text-[#C89B5A] text-xs font-bold uppercase tracking-widest mt-1">Learn. Create. Get Assessed.</p>
        </div>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}