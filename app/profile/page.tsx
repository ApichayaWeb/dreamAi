'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, User, Save, Lock, Calendar, KeyRound, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)

  // Profile State
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('prefer_not_to_say')
  const [location, setLocation] = useState('')

  // Password State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setEmail(user.email || '')

      const { data } = await supabase
        .from('users')
        .select('birth_date, gender, location')
        .eq('id', user.id)
        .single()

      if (data) {
        setBirthDate(data.birth_date || '')
        setGender(data.gender || 'prefer_not_to_say')
        setLocation(data.location || '')
      }
    }
    getProfile()
  }, [router, supabase])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingProfile(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ไม่พบผู้ใช้')

      const { error } = await supabase
        .from('users')
        .update({ birth_date: birthDate, gender, location })
        .eq('id', user.id)

      if (error) throw error
      toast.success('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว')
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (error.message || 'กรุณาลองใหม่'))
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) return

    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }

    if (newPassword.length < 6) {
      toast.error('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร')
      return
    }

    setLoadingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('เปลี่ยนรหัสผ่านสำเร็จแล้ว')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast.error('เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + error.message)
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0e1f] via-[#1e1738] to-[#0f0e1f] text-[#e5e5ff] relative overflow-x-hidden">
      {/* Subtle cosmic glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(167,139,250,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.12),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-indigo-200 hover:bg-violet-950/30">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-200 via-indigo-200 to-cyan-100">
            ตั้งค่าบัญชี
          </h1>
        </div>

        {/* Profile Info Card */}
        <Card className="bg-violet-950/18 backdrop-blur-2xl border border-violet-500/20 shadow-2xl shadow-violet-950/35 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-950/25 to-indigo-950/25 border-b border-violet-500/15 pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl text-[#f0f0ff]">
              <User className="w-6 h-6 text-violet-300" />
              ข้อมูลส่วนตัว
            </CardTitle>
            <CardDescription className="text-indigo-200/85 mt-2">
              ปรับแต่งข้อมูลเพื่อให้การตีความฝันแม่นยำและเป็นส่วนตัวยิ่งขึ้น
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 px-6 md:px-8">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label className="text-indigo-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-violet-400/80" />
                  อีเมล (แก้ไขไม่ได้)
                </Label>
                <Input
                  value={email}
                  disabled
                  className="bg-violet-950/25 border-violet-500/30 text-indigo-100 h-12 cursor-not-allowed shadow-inner"
                />
              </div>

              {/* Birthdate + Gender */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-indigo-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-300" />
                    วันเกิด
                  </Label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12 bg-violet-950/25 border-violet-500/30 text-[#f0f0ff] focus:border-violet-400 focus:ring-violet-400/20 shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-indigo-200 flex items-center gap-2">
                    <User className="w-4 h-4 text-violet-300" />
                    เพศสภาพ
                  </Label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="flex h-12 w-full rounded-md border border-violet-500/30 bg-violet-950/25 px-4 text-[#f0f0ff] focus:border-violet-400 focus:ring-violet-400/20 shadow-inner"
                  >
                    <option value="prefer_not_to_say">ไม่ระบุ</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                    <option value="lgbtq">LGBTQ+</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-indigo-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-violet-300" />
                  จังหวัด
                </Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="เช่น กรุงเทพมหานคร"
                  className="h-12 bg-violet-950/25 border-violet-500/30 text-[#f0f0ff] focus:border-violet-400 focus:ring-violet-400/20 shadow-inner"
                />
              </div>

              <Button
                type="submit"
                disabled={loadingProfile}
                className="w-full h-13 text-base md:text-lg font-semibold bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:brightness-110 hover:scale-[1.015] transition-all duration-400 shadow-xl shadow-violet-900/50 border border-violet-400/15 mt-4"
              >
                {loadingProfile ? (
                  <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    กำลังบันทึก...
                  </span>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    บันทึกข้อมูลส่วนตัว
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="bg-violet-950/18 backdrop-blur-2xl border border-violet-500/20 shadow-2xl shadow-violet-950/35 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-950/25 to-indigo-950/25 border-b border-violet-500/15 pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl text-[#f0f0ff]">
              <KeyRound className="w-6 h-6 text-violet-300" />
              เปลี่ยนรหัสผ่าน
            </CardTitle>
            <CardDescription className="text-indigo-200/85 mt-2">
              ใช้รหัสผ่านที่แข็งแรงเพื่อปกป้องโลกในฝันของคุณ
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 px-6 md:px-8">
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-indigo-200">รหัสผ่านใหม่</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="h-12 bg-violet-950/25 border-violet-500/30 text-[#f0f0ff] focus:border-violet-400 focus:ring-violet-400/20 shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-indigo-200">ยืนยันรหัสผ่านใหม่</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 bg-violet-950/25 border-violet-500/30 text-[#f0f0ff] focus:border-violet-400 focus:ring-violet-400/20 shadow-inner"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loadingPassword || !newPassword || newPassword !== confirmPassword}
                className="w-full h-13 text-base md:text-lg font-semibold bg-gradient-to-r from-rose-600 via-rose-700 to-rose-600 hover:brightness-110 hover:scale-[1.015] transition-all duration-400 shadow-xl shadow-rose-900/50 border border-rose-400/20 mt-4"
              >
                {loadingPassword ? (
                  <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    กำลังเปลี่ยน...
                  </span>
                ) : (
                  'ยืนยันเปลี่ยนรหัสผ่าน'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-indigo-300/70 pt-4">
          ข้อมูลทั้งหมดได้รับการปกป้องตาม PDPA • ใช้เพื่อประสบการณ์การตีความฝันที่ดีขึ้นเท่านั้น
        </p>
      </div>
    </div>
  )
}
