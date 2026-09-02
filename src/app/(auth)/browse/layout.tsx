export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Simple top nav — replaces the split-screen auth layout for this page */}
      <header className="border-b border-[#EEF1F4] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-2">
          <span className="text-2xl">🐻</span>
          <span className="text-[#4F7C82] font-black text-lg">Bearilly</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
