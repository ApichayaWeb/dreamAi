'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) toast.error(error.message)
    else { toast.success('เปลี่ยนรหัสสำเร็จ'); router.push('/login') }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md"><CardHeader><CardTitle>ตั้งรหัสผ่านใหม่</CardTitle></CardHeader><CardContent><form onSubmit={handleUpdate} className="space-y-4"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่านใหม่" required minLength={6}/><Button type="submit" className="w-full" disabled={loading}>บันทึก</Button></form></CardContent></Card>
    </div>
  )
}