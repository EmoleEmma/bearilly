import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] via-[#2E75B6] to-[#1E3A5F] flex items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Top brand strip */}
        <div className="bg-[#1E3A5F] px-8 py-6 text-center">
          <h1 className="text-white font-bold text-2xl tracking-tight">Bearilly</h1>
          <p className="text-blue-300 text-sm mt-1">Learn. Create. Get Assessed.</p>
        </div>

        {/* Page content */}
        <div className="px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  )
}
