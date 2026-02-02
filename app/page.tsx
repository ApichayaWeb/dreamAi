import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Moon, ShieldCheck, Sparkles, BrainCircuit, Stars } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 text-white font-sans overflow-x-hidden relative">
      {/* Background subtle particles / stars - ใช้ CSS หรือ library เช่น particles.js ใน production */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.12),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.15),transparent_50%)]" />
      </div>

      {/* Navbar - Glassmorphism */}
      <header className="fixed top-0 w-full bg-slate-900/30 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Moon className="w-7 h-7 text-purple-400" />
              <Sparkles className="w-4 h-4 text-cyan-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-indigo-300 to-cyan-300 tracking-tight">
              DreamAI
            </span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
                เข้าสู่ระบบ
              </Button>
            </Link>
            <Link href="/analyze">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30">
                วิเคราะห์ฝันเลย <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - ใหญ่ขึ้น, dreamy ขึ้น */}
      <section className="pt-40 pb-32 px-6 text-center relative">
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 backdrop-blur-lg border border-white/10 text-purple-300 text-base font-medium mb-10">
            <Stars className="w-5 h-5 animate-pulse" />
            <span>AI Dream Interpreter 2026</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight bg-clip-text text-transparent bg-gradient-to-br from-purple-200 via-indigo-200 to-cyan-200 animate-gradient-x">
            ฝันของคุณ<br />ซ่อนความหมายอะไรไว้?
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed opacity-90">
            ปลดล็อกจิตใต้สำนึกด้วย AI ล่าสุด<br />
            วิเคราะห์ฝันแบบเรียลไทม์ • เป็นส่วนตัว 100% • ลึกซึ้งราวกับอยู่ในความฝัน
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/analyze">
              <Button size="lg" className="h-16 px-10 text-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-2xl shadow-purple-900/40 hover:scale-105 transition-all duration-300">
                เริ่มตีความฝันทันที
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-16 px-10 text-xl border-purple-500/50 text-purple-300 hover:bg-purple-950/30 hover:text-purple-200">
              ดูตัวอย่างการตีความ
            </Button>
          </div>
        </div>
      </section>

      {/* Features - Glass cards */}
      <section className="py-24 px-6 relative z-10">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-cyan-300">
            ทำไมต้อง DreamAI?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/40 transition-all duration-500 hover:scale-[1.03] group">
              <BrainCircuit className="w-14 h-14 text-purple-400 mb-6 group-hover:text-purple-300 transition-colors" />
              <h3 className="text-2xl font-bold mb-4">AI ลึกซึ้ง</h3>
              <p className="text-slate-300 leading-relaxed">
                ใช้ Large Language Model รุ่นล่าสุด ผสานจิตวิทยา + สัญลักษณ์โบราณ
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-indigo-500/40 transition-all duration-500 hover:scale-[1.03] group">
              <ShieldCheck className="w-14 h-14 text-cyan-400 mb-6 group-hover:text-cyan-300 transition-colors" />
              <h3 className="text-2xl font-bold mb-4">Privacy สูงสุด</h3>
              <p className="text-slate-300 leading-relaxed">
                ไม่เก็บฝันของคุณหลังวิเคราะห์ • PDPA & GDPR ready • End-to-end encrypted
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/40 transition-all duration-500 hover:scale-[1.03] group">
              <Sparkles className="w-14 h-14 text-pink-400 mb-6 group-hover:text-pink-300 transition-colors" />
              <h3 className="text-2xl font-bold mb-4">ประสบการณ์ฝัน</h3>
              <p className="text-slate-300 leading-relaxed">
                Animation นุ่มนวล • Dark cosmic theme • Micro-interactions ที่ทำให้รู้สึกเหมือนอยู่ในภวังค์
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA footer section */}
      <section className="py-24 px-6 border-t border-white/5 bg-gradient-to-t from-indigo-950 to-transparent">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-purple-200">
            พร้อมจะสำรวจโลกในฝันของคุณหรือยัง?
          </h2>
          <Button size="lg" className="h-16 px-12 text-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:brightness-110 shadow-xl shadow-purple-900/50">
            เริ่มวิเคราะห์ฝัน
          </Button>
        </div>
      </section>
    </div>
  )
}
