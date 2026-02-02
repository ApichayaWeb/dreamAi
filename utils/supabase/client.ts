import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // สร้าง client สำหรับฝั่ง Browser (Client Component)
  // ข้อควรระวัง: ห้ามใส่ async หน้า function นี้เด็ดขาด และไม่ต้องใช้ cookies()
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
