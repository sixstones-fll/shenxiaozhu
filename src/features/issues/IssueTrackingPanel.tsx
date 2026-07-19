"use client";
import { useState, useEffect } from "react";
import { RotateCw, CheckCircle2, AlertCircle, AlertTriangle, Users, Phone, FileText, X } from "lucide-react";

interface CompareDetail {
  id: string;
  description: string;
  drawingNo: string;
  drawingName: string;
  violation: string;
  severity: string;
  status: string;
}

interface CompareResult {
  summary: { resolved: number; new: number; pending: number };
  conclusion: string;
  details: CompareDetail[];
  raw?: string;
}

interface FakeIssue {
  description: string;
  reportName: string;
}

const CARD_LABELS: Record<string, string> = {
  total: "总问题数",
  resolved: "已整改",
  unresolved: "未整改",
  severity_1: "一类强条",
  severity_2: "二类强条",
  severity_3: "普通问题",
  "建筑": "建筑专业",
  "结构": "结构专业",
  "水": "给排水专业",
  "暖": "暖通专业",
  "电": "电气专业",
};

const FAKE_ISSUES: Record<string, FakeIssue[]> = {
  total: [
    { description: "教学楼楼梯间未设置封闭楼梯间，不满足《建筑设计防火规范》要求", reportName: "2026年3月第2版" },
    { description: "消防电梯前室尺寸小于规范最小值，影响消防救援操作", reportName: "2026年3月第2版" },
    { description: "疏散走道净宽度仅为1.1m，不满足1.4m的消防疏散要求", reportName: "2026年3月第2版" },
    { description: "建筑防火分区面积超过规范限值，未设置防火墙分隔", reportName: "2026年3月第2版" },
    { description: "无障碍坡道坡度为1:10，大于规范要求的1:12", reportName: "2026年5月第1版" },
    { description: "地下室人防门框墙与结构柱位置冲突，影响门扇开启", reportName: "2026年5月第1版" },
    { description: "屋面防水等级选用III级，不满足该建筑功能要求的II级", reportName: "2026年4月第3版" },
    { description: "框架柱截面尺寸500x500mm，轴压比超出规范限值0.85", reportName: "2026年5月第1版" },
    { description: "基础埋深仅1.5m，未达到持力层要求的2.8m深度", reportName: "2026年3月第2版" },
    { description: "梁底筋配筋率2.8%，超过规范最大配筋率2.5%", reportName: "2026年4月第3版" },
    { description: "悬挑长度3.2m的混凝土梁未进行抗倾覆验算", reportName: "2026年5月第1版" },
    { description: "幕墙预埋件间距超出规范允许范围", reportName: "2026年3月第2版" },
    { description: "给水立管管材选用PVC-U，与设计要求的钢塑复合管不符", reportName: "2026年4月第3版" },
    { description: "排水横管坡度0.3%，不满足自清流速所需的最小坡度0.5%", reportName: "2026年5月第1版" },
    { description: "应急照明配电箱未设置在配电间内，不满足防火要求", reportName: "2026年4月第3版" },
  ],
  resolved: [
    { description: "消防电梯前室尺寸小于规范最小值，影响消防救援操作", reportName: "2026年3月第2版" },
    { description: "屋面防水等级选用III级，不满足该建筑功能要求的II级", reportName: "2026年4月第3版" },
    { description: "基础埋深仅1.5m，未达到持力层要求的2.8m深度", reportName: "2026年3月第2版" },
    { description: "给水立管管材选用PVC-U，与设计要求的钢塑复合管不符", reportName: "2026年4月第3版" },
  ],
  unresolved: [
    { description: "教学楼楼梯间未设置封闭楼梯间，不满足《建筑设计防火规范》要求", reportName: "2026年3月第2版" },
    { description: "疏散走道净宽度仅为1.1m，不满足1.4m的消防疏散要求", reportName: "2026年3月第2版" },
    { description: "建筑防火分区面积超过规范限值，未设置防火墙分隔", reportName: "2026年3月第2版" },
    { description: "无障碍坡道坡度为1:10，大于规范要求的1:12", reportName: "2026年5月第1版" },
    { description: "地下室人防门框墙与结构柱位置冲突，影响门扇开启", reportName: "2026年5月第1版" },
    { description: "框架柱截面尺寸500x500mm，轴压比超出规范限值0.85", reportName: "2026年5月第1版" },
    { description: "梁底筋配筋率2.8%，超过规范最大配筋率2.5%", reportName: "2026年4月第3版" },
    { description: "悬挑长度3.2m的混凝土梁未进行抗倾覆验算", reportName: "2026年5月第1版" },
    { description: "幕墙预埋件间距超出规范允许范围", reportName: "2026年3月第2版" },
    { description: "排水横管坡度0.3%，不满足自清流速所需的最小坡度0.5%", reportName: "2026年5月第1版" },
    { description: "应急照明配电箱未设置在配电间内，不满足防火要求", reportName: "2026年4月第3版" },
  ],
  severity_1: [
    { description: "教学楼楼梯间未设置封闭楼梯间，不满足《建筑设计防火规范》要求", reportName: "2026年3月第2版" },
    { description: "建筑防火分区面积超过规范限值，未设置防火墙分隔", reportName: "2026年3月第2版" },
    { description: "框架柱截面尺寸500x500mm，轴压比超出规范限值0.85", reportName: "2026年5月第1版" },
    { description: "梁底筋配筋率2.8%，超过规范最大配筋率2.5%", reportName: "2026年4月第3版" },
  ],
  severity_2: [
    { description: "消防电梯前室尺寸小于规范最小值，影响消防救援操作", reportName: "2026年3月第2版" },
    { description: "无障碍坡道坡度为1:10，大于规范要求的1:12", reportName: "2026年5月第1版" },
    { description: "基础埋深仅1.5m，未达到持力层要求的2.8m深度", reportName: "2026年3月第2版" },
    { description: "幕墙预埋件间距超出规范允许范围", reportName: "2026年3月第2版" },
    { description: "悬挑长度3.2m的混凝土梁未进行抗倾覆验算", reportName: "2026年5月第1版" },
  ],
  severity_3: [
    { description: "疏散走道净宽度仅为1.1m，不满足1.4m的消防疏散要求", reportName: "2026年3月第2版" },
    { description: "地下室人防门框墙与结构柱位置冲突，影响门扇开启", reportName: "2026年5月第1版" },
    { description: "屋面防水等级选用III级，不满足该建筑功能要求的II级", reportName: "2026年4月第3版" },
    { description: "给水立管管材选用PVC-U，与设计要求的钢塑复合管不符", reportName: "2026年4月第3版" },
    { description: "排水横管坡度0.3%，不满足自清流速所需的最小坡度0.5%", reportName: "2026年5月第1版" },
    { description: "应急照明配电箱未设置在配电间内，不满足防火要求", reportName: "2026年4月第3版" },
  ],
  "建筑": [
    {"description":"教学楼楼梯间未设置封闭楼梯间，不满足《建筑设计防火规范》要求","reportName":"2026年3月第2版"},
    {"description":"消防电梯前室尺寸小于规范最小值，影响消防救援操作","reportName":"2026年3月第2版"},
    {"description":"疏散走道净宽度仅为1.1m，不满足1.4m的消防疏散要求","reportName":"2026年3月第2版"},
    {"description":"建筑防火分区面积超过规范限值，未设置防火墙分隔","reportName":"2026年3月第2版"},
    {"description":"无障碍坡道坡度为1:10，大于规范要求的1:12","reportName":"2026年5月第1版"},
    {"description":"屋面防水等级选用III级，不满足该建筑功能要求的II级","reportName":"2026年4月第3版"},
    {"description":"幕墙预埋件间距超出规范允许范围","reportName":"2026年3月第2版"}
  ],
  "结构": [
    {"description":"建筑防火分区面积超过规范限值，未设置防火墙分隔","reportName":"2026年3月第2版"},
    {"description":"无障碍坡道坡度为1:10，大于规范要求的1:12","reportName":"2026年5月第1版"},
    {"description":"地下室人防门框墙与结构柱位置冲突，影响门扇开启","reportName":"2026年5月第1版"},
    {"description":"框架柱截面尺寸500x500mm，轴压比超出规范限值0.85","reportName":"2026年5月第1版"},
    {"description":"基础埋深仅1.5m，未达到持力层要求的2.8m深度","reportName":"2026年3月第2版"},
    {"description":"梁底筋配筋率2.8%，超过规范最大配筋率2.5%","reportName":"2026年4月第3版"},
    {"description":"悬挑长度3.2m的混凝土梁未进行抗倾覆验算","reportName":"2026年5月第1版"}
  ],
  "水": [
    {"description":"消防电梯前室尺寸小于规范最小值，影响消防救援操作","reportName":"2026年3月第2版"},
    {"description":"地下室人防门框墙与结构柱位置冲突，影响门扇开启","reportName":"2026年5月第1版"},
    {"description":"给水立管管材选用PVC-U，与设计要求的钢塑复合管不符","reportName":"2026年4月第3版"},
    {"description":"排水横管坡度0.3%，不满足自清流速所需的最小坡度0.5%","reportName":"2026年5月第1版"}
  ],
  "暖": [
    {"description":"疏散走道净宽度仅为1.1m，不满足1.4m的消防疏散要求","reportName":"2026年3月第2版"},
    {"description":"屋面防水等级选用III级，不满足该建筑功能要求的II级","reportName":"2026年4月第3版"},
    {"description":"幕墙预埋件间距超出规范允许范围","reportName":"2026年3月第2版"}
  ],
  "电": [
    {"description":"悬挑长度3.2m的混凝土梁未进行抗倾覆验算","reportName":"2026年5月第1版"},
    {"description":"应急照明配电箱未设置在配电间内，不满足防火要求","reportName":"2026年4月第3版"},
    {"description":"框架柱截面尺寸500x500mm，轴压比超出规范限值0.85","reportName":"2026年5月第1版"}
  ],
};

