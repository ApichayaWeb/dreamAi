import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

if (typeof __dirname === 'undefined') {
  // @ts-ignore
  globalThis.__dirname = '';
}

export async function middleware(request: NextRequest) {
  try {
    // 1. เช็คก่อนเลยว่า Env มาไหม? (ดูใน Logs ของ Vercel)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("❌ MISSING ENV VARS IN MIDDLEWARE");
      console.error("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.error("KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Present" : "Missing");
      throw new Error("Missing Supabase Environment Variables");
    }

    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
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

    // 2. ลองเชื่อมต่อ User (ถ้า URL ผิด บรรทัดนี้จะพัง)
    await supabase.auth.getUser()

    return response

  } catch (error) {
    // 3. ถ้าพัง ให้ปริ้นท์ Error ออกมาดู
    console.error("❌ MIDDLEWARE ERROR:", error);
    
    // ส่งหน้าปกติไปก่อน เพื่อไม่ให้เว็บล่ม 500 (แต่ระบบ Login จะใช้ไม่ได้ชั่วคราว)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
