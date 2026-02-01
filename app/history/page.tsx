'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Search, Calendar, Frown, Meh, Smile } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import Link from 'next/link'

export default function HistoryPage() {
  const [dreams, setDreams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  // ดึงข้อมูลเมื่อเข้าหน้าเว็บ
  const fetchHistory = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // ดึงข้อมูลพร้อมคำทำนาย (กรอง Soft Delete อัตโนมัติถ้าใช้ View หรือ Query ปกติ)
    const { data, error } = await supabase
      .from('dreams')
      .select(`
        id, dream_text, created_at, tags,
        interpretations ( analysis_text, lucky_numbers, happiness_score )
      `)
      .eq('user_id', user.id)
      .is('deleted_at', null) // ** สำคัญ: กรอง Soft Delete **
      .order('created_at', { ascending: false })

    if (error) toast.error('โหลดข้อมูลไม่สำเร็จ')
    else setDreams(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  // ฟังก์ชัน Soft Delete
  const handleDelete = async (id: string) => {
    if (!confirm('คุณต้องการลบความฝันนี้ใช่หรือไม่? (สามารถกู้คืนได้โดยผู้ดูแลระบบ)')) return

    // อัปเดต deleted_at แทนการลบจริง
    const { error } = await supabase
      .from('dreams')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error('ลบไม่สำเร็จ: ' + error.message)
    } else {
      toast.success('ลบรายการเรียบร้อย')
      fetchHistory() // โหลดข้อมูลใหม่
    }
  }

  const filteredDreams = dreams.filter(d => d.dream_text.includes(search))

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">📖 บันทึกความฝันของฉัน</h1>
          <Link href="/dashboard">
            <Button variant="outline">กลับหน้าหลัก</Button>
          </Link>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="ค้นหาประวัติความฝัน..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
           <p className="text-center text-slate-500">กำลังโหลดบันทึก...</p>
        ) : filteredDreams.length === 0 ? (
           <div className="text-center py-10 text-slate-400">
             <p>ยังไม่มีบันทึกความฝัน</p>
             <Link href="/dashboard"><Button className="mt-4">เริ่มทำนายฝันแรก</Button></Link>
           </div>
        ) : (
          <div className="space-y-4">
            {filteredDreams.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-slate-800 line-clamp-1">
                      {item.dream_text}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: th })}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                    {item.interpretations?.[0]?.analysis_text || "กำลังประมวลผล..."}
                  </p>
                  
                  {/* แสดง Tags และ Mood */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                     <div className="flex gap-2">
                        {item.tags?.map((tag: string, i: number) => (
                           <span key={i} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs">{tag}</span>
                        ))}
                     </div>
                     <div className="flex items-center gap-1 text-xs font-medium">
                        {/* แสดงไอคอนตาม Happiness Score */}
                        {item.interpretations?.[0]?.happiness_score >= 7 ? <Smile className="w-4 h-4 text-green-500"/> :
                         item.interpretations?.[0]?.happiness_score <= 3 ? <Frown className="w-4 h-4 text-red-500"/> :
                         <Meh className="w-4 h-4 text-yellow-500"/>}
                        <span className="text-slate-400">เลขมงคล: {item.interpretations?.[0]?.lucky_numbers?.number_text}</span>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}