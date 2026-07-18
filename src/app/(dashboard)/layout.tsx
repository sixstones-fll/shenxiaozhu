"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PlusCircle,
  FolderOpen,
  Settings,
  BookOpen,
  Building2,
  Bell,
  HelpCircle,
  Settings as SettingsIcon,
} from "lucide-react";
import UserMenu from "@/components/shared/UserMenu";

const navItems = [
  { label: "新建项目", href: "/projects/new", icon: PlusCircle },
  { label: "当前项目", href: "/projects", icon: FolderOpen },
  { label: "项目管理", href: "/projects/manage", icon: Settings },
  { label: "知识库管理", href: "/kb-upload", icon: BookOpen },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (pathname.startsWith(href + "?")) return true;
    if (pathname.startsWith(href + "#")) return true;
    return false;
  };
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-gray-100">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">审小助</span>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0 text-gray-400" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* 底部帮助与设置 */}
        <div className="border-t border-gray-100 px-3 py-3 space-y-0.5">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 w-full transition-colors">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>帮助</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 w-full transition-colors">
            <SettingsIcon className="w-4 h-4 shrink-0" />
            <span>设置</span>
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部导航栏 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <UserMenu user={{ name: "张三", role: "设计师" }} />
          </div>
        </header>

        {/* 内容区域 */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
