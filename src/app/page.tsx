import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', overflowX: 'hidden' }}>

      {/* NAVBAR */}
      <nav style={{ background: '#1E3A5F', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '22px' }}>🐻 Bearilly</span>
          <span style={{ color: '#93c5fd', fontSize: '12px', marginLeft: '8px' }}>Learn. Create. Grow.</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/login" style={{ color: 'white', textDecoration: 'none', fontSize: '14px', padding: '8px 16px', border: '1px solid white', borderRadius: '8px' }}>Sign In</Link>
          <Link href="/register" style={{ background: '#F0A500', color: 'white', textDecoration: 'none', fontSize: '14px', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold' }}>Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎨🚀✨</div>
        <h1 style={{ color: 'white', fontSize: '42px', fontWeight: 'bold', margin: '0 0 16px', lineHeight: 1.2 }}>
          Learn to Create Amazing Content!
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px', maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          The fun platform for beginners to learn content creation, social media, and storytelling skills.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{ background: '#F0A500', color: 'white', textDecoration: 'none', fontSize: '18px', padding: '16px 32px', borderRadius: '12px', fontWeight: 'bold', display: 'inline-block' }}>
            🌟 Sign Up Now
          </Link>
          <Link href="/login" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none', fontSize: '18px', padding: '16px 32px', borderRadius: '12px', fontWeight: 'bold', display: 'inline-block', backdropFilter: 'blur(10px)' }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* WHAT YOU LEARN */}
      <section style={{ background: '#FFF9F0', padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1E3A5F', marginBottom: '8px' }}>What You&apos;ll Learn 🎓</h2>
        <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '16px' }}>6 fun categories packed with real skills</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
          {[
            { emoji: '📸', title: 'Content Creation', color: '#FF6B6B', bg: '#FFF0F0' },
            { emoji: '📱', title: 'Social Media', color: '#4ECDC4', bg: '#F0FFFE' },
            { emoji: '🎬', title: 'Video Creation', color: '#A78BFA', bg: '#F5F0FF' },
            { emoji: '📖', title: 'Storytelling', color: '#F0A500', bg: '#FFFBF0' },
            { emoji: '🎨', title: 'Branding', color: '#10B981', bg: '#F0FFF8' },
            { emoji: '💰', title: 'Monetization', color: '#3B82F6', bg: '#F0F6FF' },
          ].map((item) => (
            <div key={item.title} style={{ background: item.bg, borderRadius: '16px', padding: '24px 16px', border: `2px solid ${item.color}20` }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>{item.emoji}</div>
              <p style={{ color: item.color, fontWeight: 'bold', fontSize: '14px', margin: 0 }}>{item.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)', padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1E3A5F', marginBottom: '40px' }}>Everything You Need 🛠️</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
          {[
            { emoji: '🤖', title: 'AI Tutor', desc: 'Ask any question and get instant answers from your personal AI teacher', color: '#7C3AED', bg: '#F5F0FF' },
            { emoji: '🧰', title: 'Toolkit Hub', desc: 'Free creator tools for video, design, audio and writing all in one place', color: '#0891B2', bg: '#F0FBFF' },
            { emoji: '📝', title: 'Assessments', desc: 'Complete real projects and submit your work to get reviewed', color: '#059669', bg: '#F0FFF8' },
            { emoji: '📊', title: 'Track Progress', desc: 'See how far you have come with streaks and completion badges', color: '#D97706', bg: '#FFFBF0' },
          ].map((item) => (
            <div key={item.title} style={{ background: item.bg, borderRadius: '20px', padding: '32px 24px', border: `2px solid ${item.color}20` }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>{item.emoji}</div>
              <h3 style={{ color: item.color, fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2E75B6 100%)', padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>How It Works 🚀</h2>
        <p style={{ color: '#93c5fd', marginBottom: '40px' }}>Get started in just 3 simple steps</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
          {[
            { step: '1', emoji: '📝', title: 'Register', desc: 'Create your free account', color: '#F0A500' },
            { step: '2', emoji: '📧', title: 'Subscribe', desc: 'Receive your receipt by email', color: '#A78BFA' },
            { step: '3', emoji: '🎉', title: 'Start Learning', desc: 'Access everything immediately', color: '#F472B6' },
          ].map((item) => (
            <div key={item.step} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px 20px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ width: '40px', height: '40px', background: item.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 'bold', color: 'white', fontSize: '18px' }}>{item.step}</div>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{item.emoji}</div>
              <h3 style={{ color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ color: '#93c5fd', fontSize: '13px', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

    
      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #F0A500 50%, #FFE066 100%)', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ color: 'white', fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>Ready to Start Your Journey?</h2>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px', marginBottom: '32px' }}>Join other young creators learning on Bearilly today!</p>
        <Link href="/register" style={{ background: 'white', color: '#F0A500', textDecoration: 'none', fontSize: '20px', padding: '18px 40px', borderRadius: '16px', fontWeight: 'bold', display: 'inline-block', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
          🚀 Join Bearilly - Sign Up Now
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#1E3A5F', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>🐻 Bearilly</p>
        <p style={{ color: '#93c5fd', fontSize: '13px', marginBottom: '16px' }}>Learn. Create. Get Assessed.</p>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '16px' }}>
          <Link href="/login" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: '13px' }}>Sign In</Link>
          <Link href="/register" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: '13px' }}>Register</Link>
          <a href="mailto:support@bearilly.com" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: '13px' }}>Support</a>
        </div>
        <p style={{ color: '#475569', fontSize: '12px', margin: 0 }}>© 2026 Bearilly. All rights reserved.</p>
      </footer>

    </div>
  )
}