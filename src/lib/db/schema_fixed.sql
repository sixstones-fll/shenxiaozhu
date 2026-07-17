-- 审小助数据库 Schema
-- 执行方式：Supabase Dashboard -> SQL Editor -> New query -> Run

-- 1. 用户资料表
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. 项目表
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. 项目文件表
CREATE TABLE public.project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. 审图规划表
CREATE TABLE public.review_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  content JSONB,
  status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'generated', 'confirmed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. 审查要点项表
CREATE TABLE public.plan_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_plan_id UUID REFERENCES public.review_plans(id) ON DELETE CASCADE NOT NULL,
  category TEXT,
  item TEXT NOT NULL,
  priority TEXT,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. 规范查询记录表
CREATE TABLE public.code_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT,
  references JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. 专家匹配记录表
CREATE TABLE public.expert_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  experts JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. 知识库文件表（仅管理员）
CREATE TABLE public.knowledge_base_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  coze_file_id TEXT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'synced', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. 规范库（公开读取）
CREATE TABLE public.codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_number TEXT NOT NULL,
  code_name TEXT,
  article_number TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. 历史问题库（公开读取）
CREATE TABLE public.issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT,
  description TEXT,
  solution TEXT,
  expert_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- RLS 策略
-- profiles
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- projects
CREATE POLICY "Users can CRUD own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- project_files
CREATE POLICY "Users can CRUD own project files" ON public.project_files
  FOR ALL USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_files.project_id AND user_id = auth.uid()));

-- review_plans
CREATE POLICY "Users can CRUD own review plans" ON public.review_plans
  FOR ALL USING (EXISTS (SELECT 1 FROM public.projects WHERE id = review_plans.project_id AND user_id = auth.uid()));

-- plan_items
CREATE POLICY "Users can CRUD own plan items" ON public.plan_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.review_plans rp
    JOIN public.projects p ON rp.project_id = p.id
    WHERE rp.id = plan_items.review_plan_id AND p.user_id = auth.uid()
  ));

-- code_queries
CREATE POLICY "Users can CRUD own code queries" ON public.code_queries
  FOR ALL USING (auth.uid() = user_id);

-- expert_matches
CREATE POLICY "Users can CRUD own expert matches" ON public.expert_matches
  FOR ALL USING (auth.uid() = user_id);

-- knowledge_base_files
CREATE POLICY "Admins can manage knowledge base files" ON public.knowledge_base_files
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- codes
CREATE POLICY "Codes are public readable" ON public.codes
  FOR SELECT USING (true);

-- issues
CREATE POLICY "Issues are public readable" ON public.issues
  FOR SELECT USING (true);

-- 注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
