import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 使用 @supabase/ssr 的浏览器客户端，确保 cookie 和 middleware 一致
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
