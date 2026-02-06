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

  const fetchHistory = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('dreams')
      .select(`
        id, dream_text, created_at, tags,
        interpretations ( analysis_text, lucky_numbers, happiness_score )
      `)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('ไม่สามารถโหลดประวัติได้')
    } else {
      setDreams(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบบันทึกความฝันนี้หรือไม่? (กู้คืนได้โดยผู้ดูแลระบบ)')) return

    const { error } = await supabase
      .from('dreams')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error('ลบไม่สำเร็จ')
    } else {
      toast.success('ลบเรียบร้อยแล้ว')
      fetchHistory()
    }
  }

  const filteredDreams = dreams.filter(d => 
    d.dream_text.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0e1f] via-[#1e1738] to-[#0f0e1f] text-[#e5e5ff] relative overflow-x-hidden">
      {/* Subtle cosmic glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(167,139,250,0.13),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(99,102,241,0.11),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 md:py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-200 via-indigo-200 to-cyan-100">
            บันทึกความฝันของฉัน
          </h1>
          <Link href="/dashboard">
            <Button variant="outline" className="border-violet-500/30 text-indigo-200 hover:bg-violet-950/30 hover:text-white">
              กลับไปทำนายฝัน
            </Button>
          </Link>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300/70" />
          <Input
            placeholder="ค้นหาความฝัน... (เช่น ทะเลสีม่วง, บินได้)"
            className="pl-12 bg-violet-950/20 border-violet-500/25 text-[#f0f0ff] placeholder:text-indigo-300/60 focus:border-violet-400 focus:ring-violet-400/20 h-12 shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-indigo-300/80">
            กำลังเชื่อมต่อสู่คลังความฝัน...
          </div>
        ) : filteredDreams.length === 0 ? (
          <div className="text-center py-16 text-indigo-300/70">
            <p className="text-lg mb-6">ยังไม่มีบันทึกความฝันในภวังค์ของคุณ</p>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 hover:scale-105 shadow-violet-900/40">
                เริ่มบันทึกฝันแรก
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5 md:space-y-6">
            {filteredDreams.map((item) => (
              <Card 
                key={item.id} 
                className="bg-violet-950/18 backdrop-blur-xl border border-violet-500/20 shadow-xl shadow-violet-950/30 rounded-2xl overflow-hidden hover:border-violet-400/40 transition-all duration-300 group"
              >
                <CardHeader className="pb-3 border-b border-violet-500/10">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-lg md:text-xl text-violet-100 line-clamp-2 leading-tight">
                        {item.dream_text}
                      </CardTitle>
                      <div className="flex items-center gap-2.5 text-xs text-indigo-300/90">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(item.created_at), 'd MMM yyyy • HH:mm', { locale: th })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-5 text-indigo-100/95 text-sm md:text-base leading-relaxed">
                  <p className="line-clamp-3 mb-5 opacity-90">
                    {item.interpretations?.[0]?.analysis_text || "กำลังตีความอยู่ในภวังค์..."}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-violet-500/10">
                    <div className="flex flex-wrap gap-2">
                      {item.tags?.map((tag: string, i: number) => (
                        <span 
                          key={i} 
                          className="bg-violet-950/40 text-violet-200 px-2.5 py-1 rounded-md text-xs border border-violet-500/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      {/* Mood icon */}
                      {item.interpretations?.[0]?.happiness_score >= 7 ? (
                        <Smile className="w-5 h-5 text-emerald-400" />
                      ) : item.interpretations?.[0]?.happiness_score <= 3 ? (
                        <Frown className="w-5 h-5 text-rose-400" />
                      ) : (
                        <Meh className="w-5 h-5 text-amber-400" />
                      )}

                      {/* Lucky numbers */}
                      {item.interpretations?.[0]?.lucky_numbers?.number_text && (
  <span className="text-amber-200/90 font-medium">
    เลขนำโชค: {item.interpretations[0].lucky_numbers.number_text}
  </span>
)}
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
