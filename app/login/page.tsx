'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Moon, ArrowLeft, KeyRound, Calendar, MapPin, User, AlertTriangle } from 'lucide-react' 
import Link from 'next/link'

const THAI_PROVINCES = ["กรุงเทพมหานคร", "เชียงใหม่", "ขอนแก่น", "สงขลา", "ภูเก็ต", "ชลบุรี", "นครราชสีมา"].sort()

function LoginForm() {
  const [view, setView] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('prefer_not_to_say')
  const [location, setLocation] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // ✅ เช็ค Error จาก URL (ที่ส่งมาจาก Callback)
  useEffect(() => {
    const errorMsg = searchParams.get('error')
    if (errorMsg) {
      if (errorMsg.includes('otp_expired') || errorMsg.includes('invalid')) {
         toast.error('ลิงก์หมดอายุหรือใช้งานไม่ได้ กรุณาขอรีเซ็ตรหัสผ่านใหม่ (ต้องทำในเบราว์เซอร์เดียวกัน)')
      } else {
         toast.error(decodeURIComponent(errorMsg))
      }
    }
  }, [searchParams])

  // ... (ฟังก์ชัน handleAuth และอื่นๆ เหมือนเดิม ใช้โค้ดเดิมได้เลย)
  // เพื่อความกระชับ ผมขอละส่วน Logic เดิมไว้ (ใช้จากไฟล์ก่อนหน้าได้ครับ)
  // เพียงแค่ห่อด้วย Suspense ในส่วน return

  const handleAuth = async (e: React.FormEvent) => {
      // ... Logic เดิม ...
      e.preventDefault()
      setLoading(true)

      try {
        if (view === 'signup') {
          // ... Logic สมัคร ...
           if (password !== confirmPassword) { toast.error("รหัสผ่านไม่ตรงกัน"); setLoading(false); return; }
           if (!agreed) { toast.error("กรุณายอมรับ PDPA"); setLoading(false); return; }
           
           const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password })
           if (signUpError) throw signUpError
           
           if (authData.user) {
              await supabase.from('users').update({ gender, birth_date: birthDate, location }).eq('id', authData.user.id)
              await supabase.from('consents').insert({ user_id: authData.user.id, consent_type: 'pdpa', is_accepted: true })
           }
           toast.success("สมัครสมาชิกสำเร็จ!")
           router.push('/dashboard')

        } else if (view === 'login') {
          // ... Logic เข้าสู่ระบบ ...
           const { error } = await supabase.auth.signInWithPassword({ email, password })
           if (error) throw error
           toast.success("เข้าสู่ระบบสำเร็จ")
           router.push('/dashboard')

        } else if (view === 'reset') {
          // ... Logic รีเซ็ต ...
           const { error } = await supabase.auth.resetPasswordForEmail(email, {
               redirectTo: `${window.location.origin}/auth/callback?next=/update-password`
           })
           if (error) throw error
           toast.success("ส่งลิงก์รีเซ็ตแล้ว (กรุณาเช็คในอุปกรณ์เดียวกัน)")
           setView('login')
        }
      } catch (error: any) {
          toast.error(error.message)
      } finally {
          setLoading(false)
      }
  }
  
  const switchView = (v: any) => { setView(v); setConfirmPassword(''); setAgreed(false); }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans p-4">
      <Card className="w-full max-w-[450px] shadow-xl border-slate-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><div className="p-3 bg-indigo-50 rounded-full"><Moon className="w-8 h-8 text-indigo-600" /></div></div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            {view === 'signup' ? 'สร้างบัญชีใหม่' : view === 'login' ? 'ยินดีต้อนรับ' : 'กู้คืนรหัสผ่าน'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1"><label className="text-xs">อีเมล</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            
            {view !== 'reset' && (
                <div className="space-y-1"><label className="text-xs">รหัสผ่าน</label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
            )}

            {view === 'signup' && (
                <>
                    <div className="space-y-1"><label className="text-xs">ยืนยันรหัสผ่าน</label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1"><label className="text-xs">วันเกิด</label><Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required /></div>
                        <div className="space-y-1"><label className="text-xs">จังหวัด</label><Input list="provinces" value={location} onChange={(e) => setLocation(e.target.value)} required /><datalist id="provinces">{THAI_PROVINCES.map(p => <option key={p} value={p}/>)}</datalist></div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2"><Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(c as boolean)} /><Label htmlFor="terms" className="text-xs">ยอมรับ PDPA</Label></div>
                </>
            )}

            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
              {loading ? 'Processing...' : view === 'signup' ? 'สมัครสมาชิก' : view === 'login' ? 'เข้าสู่ระบบ' : 'ส่งลิงก์'}
            </Button>
            
            {view === 'reset' && <Button type="button" variant="ghost" className="w-full" onClick={() => setView('login')}><ArrowLeft className="w-4 h-4 mr-2"/> กลับ</Button>}
          </form>
        </CardContent>
        {view !== 'reset' && <CardFooter className="justify-center border-t p-4"><button onClick={() => switchView(view === 'signup' ? 'login' : 'signup')} className="text-indigo-600 hover:underline text-sm">{view === 'signup' ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครใหม่'}</button></CardFooter>}
      </Card>
    </div>
  )
}

// ต้องห่อด้วย Suspense เพราะใช้ useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
