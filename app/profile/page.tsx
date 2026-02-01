'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, User, Save, Lock } from 'lucide-react'
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
      if (!user) throw new Error('No user found')

      const { error } = await supabase
        .from('users')
        .update({
          birth_date: birthDate,
          gender: gender,
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('บันทึกข้อมูลเรียบร้อยแล้ว AI จะนำไปปรับปรุงคำทำนายให้แม่นยำขึ้น')
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
            <Link href="/dashboard">
                <Button variant="ghost" className="mr-2"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">ตั้งค่าโปรไฟล์</h1>
        </div>

        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    ข้อมูลส่วนตัว
                </CardTitle>
                <CardDescription>
                    กรอกข้อมูลวันเกิดและเพศ เพื่อให้ AI วิเคราะห์ดวงชะตาและจิตวิทยาตามช่วงวัยได้ถูกต้อง
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="space-y-2">
                        <Label>อีเมล (แก้ไขไม่ได้)</Label>
                        <div className="flex items-center">
                            <Lock className="w-4 h-4 mr-2 text-slate-400" />
                            <Input value={email} disabled className="bg-slate-100 text-slate-500" />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="birthdate">วันเกิด</Label>
                            <Input 
                                id="birthdate" 
                                type="date" 
                                value={birthDate} 
                                onChange={(e) => setBirthDate(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">เพศสภาพ</Label>
                            <select 
                                id="gender"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                            >
                                <option value="male">ชาย</option>
                                <option value="female">หญิง</option>
                                <option value="lgbtq">LGBTQ+</option>
                                <option value="prefer_not_to_say">ไม่ระบุ</option>
                            </select>
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                        {loading ? 'กำลังบันทึก...' : <><Save className="w-4 h-4 mr-2" /> บันทึกการเปลี่ยนแปลง</>}
                    </Button>
                </form>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}