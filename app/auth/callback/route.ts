import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // ถ้ามี parameter "next" ให้ไปที่นั่น (เช่น /update-password) ถ้าไม่มีให้ไป /dashboard
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
    
    // แลกเปลี่ยน Code เป็น Session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // ✅ สำคัญ: Redirect ไปยังหน้าปลายทาง (ในที่นี้คือ /update-password)
      // โดย Session จะติดไปด้วยผ่าน Cookies ที่ set ไว้ข้างบน
      return NextResponse.redirect(`${origin}${next}`)
    } else {
        console.error('Auth Code Exchange Error:', error)
    }
  }

  // ถ้า Error ให้กลับไปหน้า Login พร้อมแจ้งเตือน
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
