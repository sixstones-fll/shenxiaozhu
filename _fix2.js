const fs = require("fs");
const path = "D:\\codex-project\\shenxiaozu-demo\\src\\app\\(dashboard)\\projects\\page.tsx";
let content = fs.readFileSync(path, "utf8");

// Fix all garbled strings
const fixPairs = [
  // Tab labels (garbled -> correct)
  ["鐭ヨ瘑闂瓟", "知识问答"],
  ["瀹″浘瑙勫垝", "审图规划"],
  ["鎶ュ憡鐢熸垚", "报告生成"],
  ["鎶ュ憡瀵规瘮", "报告对比"],
  ["闂杩借釜", "问题追踪"],
  // Review panel
  ["椤圭洰", "项目"],
  ["鍒涘缓鏃堕棿", "创建时间"],
  ["鎶ュ憡", "报告"],
  ["瑙勮寖", "规范"],
  ["涓撲笟", "专业"],
  ["寤虹瓚涓撲笟", "建筑专业"],
  ["瑙勮寖娓呭崟", "规范清单"],
  ["瑙勮寖瑕佹眰锛", "规范要求："],
  ["鏌ョ湅", "查看"],
  ["鏌ョ湅鏇村", "查看更多"],
  ["鏇村锛堝叡", "更多（共"],
  ["鏉★級", "条）"],
  ["鏀惰捣", "收起"],
  ["璇疯緭鍏", "请输入"],
  ["闂锛", "问题："],
  ["鎴栵細", "或："],
  ["涓撳", "专家"],
  ["鍖归厤", "匹配"],
  ["鏂板缓", "新建"],
  ["鍔犺浇", "加载"],
  ["鏆傛棤", "暂无"],
  ["鍔熻兘寮€鍙戜腑", "功能开发中"],
  ["娌℃湁鍒涘缓", "没有创建"],
  ["浠讳綍椤圭洰锛", "任何项目，"],
  ["寮€濮?", "开始"],
  ["椤圭洰 ID:", "项目 ID:"],
  ["鑾峰彇椤圭洰澶辫触", "获取项目失败"],
  ["鏃堕棿锛歿project", "时间：{project"],
  ["杩介棶鎸夐挳锛氭槸鍚﹂渶", "追问查规范按钮示例"],
  ["闇€瑕侊紝璇峰府鎴戞煡鐩稿叧瑙勮寖", "需要，请帮我查相关规范"],
  ["鎴栵細鍦颁笅瀹ら槻姘磋璁￠棶棰樻壘鍝綅涓撳锛", "或：地下室防⽔设计问题找哪位专家？"],
  ["鎴栵細", "或："],
  // Fix verify button
  ["璇烽棶鏄惁", "请问是否"],
  ["紜鎻愪氦", "确认提交"],
  ["鐩稿叧瑙勮寖", "相关规范"],
  ["鏉′緥", "条例"],
  ["鏁版嵁", "数据"],
  ["涓嬭浇", "下载"],
  ["鍙栨秷", "取消"],
  ["纭畾", "确定"],
  ["淇濆瓨", "保存"],
  ["缂栬緫", "编辑"],
  ["鍒犻櫎", "删除"],
  ["鎿嶄綔", "操作"],
  ["瑕佹眰", "要求"],
  ["鏍囧噯", "标准"],
  ["鏂囦欢", "文件"],
  ["璁捐", "设计"],
  ["鏁呴殰", "故障"],
  ["瀹夊叏", "安全"],
  ["閫氱煡", "通知"],
  ["璁剧疆", "设置"],
  ["鏃堕棿", "时间"],
  ["鐘舵€?], "状态"],
  ["澶辫触", "失败"],
  ["鎴愬姛", "成功"],
  ["鍙栨秷", "取消"],
  // placeholder text fix
  ["鏌ヨ", "查询"],
  ["鑷姩璇嗗埆", "自动识别"],
  // Detail panel
  ["瑙勮寖璇︽儏", "规范详情"],
  ["涓撳璇︽儏", "专家详情"],
  ["鏆傛棤缁撴瀯鍖栬鎯呮暟鎹?", "暂无结构化详情数据"],
  ["椤圭洰锛歿expert", "项目：{expert"],
  ["鐩稿叧闂锛歿expert", "相关问题：{expert"],
  // Line 420 follow up
  ["闇€瑕侊紝", "需要，"],
  ["甯姪", "帮助"],
  ["鎴戞煡鐩稿叧", "我查相关"],
  // Expert match display
  ["涓撳鍖归厤", "专家匹配"],
  ["鎴栵細", "或："],
  ["鍦颁笅瀹ら槻냦", "地下室防"],
  ["姘磋璁?], "水设计"],
  ["闂鎵惧摢", "问题找哪"],
  ["浣嶄笓瀹讹紵", "位专家？"],
  // followup buttons
  ["闇€瑕?], "需要"],
  ["涓嶉渶瑕?], "不需要"],
  ["鏄惁闇€瑕佹煡", "是否需要查"],
];

let count = 0;
for (const [garbled, correct] of fixPairs) {
  const regex = new RegExp(garbled.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matched = content.match(regex);
  if (matched) {
    count += matched.length;
    content = content.replace(regex, correct);
  }
}

fs.writeFileSync(path, content, "utf8");
console.log(`Fixed ${count} garbled strings`);

// Verify
const verifyContent = fs.readFileSync(path, "utf8");
console.log("Has 知识问答:", verifyContent.includes("知识问答"));
console.log("Has 审图规划:", verifyContent.includes("审图规划"));

// Check for remaining garbled
const checkPattern = /[\uff00-\uffef]{2,}/g;
const remaining = verifyContent.match(checkPattern);
if (remaining) {
  console.log(`Remaining garbled: ${remaining.length}`);
  for (const r of remaining.slice(0, 5)) console.log("  -", r);
} else {
  console.log("No remaining garbled!");
}
