-- 规范知识库（册）表
CREATE TABLE IF NOT EXISTS code_regulations (
  id SERIAL PRIMARY KEY,
  code_number TEXT NOT NULL,
  code_name TEXT NOT NULL,
  applicable_major TEXT NOT NULL,
  applicable_building_type TEXT,
  status TEXT,
  remark TEXT
);

-- 历史问题库表
CREATE TABLE IF NOT EXISTS history_issues (
  id SERIAL PRIMARY KEY,
  major TEXT NOT NULL,
  issue_summary TEXT NOT NULL,
  building_type TEXT NOT NULL,
  issue_description TEXT,
  requirement TEXT
);

-- 启用 RLS
ALTER TABLE code_regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_issues ENABLE ROW LEVEL SECURITY;

-- 允许所有已登录用户读取
CREATE POLICY "允许所有用户读取规范知识库" ON code_regulations
  FOR SELECT USING (true);
CREATE POLICY "允许所有用户读取历史问题库" ON history_issues
  FOR SELECT USING (true);

-- 仅管理员可写入
CREATE POLICY "仅管理员写入规范知识库" ON code_regulations
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "仅管理员写入历史问题库" ON history_issues
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );