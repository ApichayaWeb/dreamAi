import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Moon, ShieldCheck, Sparkles, BrainCircuit, BarChart3 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-6 h-6 text-indigo-600" />
            <span className="text-xl font-bold text-slate-800 tracking-tight">DreamPsyche</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                เริ่มต้นใช้งาน <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="container mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-8 border border-indigo-100">
            <Sparkles className="w-4 h-4" />
            <span>ทำนายฝันด้วย AI </span>
          </div>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            ทำนายฝันด้วย AI 
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800">
                วิเคราะห์ความฝันทันที
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto grid md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-2xl bg-slate-50 hover:shadow-lg transition-shadow">
            <ShieldCheck className="w-10 h-10 text-green-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Privacy First</h3>
            <p className="text-slate-600">ข้อมูลของคุณคือความลับ ด้วยมาตรฐาน PDPA</p>
          </div>
        </div>
      </section>
    </div>
  )
}