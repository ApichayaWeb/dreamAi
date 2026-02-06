'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { KeyRound, Lock, Eye, EyeOff } from 'lucide-react'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('รหัสผ่านยืนยันไม่ตรงกัน')
      return
    }

    if (password.length < 6) {
      toast.error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      return
    }

    setLoading(true)

    try {
      // ฟังก์ชัน updateUser ทำงานได้เพราะ User ถูก Logged in อัตโนมัติจากไฟล์ callback แล้ว
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast.success('เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสใหม่')
      
      // Logout เพื่อความปลอดภัย แล้วส่งกลับหน้า Login
      await supabase.auth.signOut()
      router.push('/login')
      
    } catch (error: any) {
      console.error(error)
      toast.error('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0e1f] via-[#1e1738] to-[#0f0e1f] text-[#e5e5ff] flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_70%)]" />
      </div>

      <Card className="w-full max-w-md bg-violet-950/12 backdrop-blur-2xl border border-violet-500/15 shadow-2xl shadow-violet-950/40 rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="text-center pb-6 border-b border-violet-500/10">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 rounded-full border border-violet-400/20 shadow-inner">
              <KeyRound className="w-10 h-10 text-violet-200" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-100 to-cyan-100">
            ตั้งรหัสผ่านใหม่
          </CardTitle>
          <CardDescription className="text-indigo-200/70">
            กรุณากำหนดรหัสผ่านใหม่ที่ปลอดภัยสำหรับบัญชีของคุณ
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8 px-8 pb-8">
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-300/70 transition-colors group-focus-within:text-violet-300" />
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="รหัสผ่านใหม่ (ขั้นต่ำ 6 ตัวอักษร)"
                  className="pl-12 pr-12 h-12 bg-violet-950/20 border-violet-500/30 text-[#f0f0ff] placeholder:text-indigo-300/50 focus:border-violet-400 focus:ring-violet-400/20 transition-all rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-300/50 hover:text-violet-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-300/70 transition-colors group-focus-within:text-violet-300" />
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  className="pl-12 h-12 bg-violet-950/20 border-violet-500/30 text-[#f0f0ff] placeholder:text-indigo-300/50 focus:border-violet-400 focus:ring-violet-400/20 transition-all rounded-xl"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-medium bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:brightness-110 hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-violet-900/40 rounded-xl border border-violet-400/20"
              disabled={loading}
            >
              {loading ? (
                 <span className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   กำลังบันทึก...
                 </span>
              ) : 'บันทึกรหัสผ่านใหม่'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
