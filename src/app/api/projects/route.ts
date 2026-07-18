import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { extractTextFromDocx, isDocxFile } from "@/lib/docx-parser";
import { extractProjectInfo } from "@/lib/deepseek";


export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const cookiesToSet: { name: string; value: string; options: any }[] = [];
    const headersToSet: Record<string, string> = {};

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookies, headers) {
            cookiesToSet.push(...cookies);
            Object.assign(headersToSet, headers);
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: projects, error } = await adminClient
      .from("projects")
      .select("id, name, project_info, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const response = NextResponse.json({ success: true, data: projects || [] });
    cookiesToSet.forEach(({ name, value, options }) => { response.cookies.set(name, value, options); });
    Object.entries(headersToSet).forEach(([key, value]) => { response.headers.set(key, value); });
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const cookiesToSet: { name: string; value: string; options: any }[] = [];
    const headersToSet: Record<string, string> = {};

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookies, headers) {
            cookiesToSet.push(...cookies);
            Object.assign(headersToSet, headers);
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const file = formData.get("file") as File | null;
    const existingProjectId = formData.get("project_id") as string | null;

    if (!name?.trim() && !existingProjectId) {
      return NextResponse.json({ success: false, error: "项目名称不能为空" }, { status: 400 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let projectId = existingProjectId;
    let rawProject: any = null;

    if (existingProjectId) {
      // 已有项目，先获取现有数据
      const { data: existing } = await adminClient
        .from("projects")
        .select("id, name, project_info")
        .eq("id", existingProjectId)
        .single();
      rawProject = existing;
    } else {
      const { data: newProject, error: projectError } = await adminClient
        .from("projects")
        .insert({ name: name.trim(), user_id: user.id, status: "active" })
        .select()
        .single();

      if (projectError || !newProject) {
        console.error("项目创建失败", projectError);
        return NextResponse.json(
          { success: false, error: projectError?.message || "创建项目失败" },
          { status: 500 }
        );
      }
      rawProject = newProject;
      projectId = (rawProject as any).id;
    }

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      await adminClient.from("project_files").insert({
        project_id: projectId,
        name: file.name,
        file_path: "pending",
        file_type: file.type,
      }).then(({ error }) => { if (error) console.error("保存文件元数据失败", error); });

      if (isDocxFile(file.name)) {
        try {
          console.log("开始 DeepSeek 提取...");
          const text = await extractTextFromDocx(buffer);
          console.log("文档文本长度:", text.length);
          const extracted = await extractProjectInfo(text);
          console.log("提取结果:", JSON.stringify(extracted).substring(0, 200));
          await adminClient.from("projects").update({
            project_info: extracted,
            updated_at: new Date().toISOString(),
          }).eq("id", projectId);
          (rawProject as any).project_info = extracted;
        } catch (extractionError) {
          console.error("DeepSeek 提取失败", extractionError);
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      data: {
        project_id: projectId,
        project_name: (rawProject as any)?.name,
        project_info: (rawProject as any)?.project_info || null,
      },
    });

    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    Object.entries(headersToSet).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}