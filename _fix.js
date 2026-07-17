const fs = require("fs");
const path = "D:\\codex-project\\shenxiaozu-demo\\src\\app\\(dashboard)\\projects\\page.tsx";
const old = fs.readFileSync(path, "utf8");
const newContent = old
  // Fix tab labels
  .replace(/"鐭ヨ瘑闂瓟"/g, '"知识问答"')
  .replace(/"瀹″浘瑙勫垝"/g, '"审图规划"')
  .replace(/"鎶ュ憡鐢熸垚"/g, '"报告生成"')
  .replace(/"鎶ュ憡瀵规瘮"/g, '"报告对比"')
  .replace(/"闂杩借釜"/g, '"问题追踪"')
  // Fix review panel
  .replace(/>瀹″浘瑙勫垝</g, ">审图规划<")
  .replace(/>椤圭洰 ID:/g, ">项目 ID:")
  // Fix KnowledgeQA display texts
  .replace(/>瑙勮寖璇︽儏</g, ">规范详情<")
  .replace(/>涓撳璇︽儏</g, ">专家详情<")
  .replace(/>鏆傛棤椤圭洰/g, ">暂无项目")
  .replace(/>鎮ㄨ繕娌℃湁鍒涘缓浠讳綍椤圭洰/g, ">您还没有创建任何项目")
  .replace(/>鍔犺浇涓?..</g, ">加载中...</")
  .replace(/>鏂板缓椤圭洰/g, ">新建项目")
  .replace(/>鎶ュ憡鐢熸垚/g, ">报告生成")
  .replace(/>鎶ュ憡瀵规瘮/g, ">报告对比")
  .replace(/>闂杩借釜/g, ">问题追踪")
  .replace(/>鍔熻兘寮€鍙戜腑\.\.\.</g, ">功能开发中...</")
  .replace(/>璇疯緭鍏ラ棶棰橈紝鑷姩璇嗗埆瑙勮寖鏌ヨ鎴栦笓瀹跺尮閰?\.\.</g, '>请输入问题，自动识别规范查询或专家匹配...<')
  .replace(/>闇€瑕?<|>闇€瑕侀棶/g, ">需要<")
  .replace(/>涓嶉渶瑕?<|>涓嶉渶瑕丮/g, ">不需要<")
  .replace(/>鏆傛棤缁撴瀯鍖栬鎯呮暟鎹?<|>鏆傛棤/g, ">暂无结构化详情数据<")
  // Fix create time display
  .replace(/鍒涘缓鏃堕棿/g, "创建时间")
  // Fix get project failed
  .replace(/鑾峰彇椤圭洰澶辫触/g, "获取项目失败")
  // Fix expert labels
  .replace(/>涓撳 /g, ">专家 ")
  .replace(/>椤圭洰锛/g, ">项目：")
  .replace(/>鐩稿叧闂锛/g, ">相关问题：")
  // Fix review button link
  .replace(/\`\/review\?projectId=\${projectId}\`/g, '`/review?projectId=${projectId}`')
;

fs.writeFileSync(path, newContent, "utf8");
console.log("Fixed. Checking first tabs line:");
const lines = fs.readFileSync(path, "utf8").split("\n");
for (const l of lines) {
  if (l.includes("label:")) console.log(l.trim());
}
