'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { LogOut, Sparkles, Moon, Mic, MicOff, User, History, Settings, Menu, PenLine, Download } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'

// MoonPhaseWidget
const MoonPhaseWidget = () => {
  const today = new Date()
  const day = today.getDate()
  const phase = day % 30 < 15 ? "ข้างขึ้น" : "ข้างแรม"
  const age = day % 15 || 15 // ป้องกัน 0
  return (
    <div className="hidden md:flex items-center gap-2.5 bg-violet-950/20 backdrop-blur-lg border border-violet-500/20 text-indigo-200 px-4 py-1.5 rounded-full text-sm shadow-md shadow-violet-900/20 animate-pulse-slow">
      <Moon className="w-4 h-4 text-violet-300" />
      <span>{phase} {age} ค่ำ</span>
    </div>
  )
}

// Quick Action FAB - นุ่มขึ้น
const QuickActionWidget = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="fixed bottom-8 right-6 sm:right-8 w-16 h-16 bg-gradient-to-br from-violet-600/90 to-indigo-600/90 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full shadow-2xl shadow-violet-900/50 flex items-center justify-center z-50 transition-all duration-400 hover:scale-110 active:scale-95 border border-violet-400/20"
    title="เขียนฝันทันที"
  >
    <PenLine className="w-7 h-7" />
  </button>
)

