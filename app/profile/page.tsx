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

  // อัปเดตข้อมูลส่วนตัว
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingProfile(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ไม่พบผู้ใช้')

      const { error } = await supabase
        .from('users')
        .update({ birth_date: birthDate, gender: gender, location: location })
        .eq('id', user.id)

      if (error) throw error
      toast.success('บันทึกข้อมูลส่วนตัวเรียบร้อย')
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message)
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
      const { error } = await supabase.auth.updateUser({ password: newPassword })
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
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center">
          <Link href="/dashboard">
            <Button variant="ghost" className="mr-2"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">ตั้งค่าบัญชี</h1>
        </div>

        {/* 1. Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-indigo-600" /> ข้อมูลส่วนตัว</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1"><Label>อีเมล</Label><Input value={email} disabled className="bg-slate-100" /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>วันเกิด</Label><Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></div>
                <div className="space-y-1"><Label>เพศ</Label><select className="flex h-10 w-full rounded-md border px-3 text-sm" value={gender} onChange={(e) => setGender(e.target.value)}><option value="prefer_not_to_say">ไม่ระบุ</option><option value="male">ชาย</option><option value="female">หญิง</option><option value="lgbtq">LGBTQ+</option></select></div>
              </div>
              <div className="space-y-1"><Label>จังหวัด</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
              <Button type="submit" disabled={loadingProfile} className="w-full bg-indigo-600">{loadingProfile ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</Button>
            </form>
          </CardContent>
        </Card>

        {/* 2. Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-orange-600" /> เปลี่ยนรหัสผ่าน</CardTitle>
            <CardDescription>หากต้องการเปลี่ยนรหัสผ่านใหม่ ให้กรอกด้านล่าง</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>รหัสผ่านใหม่</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                <div className="space-y-1"><Label>ยืนยันรหัสผ่านใหม่</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
              </div>
              <Button type="submit" disabled={loadingPassword || !newPassword} variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">{loadingPassword ? 'กำลังเปลี่ยน...' : 'ยืนยันเปลี่ยนรหัสผ่าน'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
