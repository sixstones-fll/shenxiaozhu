const XLSX = require('xlsx');
const fs = require('fs');
const wb = XLSX.readFile('D:/codex-project/shenxiaozu-demo/data/审小助-员工联系表.xlsx');
let vals = [];
for (const sn of wb.SheetNames) {
  const ws = wb.Sheets[sn];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  rows.forEach(r => {
    const n = (r['员工'] || '').replace(/'/g, "''");
    const p = String(r['联系方式'] || '');
    const t = (r['职称'] || '').replace(/'/g, "''");
    vals.push("('" + n + "','" + p + "','" + t + "','" + sn + "')");
  });
}
const sql = 'INSERT INTO public.employee_contacts (name, phone, title, specialty_sheet) VALUES\n' + vals.join(',\n') + ';';
fs.writeFileSync('D:/codex-project/shenxiaozu-demo/data/insert_employee_contacts.sql', sql, 'utf8');
console.log('Done - wrote', vals.length, 'records');
