import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, School } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

// 定义表单验证 schema
const formSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少需要6个字符"),
});

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [schoolName, setSchoolName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 验证表单数据
      const formData = { email, password };
      const validatedData = formSchema.parse(formData);

      if (!isLogin && password !== confirmPassword) {
        toast({
          title: "注册失败",
          description: "两次输入的密码不一致",
          variant: "destructive",
        });
        return;
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? validatedData
        : { 
            ...validatedData, 
            verification_code: verificationCode, 
            school_name: schoolName 
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '操作失败');
      }

      const data = await response.json();

      if (isLogin) {
        // 保存用户信息到 localStorage
        localStorage.setItem('teacherId', data.data.id.toString());
        localStorage.setItem('teacherName', data.data.name);
        localStorage.setItem('teacherEmail', data.data.email);
        localStorage.setItem('university', data.data.university);
        localStorage.setItem('college', data.data.college);
      }

      toast({
        title: isLogin ? "登录成功" : "注册成功",
        description: "欢迎使用成绩管理系统！",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error('Operation error:', error);
      if (error instanceof z.ZodError) {
        // 处理表单验证错误
        toast({
          title: "输入错误",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: isLogin ? "登录失败" : "注册失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
          {isLogin ? "登录" : "注册"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="邮箱"
                className="flex-1"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="密码"
                className="flex-1"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="确认密码"
                    className="flex-1"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="验证码"
                    className="flex-1"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "验证码已发送",
                        description: "请查看您的邮箱",
                      });
                    }}
                  >
                    获取验证码
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <School className="w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="学校名称"
                    className="flex-1"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <Button type="submit" className="w-full">
            {isLogin ? "登录" : "注册"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin ? "没有账号？立即注册" : "已有账号？立即登录"}
          </button>
          {isLogin && (
            <button className="block mx-auto mt-2 text-sm text-muted-foreground hover:text-primary hover:underline">
              忘记密码？
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Login;
