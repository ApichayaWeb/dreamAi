'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { RefreshCw, Lock, ShieldCheck, User, Trash2, Edit, Save, Download, Search, Ban, FileText, Settings, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

const COLORS = ['#10B981', '#EF4444', '#F59E0B']; 

export default function AdminPage() {
  // --- Data States ---
  const [growthData, setGrowthData] = useState<any[]>([])
  const [sentimentData, setSentimentData] = useState<any[]>([])
  const [dreamsList, setDreamsList] = useState<any[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [logsList, setLogsList] = useState<any[]>([])
  const [settings, setSettings] = useState<any[]>([])
  const [summary, setSummary] = useState({ users: 0, dreams: 0 })
  const [topKeywords, setTopKeywords] = useState<any[]>([])
  
  // --- UI States ---
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // --- Edit Dialog State ---
  const [editingDream, setEditingDream] = useState<any>(null)
  const [newAnalysis, setNewAnalysis] = useState('')
  
  const supabase = createClient()
  const router = useRouter()

  // 1. ตรวจสอบสิทธิ์ Admin (Security Check)
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      
      // ดึง Role จากฐานข้อมูล (ปลอดภัยกว่าการเช็ค Email ในโค้ด)
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (error || userData?.role !== 'admin') {
        toast.error('สำหรับผู้ดูแลระบบเท่านั้น (Access Denied)')
        router.push('/dashboard')
        return
      }
      
      setIsAuthorized(true)
      fetchAllData()
    }
    checkAdmin()
  }, [router, supabase])

  // 2. ดึงข้อมูลทั้งหมด (Data Fetching)
  const fetchAllData = async () => {
    setLoading(true)
    try {
        // Analytics Views (ต้องสร้าง View ใน SQL ก่อน)
        const { data: daily } = await supabase.from('admin_daily_dreams').select('*')
        if (daily) setGrowthData(daily)
        
        const { data: sentiment } = await supabase.from('admin_sentiment_stats').select('*')
        if (sentiment) setSentimentData(sentiment)

        const { data: keywords } = await supabase.from('admin_top_tags').select('*')
        if (keywords) setTopKeywords(keywords)

        // Summary Counts
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
        const { count: dreamCount } = await supabase.from('dreams').select('*', { count: 'exact', head: true })
        setSummary({ users: userCount || 0, dreams: dreamCount || 0 })

        // Content List (Active Dreams only)
        const { data: dreams } = await supabase.from('dreams')
            .select('*, users(email), interpretations(*)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(50)
        if (dreams) setDreamsList(dreams)

        // User List
        const { data: users } = await supabase.from('users')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)
        if (users) setUsersList(users)

        // Audit Logs
        const { data: logs } = await supabase.from('audit_logs')
            .select('*, users(email)')
            .order('created_at', { ascending: false })
            .limit(50)
        if (logs) setLogsList(logs)

        // Settings
        const { data: config } = await supabase.from('system_settings').select('*').order('key')
        if (config) setSettings(config)

    } catch (e) {
        console.error(e)
        toast.error("โหลดข้อมูลไม่สำเร็จ (ตรวจสอบ RLS Policy)")
    } finally {
        setLoading(false)
    }
  }

  // --- Helper: บันทึก Log การกระทำของ Admin ---
  const logAdminAction = async (action: string, details: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        await supabase.from('audit_logs').insert({
            user_id: user.id,
            action: `ADMIN_${action}`,
            details: details
        })
    }
  }

  // --- Action Handlers ---

  const handleExportCSV = () => {
    if (growthData.length === 0) return toast.warning("ไม่มีข้อมูลให้ Export")
    const headers = ['Date', 'Dreams Count', 'Active Users']
    const rows = growthData.map(d => `${d.name},${d.dreams},${d.users}`)
    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `dreampsyche_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    logAdminAction('EXPORT_REPORT', { type: 'csv' })
  }

  const handleDeleteDream = async (id: string) => {
    if (!confirm('ยืนยันลบเนื้อหานี้? (Soft Delete)')) return
    await supabase.from('dreams').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    await logAdminAction('DELETE_DREAM', { dream_id: id })
    toast.success('ลบสำเร็จ')
    fetchAllData()
  }

  const handleEditClick = (dream: any) => {
    setEditingDream(dream)
    setNewAnalysis(dream.interpretations?.[0]?.analysis_text || '')
  }

  const handleSaveEdit = async () => {
    if (!editingDream || !editingDream.interpretations?.[0]) return
    const { error } = await supabase.from('interpretations')
        .update({ 
            analysis_text: newAnalysis, 
            researcher_note: `Edited by Admin on ${new Date().toLocaleDateString('th-TH')}` 
        })
        .eq('id', editingDream.interpretations[0].id)
    
    if (error) toast.error('บันทึกไม่สำเร็จ')
    else {
        await logAdminAction('EDIT_INTERPRETATION', { dream_id: editingDream.id })
        toast.success('แก้ไขเรียบร้อย')
        setEditingDream(null)
        fetchAllData()
    }
  }

  const toggleSetting = async (key: string, currentValue: boolean) => {
    await supabase.from('system_settings').update({ value: !currentValue }).eq('key', key)
    await logAdminAction('TOGGLE_SETTING', { key, new_value: !currentValue })
    fetchAllData()
  }

  const handleBanUser = async (userId: string, email: string) => {
    if (!confirm(`ยืนยันแบนผู้ใช้ ${email}?`)) return
    await supabase.from('users').update({ deleted_at: new Date().toISOString() }).eq('id', userId)
    await logAdminAction('BAN_USER', { target_user: email })
    toast.success('แบนผู้ใช้สำเร็จ')
    fetchAllData()
  }

  // --- Render ---

  if (!isAuthorized) return <div className="h-screen flex items-center justify-center"><Lock className="w-8 h-8 animate-pulse text-slate-400" /></div>

  // 🔥 Logic การกรองข้อมูล (Search)
  const filteredUsers = usersList.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredDreams = dreamsList.filter(d => 
    d.dream_text?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><ShieldCheck /> Admin Console</h1>
                <p className="text-slate-500 text-sm">ระบบควบคุมและวัดผลงานวิจัย (Thesis Admin)</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" onClick={fetchAllData} disabled={loading} className="bg-white">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
                <Button onClick={handleExportCSV} className="bg-indigo-600 hover:bg-indigo-700">
                    <Download className="w-4 h-4 mr-2" /> Export
                </Button>
            </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="bg-white border w-full justify-start overflow-x-auto p-1 h-auto">
                <TabsTrigger value="analytics" className="px-4 py-2"><Activity className="w-4 h-4 mr-2"/> Analytics</TabsTrigger>
                <TabsTrigger value="users" className="px-4 py-2"><User className="w-4 h-4 mr-2"/> Users</TabsTrigger>
                <TabsTrigger value="content" className="px-4 py-2"><FileText className="w-4 h-4 mr-2"/> Content</TabsTrigger>
                <TabsTrigger value="settings" className="px-4 py-2"><Settings className="w-4 h-4 mr-2"/> Settings</TabsTrigger>
            </TabsList>

            {/* 1. Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <Card><CardHeader><CardTitle>Total Dreams</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-indigo-600">{summary.dreams}</CardContent></Card>
                    <Card><CardHeader><CardTitle>Total Users</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-green-600">{summary.users}</CardContent></Card>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle>Activity (30 Days)</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={growthData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={12} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="dreams" fill="#6366f1" radius={[4, 4, 0, 0]} name="Dreams" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Sentiment Overview</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={sentimentData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {sentimentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="text-center text-xs text-slate-500 mt-2">Green: Positive, Red: Negative, Yellow: Neutral</div>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader><CardTitle>Word Cloud (Top Keywords)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {topKeywords.map((k, i) => (
                                <div key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm border">
                                    {k.word} <span className="text-xs text-indigo-600 font-bold">({k.count})</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* 2. Users Tab */}
            <TabsContent value="users" className="mt-4 space-y-4">
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500"/><Input placeholder="ค้นหาด้วยอีเมล..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {filteredUsers.map((u) => (
                                <div key={u.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>{u.email?.[0].toUpperCase()}</div>
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{u.email} {u.role === 'admin' && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Admin</span>}</p>
                                            <p className="text-xs text-slate-500">สมัครเมื่อ {format(new Date(u.created_at), 'dd MMM yyyy', { locale: th })} {u.deleted_at && <span className="text-red-500 font-bold">(Banned)</span>}</p>
                                        </div>
                                    </div>
                                    {u.role !== 'admin' && !u.deleted_at && (
                                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleBanUser(u.id, u.email)}><Ban className="w-4 h-4 mr-2"/> Ban</Button>
                                    )}
                                </div>
                            ))}
                            {filteredUsers.length === 0 && <p className="p-8 text-center text-slate-500">ไม่พบข้อมูลผู้ใช้</p>}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* 3. Content Tab */}
            <TabsContent value="content" className="mt-4 space-y-4">
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500"/><Input placeholder="ค้นหาเนื้อหาความฝัน หรือ อีเมล..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <div className="space-y-4">
                    {filteredDreams.map((d) => (
                        <Card key={d.id}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="w-full">
                                        <p className="font-bold text-slate-800 text-sm">"{d.dream_text}"</p>
                                        <div className="mt-2 p-3 bg-slate-50 rounded text-sm text-slate-600 border">
                                            <span className="font-semibold text-indigo-600">คำทำนาย: </span>
                                            {d.interpretations?.[0]?.analysis_text || <span className="text-slate-400 italic">กำลังประมวลผล...</span>}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-2 flex gap-2 items-center">
                                            <User className="w-3 h-3"/> {d.users?.email} 
                                            <span>• {format(new Date(d.created_at), 'dd/MM/yy HH:mm', { locale: th })}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <Button size="icon" variant="outline" onClick={() => handleEditClick(d)} title="แก้ไข"><Edit className="w-4 h-4" /></Button>
                                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteDream(d.id)} title="ลบ"><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredDreams.length === 0 && <p className="p-8 text-center text-slate-500">ไม่พบข้อมูลความฝัน</p>}
                </div>
            </TabsContent>

            {/* 4. Settings Tab */}
            <TabsContent value="settings" className="mt-4">
                <Card><CardContent className="p-4"><div className="space-y-4">{settings.map((s) => (
                    <div key={s.key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div><p className="font-medium text-sm">{s.description}</p><p className="text-xs text-slate-400 font-mono">{s.key}</p></div>
                        <Switch checked={s.value} onCheckedChange={() => toggleSetting(s.key, s.value)} />
                    </div>
                ))}</div></CardContent></Card>
                
                <Card className="mt-4"><CardHeader><CardTitle>Audit Logs</CardTitle></CardHeader><CardContent>
                    <div className="bg-slate-950 text-green-400 p-4 rounded-lg font-mono text-xs h-[300px] overflow-y-auto">
                        {logsList.map((log) => (
                            <div key={log.id} className="mb-1 border-b border-slate-800 pb-1 flex gap-2">
                                <span className="text-slate-500 w-16">{format(new Date(log.created_at), 'HH:mm')}</span>
                                <span className="text-blue-400 font-bold w-24 truncate">{log.action}</span>
                                <span className="text-slate-300 truncate flex-1">{log.users?.email} : {JSON.stringify(log.details)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent></Card>
            </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editingDream} onOpenChange={() => setEditingDream(null)}>
            <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>แก้ไขคำทำนาย (Manual Override)</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded border text-sm text-slate-600 italic">"{editingDream?.dream_text}"</div>
                    <Textarea value={newAnalysis} onChange={(e) => setNewAnalysis(e.target.value)} rows={8} placeholder="ใส่คำทำนายใหม่ที่นี่..." />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingDream(null)}>ยกเลิก</Button>
                    <Button onClick={handleSaveEdit} className="bg-indigo-600 hover:bg-indigo-700">บันทึก</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}