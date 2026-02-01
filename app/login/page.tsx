'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Chrome, MessageCircle, Moon, ArrowLeft, KeyRound, MapPin, Calendar, User } from 'lucide-react' 
import Link from 'next/link'

// รายชื่อจังหวัดภาษาไทย
const THAI_PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
].sort()

const checkPasswordStrength = (pass: string) => {
  if (pass.length === 0) return 0
  let score = 0
  if (pass.length >= 8) score += 1
  if (/[A-Z]/.test(pass)) score += 1
  if (/[0-9]/.test(pass)) score += 1
  if (/[^A-Za-z0-9]/.test(pass)) score += 1
  return score
}

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('prefer_not_to_say')
  const [location, setLocation] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.replace('/dashboard')
    }
    checkSession()
  }, [router, supabase])

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password))
  }, [password])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (view === 'signup') {
        if (password !== confirmPassword) { toast.error("รหัสผ่านยืนยันไม่ตรงกัน"); setLoading(false); return; }
        if (!agreed) { toast.error("กรุณายอมรับนโยบายความเป็นส่วนตัว"); setLoading(false); return; }
        if (passwordStrength < 2) { toast.warning("รหัสผ่านง่ายเกินไป"); setLoading(false); return; }
        if (!birthDate || !location) { toast.error("กรุณากรอกข้อมูลให้ครบ"); setLoading(false); return; }
        if (!THAI_PROVINCES.includes(location)) { toast.error("กรุณาเลือกจังหวัดจากรายการ"); setLoading(false); return; }

        // 1. สร้าง User (Auth)
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        })
        if (signUpError) throw signUpError

        // 2. บันทึกข้อมูลเสริม (Profile, Consent, Audit)
        if (authData.user) {
            const userId = authData.user.id;

            // Update Profile
            await supabase.from('users').update({
                gender, birth_date: birthDate, location
            }).eq('id', userId);

            // ✅ Insert Consent (บันทึกลงตาราง consents)
            await supabase.from('consents').insert({
                user_id: userId,
                consent_type: 'pdpa_privacy_policy',
                is_accepted: true
            });

            // ✅ Insert Audit Log (บันทึกการสมัครสมาชิก)
            await supabase.from('audit_logs').insert({
                user_id: userId,
                action: 'REGISTER',
                details: { method: 'email', timestamp: new Date().toISOString() }
            });
        }

        toast.success("สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ")
        router.push('/dashboard')

      } else if (view === 'login') {
        const { data: loginData, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        
        // ✅ Insert Audit Log (บันทึกการเข้าสู่ระบบ)
        if (loginData.user) {
            await supabase.from('audit_logs').insert({
                user_id: loginData.user.id,
                action: 'LOGIN',
                details: { timestamp: new Date().toISOString() }
            });
        }

        toast.success("เข้าสู่ระบบสำเร็จ")
        router.push('/dashboard')

      } else if (view === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
        })
        if (error) throw error
        toast.success("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว")
        setView('login')
      }

    } catch (error: any) {
        let msg = error.message
        if (msg.includes("Invalid login")) msg = "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        if (msg.includes("already registered")) msg = "อีเมลนี้มีผู้ใช้งานแล้ว"
        toast.error(msg)
    } finally {
        setLoading(false)
    }
  }

  // ... (ส่วน Render Switch View เหมือนเดิม) ...
  const switchView = (newView: 'login' | 'signup') => {
      setView(newView)
      if (newView === 'login') { setConfirmPassword(''); setAgreed(false); }
  }

  return (
    // ... (UI Code ส่วน JSX เหมือนเดิมทั้งหมด ใช้ไฟล์เดิมได้เลย แค่แก้ handleAuth ข้างบน) ...
    <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans p-4 py-8">
      <Card className="w-full max-w-[450px] shadow-xl border-slate-200 animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-indigo-50 rounded-full">
                {view === 'reset' ? <KeyRound className="w-8 h-8 text-indigo-600" /> : <Moon className="w-8 h-8 text-indigo-600" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            {view === 'signup' ? 'สร้างบัญชีใหม่' : view === 'login' ? 'ยินดีต้อนรับกลับมา' : 'กู้คืนรหัสผ่าน'}
          </CardTitle>
          <CardDescription>
            {view === 'signup' ? 'กรอกข้อมูลเพื่อเริ่มวิเคราะห์จิตใต้สำนึก' : view === 'login' ? 'เข้าสู่ระบบเพื่อดูประวัติความฝัน' : 'กรอกอีเมลเพื่อรับลิงก์'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            
            <div className="space-y-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">อีเมล</label>
                    <Input 
                        type="email" 
                        placeholder="name@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                {view !== 'reset' && (
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-medium text-slate-700">รหัสผ่าน</label>
                            {view === 'login' && (
                                <button type="button" onClick={() => setView('reset')} className="text-xs text-indigo-600 hover:underline">
                                    ลืมรหัสผ่าน?
                                </button>
                            )}
                        </div>
                        <Input 
                            type="password" 
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        {view === 'signup' && password.length > 0 && (
                            <div className="flex gap-1 h-1 mt-1">
                                <div className={`flex-1 rounded-full ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-slate-200'}`} />
                                <div className={`flex-1 rounded-full ${passwordStrength >= 2 ? 'bg-yellow-500' : 'bg-slate-200'}`} />
                                <div className={`flex-1 rounded-full ${passwordStrength >= 3 ? 'bg-blue-500' : 'bg-slate-200'}`} />
                                <div className={`flex-1 rounded-full ${passwordStrength >= 4 ? 'bg-green-500' : 'bg-slate-200'}`} />
                            </div>
                        )}
                    </div>
                )}

                {view === 'signup' && (
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">ยืนยันรหัสผ่าน</label>
                        <Input 
                            type="password" 
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                )}
            </div>

            {view === 'signup' && (
                <div className="pt-2 space-y-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">ข้อมูลส่วนตัว (เพื่อความแม่นยำในการทำนาย)</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> วันเกิด
                            </label>
                            <Input 
                                type="date" 
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                required
                                className="text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                                <User className="w-3 h-3" /> เพศ
                            </label>
                            <select 
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                            >
                                <option value="prefer_not_to_say">ไม่ระบุ</option>
                                <option value="male">ชาย</option>
                                <option value="female">หญิง</option>
                                <option value="lgbtq">LGBTQ+</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> จังหวัด / ภูมิภาค
                        </label>
                        <Input 
                            list="provinces"
                            placeholder="ค้นหาชื่อจังหวัด..." 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                            className="text-sm"
                        />
                        <datalist id="provinces">
                            {THAI_PROVINCES.map((province) => (
                                <option key={province} value={province} />
                            ))}
                        </datalist>
                    </div>
                </div>
            )}

            {view === 'signup' && (
                <div className="flex items-start space-x-2 pt-2">
                    <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(c as boolean)} />
                    <Label htmlFor="terms" className="text-xs text-slate-600 leading-tight cursor-pointer">
                        ฉันยอมรับ <Link href="/privacy" className="text-indigo-600 hover:underline">นโยบายความเป็นส่วนตัว</Link>
                    </Label>
                </div>
            )}

            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 h-11 mt-2" disabled={loading}>
              {loading ? 'กำลังประมวลผล...' : 
                view === 'signup' ? 'สมัครสมาชิก' : 
                view === 'login' ? 'เข้าสู่ระบบ' : 'ส่งลิงก์รีเซ็ต'}
            </Button>

            {view === 'reset' && (
                <Button type="button" variant="ghost" className="w-full" onClick={() => setView('login')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> กลับไปหน้าเข้าสู่ระบบ
                </Button>
            )}
          </form>
        </CardContent>
        
        {view !== 'reset' && (
            <CardFooter className="flex justify-center border-t p-6">
                <p className="text-sm text-slate-600">
                    {view === 'signup' ? 'มีบัญชีอยู่แล้ว? ' : 'ยังไม่มีบัญชี? '}
                    <button 
                        onClick={() => switchView(view === 'signup' ? 'login' : 'signup')} 
                        className="text-indigo-600 font-medium hover:underline focus:outline-none"
                    >
                        {view === 'signup' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกใหม่'}
                    </button>
                </p>
            </CardFooter>
        )}
      </Card>
    </div>
  )
}