import { MainSidebar } from "@/components/shared/MainSidebar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
    Bell,
    BookOpen,
    Calendar,
    Menu,
    Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface TeacherStats {
  courseCount: number;
  studentCount: number;
  teacherInfo: {
    name: string;
    university: string;
    college: string;
  };
}

interface ScheduleItem {
  id: number;
  course_code: string;
  course_name: string;
  location: string;
  time: string;
}

interface Notification {
  id: number;
  content: string;
  time: string;
}

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const teacherId = localStorage.getItem('teacherId');
      if (!teacherId) {
        navigate('/login');
        return;
      }

      try {
        // 获取教师统计信息
        const statsResponse = await fetch(`/api/dashboard/teacher-stats/${teacherId}`);
        const statsData = await statsResponse.json();
        if (statsResponse.ok) {
          setStats(statsData.data);
        } else {
          throw new Error(statsData.detail || '获取统计信息失败');
        }

        // 获取课程安排
        const scheduleResponse = await fetch(`/api/dashboard/teacher-schedule/${teacherId}`);
        const scheduleData = await scheduleResponse.json();
        if (scheduleResponse.ok) {
          setSchedule(scheduleData.data.schedule);
        } else {
          throw new Error(scheduleData.detail || '获取课程安排失败');
        }

        // 获取通知
        const notificationsResponse = await fetch(`/api/dashboard/notifications/${teacherId}`);
        const notificationsData = await notificationsResponse.json();
        if (notificationsResponse.ok) {
          setNotifications(notificationsData.data.notifications);
        } else {
          throw new Error(notificationsData.detail || '获取通知失败');
        }
      } catch (error) {
        console.error('Dashboard data error:', error);
        toast({
          title: "获取数据失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, toast]);

  if (loading) {
    return <div>Loading...</div>; // 可以替换为更好的加载动画
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
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

      {/* 主要内容区域 */}
      <main
        className={`pt-20 transition-all duration-200 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold mb-6">教师工作台</h1>
          
          {/* 数据卡片区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              className="hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 cursor-pointer"
              onClick={() => navigate("/courses")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  任教课程
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.courseCount || 0} 门
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50 cursor-pointer" 
            onClick={() => navigate("/grades/statistics")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  学生总数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats?.studentCount || 0} 人
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-500" />
                  系统通知
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="text-sm border-b pb-2 last:border-b-0 last:pb-0"
                    >
                      <p className="text-gray-800 dark:text-gray-200">{notification.content}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 课程表区域 */}
          <Card className="mt-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                本周课程安排
              </CardTitle>
              <CardDescription>最近的课程安排</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedule.map((scheduleItem) => (
                  <div
                    key={scheduleItem.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h3 className="font-semibold text-green-600 dark:text-green-400">
                        {scheduleItem.course_name} - {scheduleItem.course_code}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {scheduleItem.location}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {scheduleItem.time}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