export default function DashboardPage() {
  const [dream, setDream] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  // PWA Install Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)

  const recognitionRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email || '')

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role === 'admin') setIsAdmin(true)
    }
    initData()

    // PWA Install Setup
    const ua = window.navigator.userAgent.toLowerCase()
    setIsIOS(/iphone|ipad|ipod/.test(ua))

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    window.addEventListener('appinstalled', () => {
      setCanInstall(false)
      toast.success('ติดตั้ง DreamAI สำเร็จ! เปิดจากไอคอนบนหน้าจอหรือเดสก์ท็อปได้เลย', { duration: 6000 })
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [router, supabase])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        toast.success('กำลังติดตั้ง DreamAI...')
      } else {
        toast.info('คุณยกเลิกการติดตั้ง')
      }
      setDeferredPrompt(null)
      setCanInstall(false)
    } else if (isIOS) {
      setShowIOSModal(true)
    } else {
      toast.info('กดเมนู (สามจุด) ที่มุมขวาบน > เลือก "ติดตั้งแอป" หรือ "Add to Home screen"', { duration: 8000 })
    }
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('เบราว์เซอร์นี้ไม่รองรับการบันทึกเสียง')
      return
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'th-TH'
    recognition.start()
    setIsRecording(true)
    recognition.onresult = (event: any) => {
      setDream(event.results[0][0].transcript)
      setIsRecording(false)
    }
    recognitionRef.current = recognition
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const scrollToInput = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => textareaRef.current?.focus(), 400)
  }

  const handleSubmit = async () => {
    if (!dream.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dreamText: dream })
      })

      if (response.status === 429) {
        const data = await response.json()
        toast.error("⏳ " + (data.error || "โควต้าเต็มแล้ว กรุณารอสักครู่"))
        return
      }

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0e1f] via-[#1e1738] to-[#0f0e1f] text-[#e5e5ff] relative overflow-x-hidden">
      {/* Background glow - นุ่ม ละมุน ดู serene */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(167,139,250,0.18),transparent_60%)] animate-pulse-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(99,102,241,0.15),transparent_65%)] animate-pulse-slow-delay" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_70%)]" />
      </div>

      {/* Navbar - glass นุ่มขึ้น */}
      <nav className="sticky top-0 z-50 bg-violet-950/18 backdrop-blur-2xl border-b border-violet-500/15 px-4 sm:px-6 md:px-8 py-4 flex justify-between items-center shadow-lg shadow-violet-950/30">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-violet-600/70 to-indigo-600/70 p-3 rounded-xl shadow-md border border-violet-400/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-200 via-indigo-200 to-cyan-100 tracking-tight hidden md:block">
            DreamAI
          </h1>
          <MoonPhaseWidget />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-3 rounded-full px-3 py-1.5 hover:bg-violet-950/25 text-indigo-200">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500/70 to-indigo-500/70 rounded-full flex items-center justify-center text-white font-bold border border-violet-400/30 shadow-sm">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[160px] truncate hidden md:inline">{userEmail}</span>
              <Menu className="w-5 h-5 text-indigo-300 md:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-violet-950/25 backdrop-blur-2xl border border-violet-500/20 text-indigo-200 shadow-xl rounded-2xl">
            <DropdownMenuLabel className="text-violet-200">บัญชีของฉัน</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-violet-500/10" />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="focus:bg-violet-950/30 cursor-pointer transition-colors">
              <User className="mr-3 h-4 w-4" /> ตั้งค่าโปรไฟล์
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/history')} className="focus:bg-violet-950/30 cursor-pointer transition-colors">
              <History className="mr-3 h-4 w-4" /> ประวัติความฝัน
            </DropdownMenuItem>

            {(canInstall || isIOS) && (
              <DropdownMenuItem onClick={handleInstall} className="text-cyan-300 focus:bg-cyan-950/30 cursor-pointer transition-colors">
                <Download className="mr-3 h-4 w-4" /> ติดตั้ง DreamAI
              </DropdownMenuItem>
            )}

            {isAdmin && (
              <>
                <DropdownMenuSeparator className="bg-violet-500/10" />
                <DropdownMenuItem onClick={() => router.push('/admin')} className="text-violet-300 focus:bg-violet-950/30 cursor-pointer transition-colors">
                  <Settings className="mr-3 h-4 w-4" /> ผู้ดูแลระบบ
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator className="bg-violet-500/10" />
            <DropdownMenuItem onClick={handleLogout} className="text-rose-300 focus:bg-rose-950/30 cursor-pointer transition-colors">
              <LogOut className="mr-3 h-4 w-4" /> ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-4xl relative z-10">
        {/* ปุ่มติดตั้ง - ปรับสีให้กลมกลืน */}
        {(canInstall || isIOS) && (
          <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
            <Button
              onClick={handleInstall}
              className="gap-2 px-8 py-6 text-lg bg-gradient-to-r from-cyan-600/90 to-teal-600/90 hover:from-cyan-500 hover:to-teal-500 text-white shadow-xl shadow-cyan-900/40 transition-all duration-400 hover:scale-105 border border-cyan-400/20"
            >
              <Download className="w-5 h-5" />
              ติดตั้ง DreamAI ลงเครื่อง (ฟรี)
            </Button>
            <p className="mt-3 text-sm text-indigo-300/90">เปิดแอปเร็วจากหน้าจอหลัก — สะดวกทุกครั้งที่อยากตีฝัน</p>
          </div>
        )}

        <Card className="bg-violet-950/18 backdrop-blur-2xl border border-violet-500/20 shadow-2xl shadow-violet-950/35 rounded-3xl overflow-hidden mb-12 animate-in fade-in zoom-in-95 duration-700">
          <CardHeader className="bg-gradient-to-r from-violet-950/25 to-indigo-950/25 pb-6 border-b border-violet-500/15">
            <CardTitle className="flex items-center justify-between text-[#f0f0ff] text-2xl md:text-3xl font-bold">
              <span className="flex items-center gap-3">
                <Moon className="w-7 h-7 text-violet-300 animate-pulse-slow" /> ทำนายฝันด้วย AI
              </span>
              <span className="text-base font-normal text-indigo-200 bg-violet-950/30 px-5 py-2 rounded-full border border-violet-500/20">
                {format(new Date(), 'd MMMM yyyy', { locale: th })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-10 space-y-8 px-6 md:px-8">
            <div className="relative group">
              <Textarea
                ref={textareaRef}
                placeholder="เล่าความฝันของคุณให้ DreamAI ฟัง... (เช่น ฝันเห็นทะเลสีม่วง ลอยอยู่เหนือเมืองโบราณ)"
                value={dream}
                onChange={(e) => setDream(e.target.value)}
                rows={7}
                className="text-base md:text-lg resize-none pr-20 bg-violet-950/15 border-violet-500/25 text-[#f0f0ff] placeholder:text-indigo-300/70 focus:border-violet-400 focus:ring-violet-400/20 focus:bg-violet-950/25 transition-all duration-300 rounded-2xl shadow-inner min-h-[160px] group-focus-within:shadow-violet-900/30"
              />
              <button
                onClick={isRecording ? () => recognitionRef.current?.stop() : startListening}
                className={`absolute bottom-5 right-5 p-4 rounded-full transition-all duration-400 shadow-lg ${
                  isRecording
                    ? 'bg-rose-600/90 text-white animate-pulse scale-110 shadow-rose-900/50'
                    : 'bg-violet-950/40 text-violet-300 hover:bg-violet-600/70 hover:text-white border border-violet-400/30 hover:scale-105'
                }`}
                title={isRecording ? 'หยุดบันทึก' : 'บันทึกเสียงเล่าฝัน (ไทย)'}
              >
                {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>
            </div>

            <Button
              className="w-full h-14 md:h-16 text-lg md:text-xl font-semibold bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:brightness-110 hover:scale-[1.02] transition-all duration-400 shadow-xl shadow-violet-900/50 disabled:opacity-50 border border-violet-400/15"
              onClick={handleSubmit}
              disabled={loading || !dream.trim()}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  กำลังเชื่อมต่อจิตใต้สำนึก...
                </span>
              ) : '🔮 ทำนายฝันเลย'}
            </Button>
          </CardContent>
        </Card>

        {loading && (
          <div className="space-y-8">
            <Skeleton className="h-80 w-full rounded-3xl bg-violet-950/20" />
            <Skeleton className="h-64 w-full rounded-3xl bg-violet-950/20" />
          </div>
        )}

        {!loading && result && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-800">
            <Card className="bg-violet-950/20 backdrop-blur-xl border border-violet-500/25 shadow-xl shadow-violet-950/30 rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-violet-500/15 pb-6">
                <CardTitle className="text-violet-200 flex items-center gap-3 text-xl md:text-2xl font-bold">
                  <Sparkles className="w-6 h-6 animate-pulse-slow" /> ผลการตีความ
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 text-[#f0f0ff] text-base md:text-lg leading-relaxed whitespace-pre-line px-6 md:px-8">
                {result.analysis}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-950/30 to-orange-950/20 border border-amber-700/30 shadow-2xl shadow-amber-950/35 rounded-3xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.12),transparent_80%)] opacity-60" />
              <CardHeader className="border-b border-amber-700/20 pb-6">
                <CardTitle className="text-amber-200 text-center text-base md:text-lg uppercase tracking-wider font-semibold">
                  เลขนำโชคจากฝันของคุณ
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12 md:py-16">
                <p className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 tracking-tighter drop-shadow-2xl animate-glow-slow">
                  {result.lucky_numbers}
                </p>
                <p className="mt-4 text-amber-200/90 text-lg">นำโชคในวันนี้และวันข้างหน้า</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <QuickActionWidget onClick={scrollToInput} />

      {/* iOS Modal - ปรับให้กลมกลืนธีม */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-violet-950/25 backdrop-blur-2xl rounded-3xl max-w-md w-full border border-violet-500/20 shadow-2xl overflow-hidden">
            <div className="p-7 pb-5">
              <h3 className="text-2xl font-bold text-cyan-300 mb-5">
                วิธีติดตั้ง DreamAI บน iOS
              </h3>
              <ol className="list-decimal list-inside space-y-4 text-indigo-200 text-base leading-relaxed">
                <li>กดไอคอน <strong>แชร์</strong> (สี่เหลี่ยมมีลูกศรขึ้น) ใน Safari</li>
                <li>เลื่อนหา <strong>เพิ่มลงในหน้าจอโฮม</strong></li>
                <li>แตะ <strong>เพิ่ม</strong> เพื่อยืนยัน</li>
                <li>ไอคอนจะปรากฏบนหน้าจอหลัก — แตะเปิดได้ทันที!</li>
              </ol>
            </div>
            <div className="bg-violet-950/20 px-7 py-5 flex justify-end gap-4 border-t border-violet-500/15">
              <Button variant="ghost" onClick={() => setShowIOSModal(false)} className="text-indigo-200 hover:text-white">
                ปิด
              </Button>
              <Button onClick={() => setShowIOSModal(false)} className="bg-cyan-600 hover:bg-cyan-500">
                เข้าใจแล้ว
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
