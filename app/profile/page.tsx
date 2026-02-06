'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, User, Save, Lock, Calendar, Users, KeyRound } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  
  // Profile State
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('prefer_not_to_say')

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
        .select('birth_date, gender')
        .eq('id', user.id)
        .single()

      if (data) {
        setBirthDate(data.birth_date || '')
        setGender(data.gender || 'prefer_not_to_say')
      }
    }
    getProfile()
  }, [router, supabase])

  // อัปเดตข้อมูลส่วนตัว
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingProfile(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ไม่พบผู้ใช้')

      const { error } = await supabase
        .from('users')
        .update({
          birth_date: birthDate,
          gender: gender,
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว')
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'))
    } finally {
      setLoadingProfile(false)
    }
  }

  // อัปเดตรหัสผ่าน
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) return

    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }

    if (newPassword.length < 6) {
      toast.error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      return
    }

    setLoadingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success('เปลี่ยนรหัสผ่านสำเร็จ!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast.error('เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + error.message)
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0e1f] via-[#1e1738] to-[#0f0e1f] text-[#e5e5ff] relative overflow-x-hidden pb-20">
      {/* Background subtle glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(167,139,250,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.12),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="mr-4 hover:bg-violet-950/30 text-indigo-200">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-200 via-indigo-200 to-cyan-100 tracking-tight">
            ตั้งค่าบัญชี
          </h1>
        </div>

        {/* 1. Profile Info Section */}
        <Card className="bg-violet-950/18 backdrop-blur-2xl border border-violet-500/20 shadow-2xl shadow-violet-950/35 rounded-3xl overflow-hidden mb-8">
          <CardHeader className="bg-gradient-to-r from-violet-950/25 to-indigo-950/25 pb-6 border-b border-violet-500/15">
            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-[#f0f0ff]">
              <User className="h-6 w-6 text-violet-300" />
              ข้อมูลส่วนตัว
            </CardTitle>
            <CardDescription className="text-indigo-200/80 mt-2">
              ข้อมูลนี้ใช้เพื่อช่วยให้ AI วิเคราะห์ฝันได้แม่นยำขึ้น
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 px-6 md:px-8">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* อีเมล */}
              <div className="space-y-2">
                <Label className="text-indigo-200 font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-violet-400/80" />
                  อีเมล (แก้ไขไม่ได้)
                </Label>
                <Input
                  value={email}
                  disabled
                  className="bg-violet-950/25 border-violet-500/30 text-indigo-100/70 h-11 cursor-not-allowed"
                />
              </div>

              {/* วันเกิด + เพศ */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="birthdate" className="text-indigo-200 font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-300" />
                    วันเกิด
                  </Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-11 bg-violet-950/25 border-violet-500/30 text-[#f0f0ff] focus:border-violet-400 focus:ring-violet-400/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-indigo-200 font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-300" />
                    เพศสภาพ
                  </Label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-violet-500/30 bg-violet-950/25 px-3 text-[#f0f0ff] focus:border-violet-400 focus:ring-violet-400/20 focus:outline-none transition-all"
                  >
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                    <option value="lgbtq">LGBTQ+</option>
                    <option value="prefer_not_to_say">ไม่ระบุ</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loadingProfile}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium h-11"
              >
                {loadingProfile ? 'กำลังบันทึก...' : <><Save className="h-4 w-4 mr-2" /> บันทึกข้อมูลส่วนตัว</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 2. Security Section (Change Password) */}
        <Card className="bg-violet-950/18 backdrop-blur-2xl border border-violet-500/20 shadow-2xl shadow-violet-950/35 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-950/25 to-indigo-950/25 pb-6 border-b border-violet-500/15">
            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-[#f0f0ff]">
              <KeyRound className="h-6 w-6 text-cyan-300" />
              ความปลอดภัย
            </CardTitle>
            <CardDescription className="text-indigo-200/80 mt-2">
              เปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชี
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 px-6 md:px-8">
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="newpass" className="text-indigo-200 font-medium">รหัสผ่านใหม่</Label>
                  <Input
                    id="newpass"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 bg-violet-950/25 border-violet-500/30 text-[#f0f0ff] focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all placeholder:text-indigo-400/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmpass" className="text-indigo-200 font-medium">ยืนยันรหัสผ่านใหม่</Label>
                  <Input
                    id="confirmpass"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 bg-violet-950/25 border-violet-500/30 text-[#f0f0ff] focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all placeholder:text-indigo-400/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loadingPassword || !newPassword}
                className="w-full bg-cyan-700/80 hover:bg-cyan-600/90 text-white font-medium h-11 border border-cyan-500/30"
              >
                {loadingPassword ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
