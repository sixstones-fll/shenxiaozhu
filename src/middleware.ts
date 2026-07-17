import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

 const { pathname } = request.nextUrl;

 // 公开路径 - 不需要登录
 const publicPaths = ["/login", "/register"];
 const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  const isApiPath = pathname.startsWith("/api");

 // 如果未登录，重定向到登录页
  if (!user && !isPublicPath && !isApiPath) {
   const url = request.nextUrl.clone();
   url.pathname = "/login";
   return NextResponse.redirect(url);
 }

 // 如果已登录，从登录/注册页重定向到仪表盘
 if (user && isPublicPath) {
   const url = request.nextUrl.clone();
   url.pathname = "/dashboard";
   return NextResponse.redirect(url);
 }

 // 根路径重定向
 if (pathname === "/") {
   const url = request.nextUrl.clone();
   url.pathname = user ? "/dashboard" : "/login";
   return NextResponse.redirect(url);
 }

 return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
