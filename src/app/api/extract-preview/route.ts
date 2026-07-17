import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { extractTextFromDocx, isDocxFile } from "@/lib/docx-parser";
import { extractProjectName } from "@/lib/deepseek";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "请上传文件" },
        { status: 400 }
      );
    }

    if (!isDocxFile(file.name)) {
      return NextResponse.json({
        success: true,
        data: { project_name: null },
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const text = await extractTextFromDocx(buffer);
    const projectName = await extractProjectName(text);

    return NextResponse.json({
      success: true,
      data: { project_name: projectName },
    });
  } catch (error: any) {
    console.error("预提取项目名失败", error);
    return NextResponse.json(
      { success: false, error: error.message || "解析失败" },
      { status: 500 }
    );
  }
}