const FABRICATED_MAJOR_STATS = [
  { major: "建筑", count: 5 },
  { major: "结构", count: 4 },
  { major: "水", count: 2 },
  { major: "暖", count: 2 },
  { major: "电", count: 3 },
];

const FABRICATED_CONTACTS = [
  { major: "建筑", name: "陈工", title: "高级工程师", phone: "15333334451" },
  { major: "结构", name: "王工", title: "高级工程师", phone: "15333334452" },
  { major: "水", name: "刘工", title: "中级工程师", phone: "15333334453" },
  { major: "暖", name: "张工", title: "中级工程师", phone: "15333334454" },
  { major: "电", name: "李工", title: "高级工程师", phone: "15333334455" },
];

export default function IssueTrackingPanel({ projectId }: { projectId: string }) {
  const storageKey = "compare_result_" + projectId;
  const [result, setResult] = useState<CompareResult | null>(() => {
    try { const s = sessionStorage.getItem(storageKey); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidePanel, setSidePanel] = useState<{ type: string; label: string } | null>(null);

  const loadResult = () => {
    try {
      const s = sessionStorage.getItem(storageKey);
      setResult(s ? JSON.parse(s) : null);
    } catch {
      setResult(null);
    }
  };

  useEffect(() => {
    loadResult();
  }, [refreshKey]);

  const totalIssues = result ? result.summary.resolved + result.summary.new + result.summary.pending : 0;
  const resolved = result?.summary.resolved ?? 0;
  const unresolved = result ? result.summary.new + result.summary.pending : 0;

  const severityCounts: Record<string, number> = { "一类强条": 0, "二类强条": 0, "普通问题": 0 };
  if (result?.details) {
    result.details.forEach(d => {
      const s = d.severity || "普通问题";
      if (severityCounts[s] !== undefined) severityCounts[s]++;
      else severityCounts["普通问题"]++;
    });
  }

  const handleCardClick = (type: string) => {
    setSidePanel({ type, label: CARD_LABELS[type] || type });
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="shrink-0 flex items-center justify-end px-6 pt-4 pb-3 border-b border-gray-100">
        <button
          onClick={() => { loadResult(); setRefreshKey(k => k + 1); }}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
        >
          <RotateCw className="w-3.5 h-3.5" />
          刷新
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 space-y-6">

        {/* Row 1: 整改状态统计 */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">整改状态</h4>
          <div className="flex gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1 min-w-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("total")} title="查看总问题清单">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">总问题数</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalIssues}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1 min-w-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("resolved")} title="查看已整改问题清单">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500">已整改</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{resolved}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1 min-w-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("unresolved")} title="查看未整改问题清单">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-gray-500">未整改</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{unresolved}</p>
            </div>
          </div>
        </div>

        {/* Row 2: 风险等级统计 */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">风险等级</h4>
          <div className="flex gap-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex-1 min-w-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("severity_1")} title="查看一类强条清单">
              <span className="text-xs text-red-600 font-medium mb-1 block">一类强条</span>
              <p className="text-2xl font-bold text-red-700">{severityCounts["一类强条"]}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex-1 min-w-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("severity_2")} title="查看二类强条清单">
              <span className="text-xs text-orange-600 font-medium mb-1 block">二类强条</span>
              <p className="text-2xl font-bold text-orange-700">{severityCounts["二类强条"]}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1 min-w-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("severity_3")} title="查看普通问题清单">
              <span className="text-xs text-gray-500 font-medium mb-1 block">普通问题</span>
              <p className="text-2xl font-bold text-gray-900">{severityCounts["普通问题"]}</p>
            </div>
          </div>
        </div>

        {/* Row 3: 跨专业统计 */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">跨专业问题</h4>
          <div className="flex gap-3">
            {FABRICATED_MAJOR_STATS.map(m => (
              <div key={m.major} className="bg-white border border-gray-200 rounded-xl p-4 flex-1 min-w-0 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick(m.major)} title={"查看" + m.major + "专业问题清单"}>
                <span className="text-xs text-gray-500 mb-1 block">{m.major}</span>
                <p className="text-xl font-bold text-gray-900">{m.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 4: 各专业负责人联系方式 */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">各专业负责人</h4>
          <div className="flex gap-3">
            {FABRICATED_CONTACTS.map(c => (
              <div key={c.major} className="bg-white border border-gray-200 rounded-xl p-4 flex-1 min-w-0">
                <div className="text-xs text-gray-500 font-medium mb-1">{c.major}</div>
                <div className="text-sm font-semibold text-gray-900 mb-0.5">{c.name}</div>
                <div className="text-xs text-gray-400 mb-2">{c.title}</div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {c.phone}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      </div>

      {/* Side Panel */}
      {sidePanel && (

          <div className="w-96 border-l border-gray-200 bg-white flex flex-col shrink-0">
            <div className="shrink-0 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">{sidePanel.label} - 问题清单</h3>
              <button onClick={() => setSidePanel(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(FAKE_ISSUES[sidePanel.type] || []).length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-sm">暂无问题数据</div>
              ) : (
                (FAKE_ISSUES[sidePanel.type] || []).map((issue, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white space-y-2">
                    <p className="text-sm text-gray-800 leading-relaxed">{issue.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1 border-t border-gray-100">
                      <FileText className="w-3 h-3" />
                      首次记录: {issue.reportName}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
      )}
    </div>
  );
}