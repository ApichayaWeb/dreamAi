import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Moon, ShieldCheck, Sparkles, BrainCircuit, Stars } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0e1a] via-[#1a1733] to-[#0f0e1a] text-[#e0e0ff] font-sans overflow-x-hidden relative">
      {/* Background subtle aura + stars (เพิ่มความ dreamy นุ่ม ๆ) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(167,139,250,0.09),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(99,102,241,0.11),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent_60%)]" />
        {/* ถ้าจะเพิ่ม particles จริง ๆ แนะนำ particles-bg หรือ tsParticles ใน production */}
      </div>

      {/* Navbar - Glassmorphism นุ่มขึ้น */}
      <header className="fixed top-0 w-full bg-[#1a1733]/25 backdrop-blur-2xl border-b border-violet-950/30 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Moon className="w-7 h-7 text-violet-400" />
              <Sparkles className="w-4 h-4 text-cyan-300 absolute -top-1 -right-1 animate-pulse-slow" />
            </div>
            <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-300 via-indigo-300 to-cyan-200 tracking-tight">
              DreamAI
            </span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button 
                variant="ghost" 
                className="text-indigo-200 hover:text-white hover:bg-white/5 transition-colors"
              >
                เข้าสู่ระบบ
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero - ขยายความ dreamy, text อ่านง่ายขึ้น */}
      <section className="pt-40 pb-40 px-6 text-center relative">
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="inline-flex items-center gap-3 px-7 py-3 rounded-full bg-white/4 backdrop-blur-xl border border-violet-500/20 text-violet-300 text-base font-medium mb-12 shadow-sm">
            <Stars className="w-5 h-5 animate-pulse-slow" />
            <span>AI Dream Interpreter 2026</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-10 leading-tight bg-clip-text text-transparent bg-gradient-to-br from-violet-200 via-indigo-200 to-cyan-100 animate-gradient-x-slow">
            ฝันของคุณ<br />ซ่อนความหมายอะไรไว้?
          </h1>

          <p className="text-xl md:text-2xl text-indigo-200/95 mb-14 max-w-3xl mx-auto leading-relaxed opacity-95 font-light">
            ปลดล็อกจิตใต้สำนึกด้วย AI ล่าสุด<br />
            วิเคราะห์ฝันแบบเรียลไทม์ • เป็นส่วนตัว 100% • ลึกซึ้งราวกับอยู่ในภวังค์
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/login">
              <Button 
                size="lg" 
                className="h-16 px-12 text-xl bg-gradient-to-r from-violet-600/90 to-indigo-600/90 hover:from-violet-500 hover:to-indigo-500 shadow-xl shadow-violet-900/30 hover:shadow-violet-800/50 hover:scale-[1.04] transition-all duration-400 border border-violet-400/20"
              >
                เริ่มตีความฝันทันที
                <ArrowRight className="ml-3 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features - Glass card นุ่มขึ้น + hover ละมุน */}
      <section className="py-28 px-6 relative z-10">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-20 bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-cyan-200">
            ทำไมต้อง DreamAI?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="p-9 rounded-3xl bg-white/4 backdrop-blur-2xl border border-violet-500/15 hover:border-violet-400/40 transition-all duration-500 hover:scale-[1.04] group shadow-lg shadow-black/20">
              <BrainCircuit className="w-14 h-14 text-violet-400 mb-7 group-hover:text-violet-300 transition-colors duration-400" />
              <h3 className="text-2xl font-bold mb-5 text-violet-100">AI ลึกซึ้ง</h3>
              <p className="text-indigo-200/90 leading-relaxed font-light">
                ผสาน Large Language Model รุ่นล่าสุด เข้ากับจิตวิทยา + สัญลักษณ์โบราณ
              </p>
            </div>

            <div className="p-9 rounded-3xl bg-white/4 backdrop-blur-2xl border border-violet-500/15 hover:border-cyan-400/40 transition-all duration-500 hover:scale-[1.04] group shadow-lg shadow-black/20">
              <ShieldCheck className="w-14 h-14 text-cyan-400 mb-7 group-hover:text-cyan-300 transition-colors duration-400" />
              <h3 className="text-2xl font-bold mb-5 text-cyan-100">Privacy สูงสุด</h3>
              <p className="text-indigo-200/90 leading-relaxed font-light">
                ไม่เก็บฝันหลังวิเคราะห์ • PDPA & GDPR ready • เข้ารหัส end-to-end
              </p>
            </div>

            <div className="p-9 rounded-3xl bg-white/4 backdrop-blur-2xl border border-violet-500/15 hover:border-violet-400/40 transition-all duration-500 hover:scale-[1.04] group shadow-lg shadow-black/20">
              <Sparkles className="w-14 h-14 text-fuchsia-400 mb-7 group-hover:text-fuchsia-300 transition-colors duration-400" />
              <h3 className="text-2xl font-bold mb-5 text-fuchsia-100">ประสบการณ์ภวังค์</h3>
              <p className="text-indigo-200/90 leading-relaxed font-light">
                Animation นุ่มนวล • Cosmic serenity theme • Micro-interactions ละมุนราวอยู่ในความฝัน
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - เพิ่มความนุ่ม หรูหรา */}
      <section className="py-28 px-6 border-t border-violet-950/30 bg-gradient-to-t from-[#0f0e1a] via-[#1a1733]/30 to-transparent">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-10 text-violet-200/95">
            พร้อมจะสำรวจโลกภายในฝันของคุณหรือยัง?
          </h2>
          <Link href="/login">
            <Button 
              size="lg" 
              className="h-16 px-14 text-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600/90 hover:brightness-110 hover:scale-105 shadow-2xl shadow-violet-900/40 transition-all duration-400 border border-cyan-400/20"
            >
              เริ่มวิเคราะห์ฝันฟรี
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
