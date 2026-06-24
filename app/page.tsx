import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08081C] text-[#EDEAF8]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#08081C]/80 backdrop-blur-md border-b border-[#3C3A58]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#6D28D9] flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
              </div>
              <span className="font-['Space_Grotesk'] font-bold text-xl">DreamLink</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-[#8A88A8] hover:text-[#EDEAF8] transition-colors px-4 py-2 rounded-lg">
                Sign in
              </Link>
              <Link href="/signup" className="bg-[#6D28D9] hover:bg-[#8B5CF6] text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Join Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#6D28D9]/10 border border-[#6D28D9]/20 rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-sm text-[#8B5CF6]">Built for ambitious builders</span>
          </div>
          <h1 className="font-['Space_Grotesk'] text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Where Founders Share
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6]">
              the Real Journey
            </span>
          </h1>
          <p className="text-xl text-[#8A88A8] max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with ambitious people who understand your obstacles, celebrate your wins, and help you grow. No fluff — just real conversations about building something meaningful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-[#6D28D9] hover:bg-[#8B5CF6] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(109,40,217,0.4)]">
              Join DreamLink →
            </Link>
            <Link href="/login" className="bg-[#0C0D22] hover:bg-[#121428] border border-[#3C3A58] text-[#EDEAF8] px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-[#3C3A58]/30">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '10K+', label: 'Builders Connected' },
            { value: '50K+', label: 'Problems Shared' },
            { value: '95%', label: 'Found Their Match' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-['Space_Grotesk'] text-3xl font-bold text-[#8B5CF6]">{stat.value}</div>
              <div className="text-[#8A88A8] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-['Space_Grotesk'] text-3xl font-bold text-center mb-4">Everything you need to grow</h2>
          <p className="text-[#8A88A8] text-center mb-12 max-w-2xl mx-auto">DreamLink is more than a network — it&apos;s a support system for builders at every stage.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '📣',
                title: 'Live Feed',
                desc: 'Share wins, obstacles, lessons and questions. Get real feedback from people who get it.',
                color: 'border-[#6D28D9]/30 hover:border-[#6D28D9]',
                bg: 'bg-[#6D28D9]/5',
              },
              {
                icon: '🔍',
                title: 'Discover',
                desc: 'Find builders by industry, skills, and goals. Filter by what they need and what you offer.',
                color: 'border-[#1E40AF]/30 hover:border-[#3B82F6]',
                bg: 'bg-[#1E40AF]/5',
              },
              {
                icon: '🤝',
                title: 'Smart Matches',
                desc: 'AI-powered matching based on your current blocker and what others can help with.',
                color: 'border-[#16A34A]/30 hover:border-[#22C55E]',
                bg: 'bg-[#16A34A]/5',
              },
              {
                icon: '💬',
                title: 'Messages',
                desc: '1-on-1 DMs plus a 24/7 group chat for real-time help from the community.',
                color: 'border-[#C2410C]/30 hover:border-[#F59E0B]',
                bg: 'bg-[#C2410C]/5',
              },
            ].map((feature) => (
              <div key={feature.title} className={`${feature.bg} border ${feature.color} rounded-2xl p-6 transition-all duration-300`}>
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="font-['Space_Grotesk'] font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-[#8A88A8] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-b from-[#0C0D22] to-[#121428] border border-[#6D28D9]/20 rounded-3xl p-12">
          <h2 className="font-['Space_Grotesk'] text-4xl font-bold mb-4">Ready to find your people?</h2>
          <p className="text-[#8A88A8] mb-8">Join thousands of builders who&apos;ve found mentors, co-founders, and accountability partners on DreamLink.</p>
          <Link href="/signup" className="inline-block bg-[#6D28D9] hover:bg-[#8B5CF6] text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(109,40,217,0.5)]">
            Start for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#3C3A58]/30 py-8 px-4 text-center text-[#8A88A8]">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-[#6D28D9] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="font-['Space_Grotesk'] font-bold">DreamLink</span>
        </div>
        <p className="text-sm">© 2024 DreamLink. Built for ambitious builders.</p>
      </footer>
    </div>
  )
}
