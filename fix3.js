const fs = require('fs');
const p = 'D:/codex-project/shenxiaozu-demo/src/features/project-manage/ProjectManagePanel.tsx';
let c = fs.readFileSync(p, 'utf8');

// Replace setProjects(d.data.map -> const realProjects = d.data.map
c = c.replace(
  'setProjects(d.data.map((p) => ({',
  'const realProjects = d.data.map((p) => ({'
);

// Replace the closing }))); of the map call + the if block plus next line
// Original pattern:
//   })));
//         }
//       })
// Need to:
//   }));
//   setProjects([...realProjects, ...MOCK_PROJECTS]);
//         }
//       })

c = c.replace(
  '          })));\n        }\n      })',
  '          }));\n          setProjects([...realProjects, ...MOCK_PROJECTS]);\n        }\n      })'
);

// Remove the .finally loading if it exists
c = c.replace(
  '.finally(() => setLoading(false));\n  }, []);\n\n  let f = projects;',
  '  let f = projects;\n  }, []);'
);

fs.writeFileSync(p, c, 'utf8');
console.log('OK');
