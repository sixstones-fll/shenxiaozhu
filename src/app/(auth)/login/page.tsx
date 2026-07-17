"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, ChevronRight, Building2 } from "lucide-react";
import { Toaster, toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("注册成功！请登录");
        setIsRegister(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="flex min-h-screen">
        {/* 左侧品牌展示区 */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-64 h-64 border border-white/20 rounded-full" />
            <div className="absolute bottom-20 right-10 w-96 h-96 border border-white/20 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/10 rounded-full" />
          </div>
          <div className="relative z-10 flex flex-col justify-center px-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">审小助</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              建筑工程<br />施工图审查助手
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed">
              基于 AI 技术的智能审图平台，<br />
              助力工程设计质量与效率提升
            </p>
            <div className="mt-12 flex items-center gap-2 text-blue-200 text-sm">
              <div className="w-2 h-2 bg-blue-300 rounded-full" />
              专业 · 高效 · 智能
            </div>
          </div>
        </div>

        {/* 右侧登录表单 */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12">
          <Card className="w-full max-w-md border-0 shadow-none lg:shadow-sm lg:border">
            <CardContent className="p-0 lg:p-8">
              <div className="lg:hidden flex items-center gap-2 mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">审小助</span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isRegister ? "创建账号" : "欢迎回来"}
              </h2>
              <p className="text-gray-500 mb-8">
                {isRegister
                  ? "注册账号开始使用审图助手"
                  : "登录您的账号继续使用"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="请输入邮箱地址"
                      className="pl-10 h-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">密码</Label>
                    {!isRegister && (
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        忘记密码？
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="请输入密码"
                      className="pl-10 pr-10 h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    "处理中..."
                  ) : (
                    <>
                      {isRegister ? "注册" : "登录"}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-500">
                {isRegister ? "已有账号？" : "还没有账号？"}{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {isRegister ? "立即登录" : "立即注册"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
