import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type") || "";
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (type === "regulations") {
      const { data, error } = await adminClient
        .from("code_regulations")
        .select("*")
        .limit(200);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data: data || [] });
    }

    if (type === "issues") {
      const { data, error } = await adminClient
        .from("history_issues")
        .select("*")
        .limit(200);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data: data || [] });
    }

    return NextResponse.json({ success: false, error: "unknown type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
