-- 删除旧的插入策略
DROP POLICY IF EXISTS "Admin can insert employee_contacts" ON public.employee_contacts;

-- 允许所有经过认证的用户插入（service role 默认有权限）
CREATE POLICY "Authenticated users can insert employee_contacts"
  ON public.employee_contacts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 用 service role 直接绕过 RLS 插入
-- 或者直接允许 anon 插入（临时用）
CREATE POLICY "Allow all insert employee_contacts"
  ON public.employee_contacts
  FOR INSERT
  WITH CHECK (true);
