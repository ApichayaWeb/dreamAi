'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { RefreshCw, Lock, ShieldCheck, User, Trash2, Edit, Save, Download, Search, Ban, FileText, Settings, Activity, Star, Undo2, Filter, LogOut, ShieldAlert, Shield } from 'lucide-react'
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
  const [growthData, setGrowthData] = useState<any[]>([])
  const [sentimentData, setSentimentData] = useState<any[]>([])
  const [dreamsList, setDreamsList] = useState<any[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [logsList, setLogsList] = useState<any[]>([])
  const [settings, setSettings] = useState<any[]>([])
  const [summary, setSummary] = useState({ users: 0, dreams: 0 })
  const [topKeywords, setTopKeywords] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState('') // เก็บอีเมลตัวเองกันกดลบสิทธิ์ตัวเอง
  
  const [editingDream, setEditingDream] = useState<any>(null)
  const [newAnalysis, setNewAnalysis] = useState('')
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      
      setCurrentUserEmail(user.email || '')

      const { data: userData, error } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (error || userData?.role !== 'admin') {
        toast.error('สำหรับผู้ดูแลระบบเท่านั้น')
        router.push('/dashboard')
        return
      }
      setIsAuthorized(true)
      fetchAllData()
    }
    checkAdmin()
  }, [router, supabase, showDeleted])

  const fetchAllData = async () => {
    setLoading(true)
    try {
        const { data: daily } = await supabase.from('admin_daily_dreams').select('*')
        if (daily && !('error' in daily)) setGrowthData(daily)
        
        const { data: sentiment } = await supabase.from('admin_sentiment_stats').select('*')
        if (sentiment && !('error' in sentiment)) setSentimentData(sentiment)

        const { data: keywords } = await supabase.from('admin_top_tags').select('*')
        if (keywords && !('error' in keywords)) setTopKeywords(keywords)

        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
        const { count: dreamCount } = await supabase.from('dreams').select('*', { count: 'exact', head: true })
        setSummary({ users: userCount || 0, dreams: dreamCount || 0 })

        let dreamQuery = supabase.from('dreams')
            .select('*, users(email), interpretations(*)')
            .order('created_at', { ascending: false })
            .limit(50)
        
        if (!showDeleted) {
            dreamQuery = dreamQuery.is('deleted_at', null)
        }
        const { data: dreams } = await dreamQuery
        if (dreams) setDreamsList(dreams)

        const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(50)
        if (users) setUsersList(users)

        const { data: logs } = await supabase.from('audit_logs').select('*, users(email)').order('created_at', { ascending: false }).limit(50)
        if (logs) setLogsList(logs)

        const { data: config } = await supabase.from('system_settings').select('*').order('key')
        if (config) setSettings(config)

    } catch (e) {
        console.error("Fetch error:", e)
    } finally {
        setLoading(false)
    }
  }

  const logAdminAction = async (action: string, details: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        await supabase.from('audit_logs').insert({
            user_id: user.id, action: `ADMIN_${action}`, details: details
        })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleExportCSV = () => {
    if (growthData.length === 0) return toast.warning("ไม่มีข้อมูลให้ Export")
    const headers = ['Date', 'Dreams Count', 'Active Users']
    const rows = growthData.map(d => `${d.name},${d.dreams},${d.users}`)
    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `report.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    logAdminAction('EXPORT_REPORT', { type: 'csv' })
  }

  const handleDeleteDream = async (id: string, isRestore: boolean = false) => {
    const action = isRestore ? 'กู้คืน' : 'ลบ'
    if (!confirm(`ยืนยัน${action}เนื้อหานี้?`)) return
    
    const newVal = isRestore ? null : new Date().toISOString()
    await supabase.from('dreams').update({ deleted_at: newVal }).eq('id', id)
    
    await logAdminAction(isRestore ? 'RESTORE_DREAM' : 'DELETE_DREAM', { dream_id: id })
    toast.success(`${action}สำเร็จ`)
    fetchAllData()
  }

  const handleEditClick = (dream: any) => {
    setEditingDream(dream)
    setNewAnalysis(dream.interpretations?.[0]?.analysis_text || '')
  }

  const handleSaveEdit = async () => {
    if (!editingDream || !editingDream.interpretations?.[0]) return
    const { error } = await supabase.from('interpretations')
        .update({ analysis_text: newAnalysis, researcher_note: `Edited by Admin` })
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

  // ✅ ฟังก์ชันแบน User
  const handleBanUser = async (userId: string, email: string, isUnban: boolean = false) => {
    const action = isUnban ? 'ปลดแบน' : 'แบน'
    if (!confirm(`ยืนยัน${action}ผู้ใช้ ${email}?`)) return
    
    const newVal = isUnban ? null : new Date().toISOString()
    await supabase.from('users').update({ deleted_at: newVal }).eq('id', userId)
    
    await logAdminAction(isUnban ? 'UNBAN_USER' : 'BAN_USER', { target_user: email })
    toast.success(`${action}สำเร็จ`)
    fetchAllData()
  }

  // ✅ ฟังก์ชันเปลี่ยน Role (มอบสิทธิ์)
  const handleToggleRole = async (userId: string, currentRole: string, email: string) => {
      const newRole = currentRole === 'admin' ? 'user' : 'admin'
      if (!confirm(`ยืนยันการเปลี่ยนสิทธิ์ของ ${email} เป็น ${newRole.toUpperCase()}?`)) return
      
      const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId)
      
      if (error) toast.error('เปลี่ยนสิทธิ์ไม่สำเร็จ: ' + error.message)
      else {
          toast.success(`เปลี่ยนสิทธิ์ ${email} เป็น ${newRole} เรียบร้อย`)
          await logAdminAction('CHANGE_ROLE', { target: email, new_role: newRole })
          fetchAllData()
      }
  }

  if (!isAuthorized) return <div className="h-screen flex items-center justify-center"><Lock className="w-8 h-8 animate-pulse text-slate-400" /></div>

  const filteredUsers = usersList.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.role?.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredDreams = dreamsList.filter(d => d.dream_text?.toLowerCase().includes(searchTerm.toLowerCase()) || d.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ShieldCheck className="text-indigo-600"/> Admin Console</h1>
                <p className="text-slate-500 text-xs">ระบบควบคุมและวัดผลงานวิจัย</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Button variant="outline" onClick={fetchAllData} disabled={loading} className="bg-white">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
                <Button onClick={handleExportCSV} className="bg-indigo-600 hover:bg-indigo-700"><Download className="w-4 h-4 mr-2" /> Export</Button>
                <Button variant="destructive" size="icon" onClick={handleLogout} title="ออกจากระบบ">
                    <LogOut className="w-4 h-4" />
                </Button>
            </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
            <TabsList className="bg-white border w-full justify-start overflow-x-auto p-1 h-auto rounded-xl">
                <TabsTrigger value="analytics" className="px-4 py-2"><Activity className="w-4 h-4 mr-2"/> Analytics</TabsTrigger>
                <TabsTrigger value="users" className="px-4 py-2"><User className="w-4 h-4 mr-2"/> Users & Roles</TabsTrigger>
                <TabsTrigger value="content" className="px-4 py-2"><FileText className="w-4 h-4 mr-2"/> Content</TabsTrigger>
                <TabsTrigger value="settings" className="px-4 py-2"><Settings className="w-4 h-4 mr-2"/> Settings</TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <Card><CardHeader><CardTitle>Total Dreams</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-indigo-600">{summary.dreams}</CardContent></Card>
                    <Card><CardHeader><CardTitle>Total Users</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-green-600">{summary.users}</CardContent></Card>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Card><CardHeader><CardTitle>Activity (30 Days)</CardTitle></CardHeader><CardContent className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={growthData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} /><YAxis fontSize={12} axisLine={false} tickLine={false} /><Tooltip cursor={{fill: 'transparent'}} /><Bar dataKey="dreams" fill="#6366f1" radius={[4, 4, 0, 0]} name="Dreams" /></BarChart></ResponsiveContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Sentiment Overview</CardTitle></CardHeader><CardContent className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sentimentData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{sentimentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>
                </div>
                <Card><CardHeader><CardTitle>Word Cloud (Top Keywords)</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{topKeywords.map((k, i) => (<div key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm border">{k.word} <span className="text-xs text-indigo-600 font-bold">({k.count})</span></div>))}</div></CardContent></Card>
            </TabsContent>

            {/* Users Tab (Updated with Role Management) */}
            <TabsContent value="users" className="mt-4 space-y-4">
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500"/><Input placeholder="ค้นหาด้วยอีเมล..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <Card><CardContent className="p-0"><div className="divide-y">{filteredUsers.map((u) => (
                    <div key={u.id} className={`flex items-center justify-between p-4 hover:bg-slate-50 ${u.deleted_at ? 'bg-red-50' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>{u.email?.[0].toUpperCase()}</div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-slate-800 text-sm">{u.email}</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                        {u.role === 'admin' ? '👑 ADMIN' : '👤 USER'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{u.location || 'Unknown Location'} • สมัครเมื่อ {format(new Date(u.created_at), 'dd MMM yyyy', { locale: th })} {u.deleted_at && <span className="text-red-600 font-bold ml-1">● Banned</span>}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* ปุ่มเปลี่ยน Role (ห้ามแก้ตัวเอง) */}
                            {u.email !== currentUserEmail && !u.deleted_at && (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                    onClick={() => handleToggleRole(u.id, u.role, u.email)}
                                >
                                    {u.role === 'admin' ? '⬇️ ลดสิทธิ์' : '⬆️ ตั้งเป็น Admin'}
                                </Button>
                            )}

                            {/* ปุ่มแบน (ห้ามแบน Admin หรือตัวเอง) */}
                            {u.role !== 'admin' && u.email !== currentUserEmail && (
                                u.deleted_at ? 
                                <Button size="sm" variant="outline" className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleBanUser(u.id, u.email, true)}><Undo2 className="w-3 h-3 mr-1"/> Unban</Button> :
                                <Button size="sm" variant="ghost" className="h-8 text-xs text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => handleBanUser(u.id, u.email, false)}><Ban className="w-3 h-3 mr-1"/> Ban</Button>
                            )}
                        </div>
                    </div>
                ))}</div></CardContent></Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="mt-4 space-y-4">
                <div className="flex gap-2">
                    <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500"/><Input placeholder="ค้นหาเนื้อหาความฝัน..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                    <Button variant="outline" onClick={() => setShowDeleted(!showDeleted)} className={showDeleted ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white'}><Filter className="w-4 h-4 mr-2" /> {showDeleted ? 'ซ่อนรายการที่ลบ' : 'แสดงรายการที่ลบ'}</Button>
                </div>
                <div className="space-y-4">{filteredDreams.map((d) => (
                    <Card key={d.id} className={d.deleted_at ? 'opacity-70 border-red-200' : ''}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-4">
                                <div className="w-full">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-800 text-sm">ฝัน: "{d.dream_text}"</span>
                                        {d.deleted_at && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Deleted</span>}
                                    </div>
                                    <div className="mt-2 p-3 bg-slate-50 rounded text-sm text-slate-600 border flex justify-between items-start">
                                        <div><span className="font-semibold text-indigo-600">คำทำนาย: </span>{d.interpretations?.[0]?.analysis_text || '...'}</div>
                                        {d.interpretations?.[0]?.user_rating > 0 && (<div className="flex items-center gap-1 text-yellow-500 bg-white px-2 py-1 rounded border shadow-sm ml-2 shrink-0"><Star className="w-3 h-3 fill-current" /><span className="text-xs font-bold">{d.interpretations[0].user_rating}</span></div>)}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-2 flex gap-2 items-center"><User className="w-3 h-3"/> {d.users?.email} <span>• {format(new Date(d.created_at), 'dd/MM/yy HH:mm', { locale: th })}</span></div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    {!d.deleted_at && <Button size="icon" variant="outline" onClick={() => handleEditClick(d)}><Edit className="w-4 h-4" /></Button>}
                                    {d.deleted_at ? (<Button size="icon" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => handleDeleteDream(d.id, true)} title="กู้คืน"><Undo2 className="w-4 h-4" /></Button>) : (<Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDeleteDream(d.id, false)} title="ลบ"><Trash2 className="w-4 h-4" /></Button>)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}</div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-4">
                <Card><CardContent className="p-4"><div className="space-y-4">{settings.map((s) => (
                    <div key={s.key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div><p className="font-medium text-sm">{s.description}</p></div>
                        <Switch checked={s.value} onCheckedChange={() => toggleSetting(s.key, s.value)} />
                    </div>
                ))}</div></CardContent></Card>
                <Card className="mt-4"><CardHeader><CardTitle>Audit Logs</CardTitle></CardHeader><CardContent>
                    <div className="bg-slate-950 text-green-400 p-4 rounded-lg font-mono text-xs h-[300px] overflow-y-auto">
                        {logsList.map((log) => (<div key={log.id} className="mb-1 border-b border-slate-800 pb-1 flex gap-2"><span className="text-slate-500 w-16">{format(new Date(log.created_at), 'HH:mm')}</span><span className="text-blue-400 font-bold w-24 truncate">{log.action}</span><span className="text-slate-300 truncate flex-1">{log.users?.email} : {JSON.stringify(log.details)}</span></div>))}
                    </div>
                </CardContent></Card>
            </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editingDream} onOpenChange={() => setEditingDream(null)}>
            <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>แก้ไขคำทำนาย</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded border text-sm text-slate-600 italic">"{editingDream?.dream_text}"</div>
                    <Textarea value={newAnalysis} onChange={(e) => setNewAnalysis(e.target.value)} rows={8} />
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setEditingDream(null)}>ยกเลิก</Button><Button onClick={handleSaveEdit} className="bg-indigo-600">บันทึก</Button></DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
