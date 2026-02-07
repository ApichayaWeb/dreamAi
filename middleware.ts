import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. สร้าง Response เตรียมไว้สำหรับจัดการ Cookie
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. สร้าง Supabase Client สำหรับ Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. ตรวจสอบ User จาก Session
  // (สำคัญ: ฟังก์ชันนี้จะ Refresh Token ให้ด้วยถ้ามันหมดอายุ)
  const { data: { user } } = await supabase.auth.getUser()

  // 4. กำหนดเส้นทาง
  const url = request.nextUrl.clone()
  const path = url.pathname

  // รายชื่อหน้าที่ "ไม่ต้องล็อกอิน" ก็เข้าได้ (Public Paths)
  const isPublicPath = 
    path === '/login' || 
    path === '/' || 
    path === '/auth/callback' ||
    path.startsWith('/api') || // อนุญาต API
    path.startsWith('/_next') || // ไฟล์ระบบ Next.js
    path.startsWith('/static') || // รูปภาพ
    path.includes('.') // ไฟล์ที่มีนามสกุล (css, js, ico, png)

  // 🔴 กรณีที่ 1: ถ้า "ไม่มี User" และพยายามเข้า "หน้าที่ต้องล็อกอิน" (Protected)
  if (!user && !isPublicPath) {
    // ดีดกลับไปหน้า Login ทันที
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 🟢 กรณีที่ 2: ถ้า "มี User แล้ว" แต่พยายามเข้าหน้า Login หรือหน้าแรก
  if (user && (path === '/login' || path === '/')) {
    // ดีดไป Dashboard เลย (ไม่ต้องล็อกอินซ้ำ)
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

// Config เพื่อบอกว่า Middleware นี้จะทำงานกับ URL ไหนบ้าง
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
