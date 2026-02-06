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
import { Chrome, MessageCircle, Moon, ArrowLeft, KeyRound, MapPin, Calendar, User, Lock, Mail, Sparkles } from 'lucide-react'
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
        // --- 🔄 โหมดลืมรหัสผ่าน ---
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            // ลิงก์จะพากลับมาที่ auth/callback แล้ว redirect ไปหน้า update-password
            redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
        })
        if (error) throw error
        toast.success("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว กรุณาตรวจสอบ")
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

  // ... (ส่วน Render Switch View) ...
  const switchView = (newView: 'login' | 'signup') => {
      setView(newView)
      if (newView === 'login') { setConfirmPassword(''); setAgreed(false); }
  }

 return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0e1f] via-[#1e1738] to-[#0f0e1f] text-[#e5e5ff]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(167,139,250,0.16),transparent_55%)] animate-pulse-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_75%,rgba(99,102,241,0.14),transparent_65%)] animate-pulse-slow-delay" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_70%)]" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-600/30 to-indigo-600/30 backdrop-blur-2xl border border-violet-400/20 shadow-xl shadow-violet-900/30 animate-float-slow">
              <Moon className="w-10 h-10 text-violet-200 animate-pulse-slow" />
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-200 via-indigo-200 to-cyan-100 tracking-tight drop-shadow-lg">
              DreamAI
            </h1>
            <p className="mt-4 text-indigo-200/90 text-lg font-light">
              ตีความฝันด้วยปัญญาประดิษฐ์แห่งภวังค์
            </p>
          </div>

          <Card className="bg-violet-950/12 backdrop-blur-2xl border border-violet-500/15 shadow-2xl shadow-violet-950/40 rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
            <CardHeader className="text-center pb-6 space-y-5 border-b border-violet-500/10">
              <div className="flex justify-center">
                {view === 'reset' ? (
                  <KeyRound className="w-14 h-14 text-violet-300 animate-pulse-slow" />
                ) : view === 'signup' ? (
                  <Sparkles className="w-14 h-14 text-cyan-300 animate-pulse-slow" />
                ) : (
                  <Lock className="w-14 h-14 text-indigo-300 animate-pulse-slow" />
                )}
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-100 to-cyan-100">
                {view === 'signup' ? 'เริ่มต้นการเดินทางในฝัน' : 
                 view === 'login' ? 'ยินดีต้อนรับสู่ DreamAI' : 
                 'กู้คืนการเข้าถึงของคุณ'}
              </CardTitle>
              <CardDescription className="text-indigo-200/85 text-base font-light leading-relaxed">
                {view === 'signup' ? 'กรอกข้อมูลเพื่อการตีความฝันที่ลึกซึ้งและแม่นยำ' :
                 view === 'login' ? 'เข้าสู่ระบบเพื่อสำรวจประวัติฝันและการวิเคราะห์' :
                 'ป้อนอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-10 px-8">
              <form onSubmit={handleAuth} className="space-y-7">
                <div className="space-y-6">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-300/70 group-focus-within:text-violet-300 transition-colors" />
                    <Input
                      type="email"
                      placeholder="อีเมลของคุณ"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-12 h-13 bg-violet-950/20 border-violet-500/30 text-[#f0f0ff] placeholder:text-indigo-300/60 focus:border-violet-400 focus:ring-violet-400/20 focus:bg-violet-950/30 transition-all duration-300 shadow-inner"
                    />
                  </div>

                  {view !== 'reset' && (
                    <div className="space-y-2">
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-300/70 group-focus-within:text-violet-300 transition-colors" />
                        <Input
                          type="password"
                          placeholder="รหัสผ่าน"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="pl-12 h-13 bg-violet-950/20 border-violet-500/30 text-[#f0f0ff] placeholder:text-indigo-300/60 focus:border-violet-400 focus:ring-violet-400/20 focus:bg-violet-950/30 transition-all duration-300 shadow-inner"
                        />
                      </div>
                      
                      {/* ✅ ปุ่มลืมรหัสผ่าน (จะแสดงเมื่ออยู่ในหน้า Login) */}
                      {view === 'login' && (
                        <div className="flex justify-end">
                            <button 
                                type="button" 
                                onClick={() => setView('reset')} 
                                className="text-sm text-cyan-300 hover:text-cyan-200 underline-offset-4 hover:underline transition-colors"
                            >
                                ลืมรหัสผ่าน?
                            </button>
                        </div>
                      )}

                      {view === 'signup' && password.length > 0 && (
                        <div className="flex gap-2.5 mt-3">
                          {[1,2,3,4].map((level) => (
                            <div
                              key={level}
                              className={`h-2.5 flex-1 rounded-full transition-all duration-400 ${
                                passwordStrength >= level
                                  ? level === 1 ? 'bg-rose-400/80' :
                                    level === 2 ? 'bg-amber-400/80' :
                                    level === 3 ? 'bg-blue-400/80' : 'bg-emerald-400/80'
                                  : 'bg-violet-800/40'
                              } shadow-sm`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ส่วน signup fields */}
                  {view === 'signup' && (
                    <>
                      <Input
                        type="password"
                        placeholder="ยืนยันรหัสผ่าน"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-13 bg-violet-950/20 border-violet-500/30 text-[#f0f0ff] placeholder:text-indigo-300/60 focus:border-violet-400 focus:ring-violet-400/20 focus:bg-violet-950/30 transition-all shadow-inner"
                      />

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-sm text-indigo-200 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> วันเกิด
                          </Label>
                          <Input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            required
                            className="h-13 bg-violet-950/20 border-violet-500/30 text-[#f0f0ff] focus:border-violet-400 focus:ring-violet-400/20 transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-sm text-indigo-200 flex items-center gap-2">
                            <User className="w-4 h-4" /> เพศ
                          </Label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="flex h-13 w-full rounded-md border border-violet-500/30 bg-violet-950/20 px-4 text-[#f0f0ff] focus:border-violet-400 focus:ring-violet-400/20 transition-all shadow-inner"
                          >
                            <option value="prefer_not_to_say">ไม่ระบุ</option>
                            <option value="male">ชาย</option>
                            <option value="female">หญิง</option>
                            <option value="lgbtq">LGBTQ+</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-sm text-indigo-200 flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> จังหวัด
                        </Label>
                        <Input
                          list="provinces"
                          placeholder="พิมพ์หรือเลือกจังหวัด..."
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          required
                          className="h-13 bg-violet-950/20 border-violet-500/30 text-[#f0f0ff] placeholder:text-indigo-300/60 focus:border-violet-400 focus:ring-violet-400/20 transition-all shadow-inner"
                        />
                        <datalist id="provinces">
                          {THAI_PROVINCES.map((p) => <option key={p} value={p} />)}
                        </datalist>
                      </div>
                    </>
                  )}
                </div>

                {view === 'signup' && (
                  <div className="flex items-start space-x-3 pt-4">
                    <Checkbox
                      id="terms"
                      checked={agreed}
                      onCheckedChange={(c) => setAgreed(!!c)}
                      className="border-violet-400/50 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-500 mt-1.5 transition-colors"
                    />
                    <Label htmlFor="terms" className="text-sm text-indigo-200 leading-relaxed cursor-pointer">
                      ฉันยอมรับ <Link href="/privacy" className="text-cyan-300 hover:text-cyan-200 underline-offset-4 hover:underline">นโยบายความเป็นส่วนตัว (PDPA)</Link>
                    </Label>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 mt-6 text-lg font-semibold bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:brightness-110 hover:scale-[1.02] transition-all duration-400 shadow-xl shadow-violet-900/50 border border-violet-400/20"
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      กำลังเชื่อมต่อสู่จิตใต้สำนึก...
                    </span>
                  ) : view === 'signup' ? 'เริ่มต้นการเดินทางในฝัน' :
                    view === 'login' ? 'เข้าสู่ระบบ' : 'ส่งลิงก์รีเซ็ต'}
                </Button>

                {view === 'reset' && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-indigo-200 hover:text-white hover:bg-violet-950/20 mt-3 transition-colors"
                    onClick={() => setView('login')}
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" /> กลับไปหน้าเข้าสู่ระบบ
                  </Button>
                )}
              </form>
            </CardContent>

            {view !== 'reset' && (
              <CardFooter className="justify-center border-t border-violet-500/10 py-6 bg-violet-950/8">
                <p className="text-base text-indigo-200">
                  {view === 'signup' ? 'มีบัญชีแล้ว? ' : 'ยังไม่มีบัญชี? '}
                  <button
                    type="button"
                    onClick={() => switchView(view === 'signup' ? 'login' : 'signup')}
                    className="text-cyan-300 font-medium hover:text-cyan-200 underline-offset-4 hover:underline focus:outline-none"
                  >
                    {view === 'signup' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}
                  </button>
                </p>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
