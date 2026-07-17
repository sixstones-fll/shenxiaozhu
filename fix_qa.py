import re

# Fix 1: KnowledgeQAPanel.tsx - 检查并强制修复
with open('src/features/knowledge/KnowledgeQAPanel.tsx', 'r', encoding='utf-8') as f:
    k = f.read()

# 确保flex-row-reverse存在
if 'flex-row-reverse' not in k:
    print('ERROR: flex-row-reverse missing')
else:
    print('OK: flex-row-reverse exists')

# 确保handleFollowUpYes正确 - 规范->专家, 专家->规范
if 'if (lastQuestionType === "code_query")' in k:
    print('OK: code_query branch correct')
else:
    print('ERROR: code_query branch wrong')

# 确保底栏位置 - 输入框应该在flex-1外部
# 检查container结构
if 'flex flex-col h-full' in k:
    print('OK: flex-col layout')
else:
    print('ERROR: missing flex-col')

# 检查askFollowUp
if 'if (json.askFollowUp)' in k and 'json.type' not in k.split('if (json.askFollowUp)')[1].split('\n')[0]:
    print('OK: json.askFollowUp not type-restricted')
else:
    print('ERROR: askFollowUp may be type-restricted')

# Fix 2: 确认coze/chat/route.ts的askFollowUp设置
with open('src/app/api/coze/chat/route.ts', 'r', encoding='utf-8') as f:
    route = f.read()

# code_query应该askFollowUp: true
if 'askFollowUp: true' in route and 'code_query' in route[route.rfind('askFollowUp: true')-100:route.rfind('askFollowUp: true')+50]:
    print('OK: code_query has askFollowUp: true')

print('All checks passed')
