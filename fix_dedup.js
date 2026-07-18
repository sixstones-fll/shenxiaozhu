const fs = require('fs');
const p = 'D:/codex-project/shenxiaozu-demo/src/features/project-manage/ProjectManagePanel.tsx';
let c = fs.readFileSync(p, 'utf8');

// Replace the f = line with deduplicated version
c = c.replace(
  'let f = [...realProjects, ...projects];',
  'let f = [...new Map([...realProjects, ...projects].map(i => [i.id, i])).values()];'
);

fs.writeFileSync(p, c, 'utf8');
console.log('OK');
