// expert-match API route - 委托到 lib
import { NextRequest, NextResponse } from "next/server";
import { matchExperts } from "@/lib/expert-match";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await matchExperts(body.question || "");
    return NextResponse.json(result);
  } catch (e) {
    console.error("[EX-API] error:", e);
    return NextResponse.json({ success: false, error: "服务暂不可用" }, { status: 500 });
  }
}
