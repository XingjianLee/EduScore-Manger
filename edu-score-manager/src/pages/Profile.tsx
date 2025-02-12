import { MainSidebar } from "@/components/shared/MainSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, GraduationCap, Mail, Menu, Moon, Sun, User2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import * as z from "zod";

// 表单验证schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "密码至少6位"),
  newPassword: z.string().min(6, "密码至少6位"),
  confirmPassword: z.string().min(6, "密码至少6位"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "新密码与确认密码不匹配",
  path: ["confirmPassword"],
});

interface TeacherProfile {
  name: string;
  email: string;
  university: string;
  college: string;
  account: string;
}

const Profile = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const form = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const teacherId = localStorage.getItem('teacherId');
      if (!teacherId) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`/api/profile/teacher/${teacherId}`);
        const data = await response.json();
        if (response.ok) {
          setProfile(data.data);
        } else {
          throw new Error(data.detail || '获取个人信息失败');
        }
      } catch (error) {
        toast({
          title: "获取个人信息失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, toast]);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
    toast({
      title: "主题已更改",
      description: `已切换至${isDark ? "浅色" : "深色"}主题`,
    });
  };

  const onSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    const teacherId = localStorage.getItem('teacherId');
    if (!teacherId) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`/api/profile/password/${teacherId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: values.currentPassword,
          new_password: values.newPassword,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "密码修改成功",
          description: "您的密码已经更新",
        });
        form.reset();
      } else {
        throw new Error(data.detail || '密码修改失败');
      }
    } catch (error) {
      toast({
        title: "密码修改失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.clear();  // 清除所有存储的用户信息
    toast({
      title: "已退出登录",
      description: "您已安全退出系统",
    });
    navigate("/login");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b flex items-center px-4 z-50 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="ml-4 text-lg font-semibold">成绩管理系统</span>
      </nav>

      <MainSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main
        className={`pt-20 transition-all duration-200 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>个人信息</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleTheme}
                    className="rounded-full"
                  >
                    {isDark ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="flex items-center space-x-4 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <User2 className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">教师姓名</p>
                    <p className="text-2xl">{profile?.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <Building2 className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">所属学校</p>
                    <p className="text-2xl">{profile?.university}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <GraduationCap className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">所属院系</p>
                    <p className="text-2xl">{profile?.college}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <Mail className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">电子邮箱</p>
                    <p className="text-2xl">{profile?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>修改密码</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>当前密码</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>新密码</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>确认新密码</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            请再次输入新密码以确认
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">更新密码</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  退出登录
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
