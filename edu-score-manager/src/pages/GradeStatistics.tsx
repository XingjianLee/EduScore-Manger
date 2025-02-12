import { MainSidebar } from "@/components/shared/MainSidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import { useNavigate } from "react-router-dom";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

interface Course {
  course_id: number;
  name: string;
  semester: string;
}

interface GradeStatistics {
  total_students: number;
  average_score: number;
  max_score: number;
  min_score: number;
  pass_rate: string;
  failing_number: number;
  score_distribution: Array<{
    score: string;
    count: number;
    percentage: string;
  }>;
}

const GradeStatistics = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [statistics, setStatistics] = useState<GradeStatistics | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAiCard, setShowAiCard] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [lastAnalyzedCourse, setLastAnalyzedCourse] = useState<string>("");

  // 获取课程列表
  useEffect(() => {
    const fetchCourses = async () => {
      const teacherId = localStorage.getItem('teacherId');
      if (!teacherId) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`/api/course/teacher/${teacherId}/courses`);
        const data = await response.json();
        if (response.ok) {
          setCourses(data.data);
          
          // 获取上次选择的课程和分析状态
          const lastSelectedCourse = localStorage.getItem('lastSelectedCourse');
          const lastAiAnalysis = localStorage.getItem('lastAiAnalysis');
          const lastAnalyzedCourseId = localStorage.getItem('lastAnalyzedCourse');
          
          if (lastSelectedCourse) {
            setIsFirstVisit(false);
            const courseExists = data.data.some(
              (course: Course) => course.course_id.toString() === lastSelectedCourse
            );
            if (courseExists) {
              setSelectedCourse(lastSelectedCourse);
              fetchStatistics(parseInt(lastSelectedCourse));
              
              // 恢复 AI 分析状态
              if (lastAiAnalysis && lastAnalyzedCourseId === lastSelectedCourse) {
                setShowAiCard(true);
                setAiAnalysis(lastAiAnalysis);
                setLastAnalyzedCourse(lastSelectedCourse);
              }
            }
          }
        } else {
          throw new Error(data.detail || '获取课程列表失败');
        }
      } catch (error) {
        toast({
          title: "获取课程列表失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [navigate, toast]);

  // 获取成绩统计数据
  const fetchStatistics = async (courseId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/grade/course/${courseId}/statistics`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '获取成绩统计失败');
      }
      const data = await response.json();
      setStatistics(data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        title: "获取成绩统计失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取AI分析（流式）
  const fetchAiAnalysis = async (courseId: number) => {
    try {
      setIsAnalyzing(true);
      setAiAnalysis("");  // 清空之前的分析结果
      
      const response = await fetch(`/api/grade/course/${courseId}/ai-analysis`);
      if (!response.ok) {
        throw new Error('AI分析请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullAnalysis = '';  // 用于保存完整的分析结果

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullAnalysis += data.content;  // 累积完整的分析结果
                setAiAnalysis(fullAnalysis);
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('解析数据失败:', e);
            }
          }
        }
      }

      // 分析完成后保存结果
      localStorage.setItem('lastAiAnalysis', fullAnalysis);
      localStorage.setItem('lastAnalyzedCourse', courseId.toString());
      setLastAnalyzedCourse(courseId.toString());

    } catch (error) {
      console.error('AI Analysis error:', error);
      toast({
        title: "获取AI分析失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 修改课程选择处理函数
  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    if (courseId) {
      localStorage.setItem('lastSelectedCourse', courseId);
      setIsFirstVisit(false);
      fetchStatistics(parseInt(courseId));
      
      // 如果该课程之前有 AI 分析结果，恢复显示
      if (courseId === lastAnalyzedCourse) {
        setShowAiCard(true);
      } else {
        setShowAiCard(false);
        setAiAnalysis("");
      }
    } else {
      setStatistics(null);
      setShowAiCard(false);
      setAiAnalysis("");
    }
  };

  // 处理 AI 分析按钮点击
  const handleAiAnalysis = () => {
    if (!selectedCourse) {
      toast({
        title: "分析失败",
        description: "请先选择课程",
        variant: "destructive",
      });
      return;
    }
    setShowAiCard(true);
    fetchAiAnalysis(parseInt(selectedCourse));
  };

  // 导出成绩数据
  const handleExport = async () => {
    if (!selectedCourse) {
      toast({
        title: "导出失败",
        description: "请先选择课程",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/grade/course/${selectedCourse}/export`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '导出失败');
      }

      // 获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = '成绩表.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
        if (filenameMatch && filenameMatch[1]) {
          // 解码文件名
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      // 下载文件
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      
      // 使用 click() 方法前确保元素已添加到 DOM
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast({
        title: "导出成功",
        description: "成绩数据已成功导出",
        variant: "default",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "导出失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 生成饼图的颜色
  const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884d8'];

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

      <main className={`pt-20 transition-all duration-200 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        <div className="p-6 space-y-6">
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>成绩统计</CardTitle>
                <CardDescription className="mt-1.5">查看课程成绩统计数据</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAiAnalysis}
                  disabled={!selectedCourse || isAnalyzing}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      分析中
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🤖</span>
                      AI 分析
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleExport}
                  disabled={!selectedCourse || loading}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  导出成绩
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/3">
                  <Select value={selectedCourse} onValueChange={handleCourseChange}>
                    <SelectTrigger className="bg-white/50 dark:bg-gray-800/50">
                      <SelectValue placeholder="选择课程" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.course_id} value={course.course_id.toString()}>
                          {course.name} ({course.semester})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card>
              <CardContent className="flex justify-center items-center h-32">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>加载统计数据中...</span>
              </CardContent>
            </Card>
          ) : statistics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      成绩概览
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-600 dark:text-blue-400">总人数</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {statistics.total_students}人
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400">平均分</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {statistics.average_score}分
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm text-purple-600 dark:text-purple-400">最高分</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {statistics.max_score}分
                        </p>
                      </div>
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">最低分</p>
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                          {statistics.min_score}分
                        </p>
                      </div>
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <p className="text-sm text-indigo-600 dark:text-indigo-400">及格率</p>
                        <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                          {statistics.pass_rate}
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">不及格人数</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                          {statistics.failing_number}人
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      分数段分布
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statistics.score_distribution}
                            dataKey="count"
                            nameKey="score"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={60}
                            label={({ score, percentage }) => `${score}分: ${percentage}`}
                          >
                            {statistics.score_distribution.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]}
                                className="hover:opacity-80 transition-opacity"
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value}人`, '人数']}
                            labelFormatter={(label) => `${label}分`}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* AI分析卡片 */}
              {showAiCard && (
                <Card className="mt-6 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      AI 成绩分析
                      {isAnalyzing && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm font-normal text-gray-500">
                            正在生成分析...
                          </span>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-gray-600 dark:text-gray-300">
                      {aiAnalysis ? (
                        <ReactMarkdown className="prose dark:prose-invert max-w-none">
                          {aiAnalysis}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-center text-gray-500">
                          {isAnalyzing ? (
                            <span className="text-blue-500">
                              AI正在分析课程数据，请稍候...
                            </span>
                          ) : (
                            "点击 AI 分析 按钮开始分析"
                          )}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col justify-center items-center h-32 text-gray-500 space-y-2">
                <span>
                  {isFirstVisit 
                    ? "👋 欢迎使用成绩统计功能，请选择一个课程开始分析" 
                    : "请选择课程查看统计数据"}
                </span>
                {isFirstVisit && (
                  <div className="flex items-center text-sm text-blue-500">
                    <span className="animate-bounce mr-2">↑</span>
                    <span>在上方选择课程</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default GradeStatistics;
