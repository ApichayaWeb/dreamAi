'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, User, Save, Lock, Calendar, Users } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('prefer_not_to_say')

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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
      toast.success('บันทึกเรียบร้อยแล้ว! AI จะใช้ข้อมูลนี้เพื่อตีความฝันให้ลึกซึ้งยิ่งขึ้น')
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0e1f] via-[#1e1738] to-[#0f0e1f] text-[#e5e5ff] relative overflow-x-hidden">
      {/* Background subtle glow - ต่อเนื่องกับหน้า dashboard */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(167,139,250,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.12),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center mb-10">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="mr-4 hover:bg-violet-950/30 text-indigo-200">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-200 via-indigo-200 to-cyan-100 tracking-tight">
            ตั้งค่าโปรไฟล์
          </h1>
        </div>

        <Card className="bg-violet-950/18 backdrop-blur-2xl border border-violet-500/20 shadow-2xl shadow-violet-950/35 rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
          <CardHeader className="bg-gradient-to-r from-violet-950/25 to-indigo-950/25 pb-7 border-b border-violet-500/15">
            <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl text-[#f0f0ff]">
              <User className="h-7 w-7 text-violet-300" />
              ข้อมูลส่วนตัว
            </CardTitle>
            <CardDescription className="text-indigo-200/90 mt-3 text-base leading-relaxed">
              กรอกวันเกิดและเพศ เพื่อให้ DreamAI วิเคราะห์ฝันได้แม่นยำและลึกซึ้งยิ่งขึ้นตามจิตวิทยา ช่วงวัย และพลังงานส่วนบุคคล
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-10 px-6 md:px-8">
            <form onSubmit={handleUpdate} className="space-y-8">
              {/* อีเมล */}
              <div className="space-y-3">
                <Label className="text-indigo-200 font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-violet-400/80" />
                  อีเมล (ไม่สามารถแก้ไขได้)
                </Label>
                <Input
                  value={email}
                  disabled
                  className="bg-violet-950/25 border-violet-500/30 text-indigo-100 h-12 cursor-not-allowed placeholder:text-indigo-400/60 shadow-inner"
                />
              </div>

              {/* วันเกิด + เพศ */}
              <div className="grid md:grid-cols-2 gap-7">
                <div className="space-y-3">
                  <Label htmlFor="birthdate" className="text-indigo-200 font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-300" />
                    วันเกิด
                  </Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12 bg-violet-950/25 border-violet-500/30 text-[#f0f0ff] focus:border-violet-400 focus:ring-violet-400/20 focus:bg-violet-950/30 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="gender" className="text-indigo-200 font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-300" />
                    เพศสภาพ
                  </Label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="flex h-12 w-full rounded-md border border-violet-500/30 bg-violet-950/25 px-4 py-2 text-[#f0f0ff] focus:border-violet-400 focus:ring-violet-400/20 focus:outline-none transition-all shadow-inner"
                  >
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                    <option value="lgbtq">LGBTQ+</option>
                    <option value="prefer_not_to_say">ไม่ระบุ</option>
                  </select>
                </div>
              </div>

              {/* ปุ่มบันทึก */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-13 md:h-14 text-base md:text-lg font-semibold bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:brightness-110 hover:scale-[1.015] transition-all duration-400 shadow-xl shadow-violet-900/50 border border-violet-400/15 mt-6"
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    กำลังบันทึก...
                  </span>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    บันทึกการเปลี่ยนแปลง
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-center text-sm text-indigo-300/80 mt-10">
          ข้อมูลทั้งหมดได้รับการปกป้องตาม PDPA • ใช้เพื่อปรับปรุงการตีความฝันเท่านั้น • ไม่มีการเก็บหรือแชร์ข้อมูลส่วนบุคคล
        </p>
      </div>
    </div>
  )
}
