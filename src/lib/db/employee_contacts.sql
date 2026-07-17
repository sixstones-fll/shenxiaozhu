-- 员工联系表
CREATE TABLE IF NOT EXISTS public.employee_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  specialty_sheet TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 开启 RLS
ALTER TABLE public.employee_contacts ENABLE ROW LEVEL SECURITY;

-- 允许所有登录用户读取
CREATE POLICY "Everyone can read employee_contacts"
  ON public.employee_contacts
  FOR SELECT
  USING (true);

-- 仅管理员可写入
CREATE POLICY "Admin can insert employee_contacts"
  ON public.employee_contacts
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
