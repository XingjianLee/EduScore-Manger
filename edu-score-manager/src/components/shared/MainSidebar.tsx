import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart2,
  BookOpen,
  Home,
  Menu,
  Moon,
  PenTool,
  Sun,
  User,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface MainSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
}

export const MainSidebar = ({ isSidebarOpen, setIsSidebarOpen }: MainSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  const menuItems = [
    { icon: Home, label: "首页", path: "/dashboard", color: "text-blue-500" },
    { icon: BookOpen, label: "课程管理", path: "/courses", color: "text-purple-500" },
    { icon: PenTool, label: "成绩录入", path: "/grades/entry", color: "text-pink-500" },
    { icon: BarChart2, label: "成绩统计", path: "/grades/statistics", color: "text-orange-500" },
    { icon: User, label: "个人中心", path: "/profile", color: "text-green-500" },
  ];

  return (
    <>
      {/* 顶部导航栏 */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b flex items-center px-4 z-50 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="ml-4 text-lg font-semibold">学生成绩管理系统</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="ml-2"
        >
          {isDark ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </nav>

      {/* 侧边栏 */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-r transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ScrollArea className="h-full">
          <div className="p-4">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`w-full justify-start gap-2 hover:scale-105 transition-transform ${item.color} 
                    ${location.pathname === item.path ? 
                      'bg-accent font-semibold shadow-sm dark:bg-blue-500/25 dark:text-white' : 
                      'hover:bg-accent/50 dark:hover:bg-blue-500/10'}`}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};
