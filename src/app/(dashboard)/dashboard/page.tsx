import { FileText, Clock } from "lucide-react";

const recentProjects = [
  { name: "XX商业综合体施工图审查", status: "审图进行中", updatedAt: "2小时前" },
  { name: "YY住宅小区项目", status: "规划完成", updatedAt: "1天前" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 欢迎横幅 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h1 className="text-xl font-bold mb-1">上午好，张三</h1>
        <p className="text-blue-100 text-sm">
          你有 2 个项目正在进行中
        </p>
      </div>

      {/* 最近项目 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">最近项目</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            查看全部
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {recentProjects.map((project) => (
            <div key={project.name} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  project.status === "审图进行中"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-green-50 text-green-600"
                }`}>
                  {project.status}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {project.updatedAt}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
