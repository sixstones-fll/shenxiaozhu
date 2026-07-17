with open('src/features/knowledge/KnowledgeQAPanel.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('<div className="flex justify-start">', '<div className="flex items-start gap-2 justify-start">')
c = c.replace('if (json.type === "expert_match" && json.askFollowUp) {', 'if (json.askFollowUp) {')
c = c.replace('setLastExpertQuestion(q);\n          }\n        }\n      }', 'setLastExpertQuestion(q);\n            setLastQuestionType(json.type || "");\n          }\n        }\n      }')
with open('src/features/knowledge/KnowledgeQAPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('done')
