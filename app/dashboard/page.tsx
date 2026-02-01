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
import { InstallBanner, usePWAInstall } from '@/components/install-prompt' // นำเข้า PWA

// --- Component: Moon Phase ---
const MoonPhaseWidget = () => {
  const today = new Date();
  const day = today.getDate();
  const phase = day % 30 < 15 ? "ข้างขึ้น" : "ข้างแรม";
  const age = day % 15;
  return (
    <div className="hidden md:flex items-center gap-2 bg-indigo-900 text-white px-3 py-1 rounded-full text-xs shadow-lg">
      <Moon className="w-3 h-3 text-yellow-300" />
      <span>{phase} {age} ค่ำ</span>
    </div>
  )
}

// --- Component: Quick Action ---
const QuickActionWidget = ({ onClick }: { onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-transform active:scale-95 animate-in zoom-in"
    title="เขียนฝันทันที"
  >
    <PenLine className="w-6 h-6" />
  </button>
)

export default function DashboardPage() {
  const [dream, setDream] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  
  // PWA State
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const { isSupported, isInstalled, installApp } = usePWAInstall()
  
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

      // ✅ 1. ตรวจสอบ Role จากฐานข้อมูล (ไม่ใช่ Hardcode แล้ว)
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (userData?.role === 'admin') {
        setIsAdmin(true)
      }

      // ✅ 2. ตรวจสอบการแสดง PWA Banner
      // ถ้ายังไม่ติดตั้ง + เครื่องรองรับ + ไม่เคยปิดไปใน 7 วันนี้
      const lastDismissed = localStorage.getItem('pwa_dismissed_ts')
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      if (!isInstalled && isSupported) {
        if (!lastDismissed || parseInt(lastDismissed) < sevenDaysAgo) {
           // หน่วงเวลา 2 วินาทีค่อยขึ้น เพื่อไม่ให้ตกใจ
           setTimeout(() => setShowInstallBanner(true), 2000)
        }
      }
    }
    initData()
  }, [router, supabase, isInstalled, isSupported])

  const handleDismissPWA = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa_dismissed_ts', Date.now().toString())
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('เบราว์เซอร์ไม่รองรับเสียง')
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
    setTimeout(() => textareaRef.current?.focus(), 500)
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
        toast.error("⏳ " + (data.error || "โควต้าเต็มแล้ว"))
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
    <div className="min-h-screen bg-slate-50 font-sans pb-20 relative">
      {/* PWA Banner */}
      {showInstallBanner && <InstallBanner onClose={handleDismissPWA} />}

      <nav className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg"><Sparkles className="w-5 h-5 text-white" /></div>
            <h1 className="text-xl font-bold text-slate-800 hidden md:block">DreamPsyche</h1>
            <MoonPhaseWidget />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-full pl-2 pr-4 border-slate-300 hover:bg-slate-100">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[100px] truncate hidden md:inline">{userEmail}</span>
              <Menu className="w-4 h-4 text-slate-500 md:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="mr-2 h-4 w-4" /> ตั้งค่าโปรไฟล์
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/history')}>
              <History className="mr-2 h-4 w-4" /> ประวัติความฝัน
            </DropdownMenuItem>
            
            {/* ✅ เมนูติดตั้งแอป (แสดงเฉพาะเมื่อติดตั้งได้) */}
            {isSupported && !isInstalled && (
              <DropdownMenuItem onClick={() => { installApp(); handleDismissPWA() }} className="text-green-600 font-medium bg-green-50">
                <Download className="mr-2 h-4 w-4" /> ติดตั้งแอปลงเครื่อง
              </DropdownMenuItem>
            )}

            {/* ✅ เมนู Admin (แสดงเฉพาะ Role Admin) */}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/admin')} className="text-indigo-600 font-medium">
                  <Settings className="mr-2 h-4 w-4" /> ผู้ดูแลระบบ (Admin)
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" /> ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      <div className="container mx-auto p-4 max-w-3xl mt-6">
        <Card className="shadow-sm border-slate-200 mb-8 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-white">
            <CardTitle className="flex items-center justify-between text-slate-800">
                <span className="flex items-center gap-2"><Moon className="w-5 h-5 text-indigo-500" /> ทำนายฝัน</span>
                <span className="text-xs font-normal text-slate-500 bg-white px-2 py-1 rounded-full border">
                  {format(new Date(), 'd MMM yyyy', { locale: th })}
                </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="relative">
              <Textarea 
                ref={textareaRef}
                placeholder="เล่าความฝันของคุณให้ฟังหน่อย... (เช่น ฝันเห็นงูใหญ่สีดำ)" 
                value={dream}
                onChange={(e) => setDream(e.target.value)}
                rows={5}
                className="text-lg resize-none pr-12 shadow-inner bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
              />
              <button 
                onClick={isRecording ? () => recognitionRef.current?.stop() : startListening}
                className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-500 text-white shadow-lg animate-pulse scale-110' : 'bg-white text-slate-400 hover:text-indigo-600 shadow-sm border'}`}
                title="กดเพื่อพูด"
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            
            <Button className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-[0.99]" onClick={handleSubmit} disabled={loading || !dream}>
              {loading ? '🔮 กำลังเชื่อมต่อจิตใต้สำนึก...' : 'เริ่มทำนายฝัน'}
            </Button>
          </CardContent>
        </Card>

        {loading && (
           <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-xl bg-slate-200/60" />
              <Skeleton className="h-24 w-full rounded-xl bg-slate-200/60" />
           </div>
        )}

        {!loading && result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 pb-10">
            <Card className="bg-white border-l-4 border-l-indigo-500 shadow-lg">
              <CardHeader><CardTitle className="text-indigo-700 flex items-center gap-2"><Sparkles className="w-5 h-5" /> ผลการวิเคราะห์</CardTitle></CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed whitespace-pre-line text-slate-700">{result.analysis}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-200 rounded-full opacity-20 blur-xl"></div>
              <CardHeader><CardTitle className="text-orange-800 text-center text-sm uppercase tracking-widest font-semibold">เลขมงคลนำโชค</CardTitle></CardHeader>
              <CardContent className="text-center">
                <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 tracking-tight drop-shadow-sm">{result.lucky_numbers}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      <QuickActionWidget onClick={scrollToInput} />
    </div>
  )
}