import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // ถ้ามี param "next" ให้ไปที่นั่น (ในที่นี้คือ /update-password) ถ้าไม่มีให้ไป Dashboard
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    
    // แลกเปลี่ยน Code เป็น Session (Log in ผู้ใช้ชั่วคราวเพื่ออนุญาตให้เปลี่ยนรหัส)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // ถ้า Error ให้กลับไปหน้า Login พร้อมแจ้งเตือน
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
