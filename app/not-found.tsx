import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CloudMoon } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-4 font-sans">
      <div className="bg-white p-8 rounded-full shadow-lg mb-6 animate-bounce">
        <CloudMoon className="w-16 h-16 text-indigo-600" />
      </div>
      <h1 className="text-4xl font-bold text-slate-900 mb-2">404 - หลงทางในความฝัน?</h1>
      <p className="text-slate-600 mb-8 max-w-md">
        ไม่พบหน้านี้ในระบบ ความจริงและความฝันอาจคลาดเคลื่อนกัน
      </p>
      <Link href="/"><Button className="bg-indigo-600 hover:bg-indigo-700">ตื่นจากฝัน (กลับหน้าหลัก)</Button></Link>
    </div>
  )
}