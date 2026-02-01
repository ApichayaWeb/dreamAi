'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => console.error(error), [error])
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans text-center">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-slate-800">เกิดข้อผิดพลาดในระบบ</h2>
      <p className="text-slate-600 mb-6">ระบบขัดข้องชั่วคราว ทีมงานกำลังตรวจสอบ</p>
      <Button onClick={() => reset()}>ลองใหม่อีกครั้ง</Button>
    </div>
  )
}