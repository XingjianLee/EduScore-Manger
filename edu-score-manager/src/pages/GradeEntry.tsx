import { MainSidebar } from "@/components/shared/MainSidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Check, Menu, MinusCircle, Save, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 移除模拟数据
const mockStudentsByCourse = {};
const mockCourses = [];

interface Course {
  course_id: number;
  name: string;
  semester: string;
}

interface Student {
  student_id: number;
  name: string;
  daily_score: string;
  exam_score: string;
  total_score?: number;
  hasUnsavedChanges: boolean;
}

const GradeEntry = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  // 获取课程的学生成绩
  const fetchGrades = async (courseId: number) => {
    try {
      const response = await fetch(`/api/grade/course/${courseId}/grades`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '获取成绩列表失败');
      }
      const data = await response.json();
      setStudents(data.data.map((student: any) => ({
        ...student,
        daily_score: student.daily_score?.toString() || "",
        exam_score: student.exam_score?.toString() || "",
        total_score: calculateTotalScore(student.daily_score, student.exam_score),
        hasUnsavedChanges: false
      })));
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast({
        title: "获取成绩列表失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 检查是否有未录入成绩的学生
  const hasUnenteredScores = students.some(
    student => !student.daily_score || !student.exam_score
  );

  // 检查学生是否有未录入的成绩
  const isStudentIncomplete = (student: Student) => {
    return !student.daily_score || !student.exam_score;
  };

  // 处理课程选择
  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    if (courseId) {
      fetchGrades(parseInt(courseId));
    } else {
      setStudents([]);
    }
    setSearchTerm("");
  };

  // 更新学生成绩
  const handleScoreChange = (studentId: number, type: 'daily' | 'exam', value: string) => {
    // 只允许输入0-100的数字
    const numValue = value.replace(/[^0-9]/g, "");
    const score = numValue ? Math.min(parseInt(numValue), 100) : "";
    
    setStudents(
      students.map((student) =>
        student.student_id === studentId
          ? {
              ...student,
              [type === 'daily' ? 'daily_score' : 'exam_score']: score.toString(),
              hasUnsavedChanges: true
            }
          : student
      )
    );
  };

  // 保存成绩
  const handleSaveGrades = async () => {
    const unsavedStudents = students.filter(student => student.hasUnsavedChanges);
    
    if (unsavedStudents.length === 0) {
      toast({
        title: "无需保存",
        description: "没有未保存的成绩更改",
        variant: "default",
      });
      return;
    }

    try {
      const response = await fetch(`/api/grade/course/${selectedCourse}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grades: unsavedStudents.map(student => ({
            daily_score: student.daily_score === "" ? 0 : parseFloat(student.daily_score),
            exam_score: student.exam_score === "" ? 0 : parseFloat(student.exam_score),
          })),
          student_ids: unsavedStudents.map(student => student.student_id)
        }),
      });

      const data = await response.json();
      if (response.ok) {
        await fetchGrades(parseInt(selectedCourse));
        toast({
          title: "保存成功",
          description: "所有成绩已成功保存",
          variant: "default",
        });
      } else {
        throw new Error(data.detail || '保存成绩失败');
      }
    } catch (error) {
      toast({
        title: "保存成绩失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 检查成绩状态的辅助函数
  const getScoreStatus = (student: Student) => {
    if (student.hasUnsavedChanges) {
      return {
        icon: <AlertCircle className="w-4 h-4 mr-1" />,
        text: "未保存",
        color: "text-yellow-500"
      };
    }
    
    if (!student.daily_score && !student.exam_score) {
      return {
        icon: <MinusCircle className="w-4 h-4 mr-1" />,
        text: "未录入",
        color: "text-gray-500"
      };
    }
    
    return {
      icon: <Check className="w-4 h-4 mr-1" />,
      text: "已保存",
      color: "text-green-500"
    };
  };

  // 计算总成绩
  const calculateTotalScore = (dailyScore: string, examScore: string) => {
    if (!dailyScore || !examScore) return "-";
    const daily = parseFloat(dailyScore);
    const exam = parseFloat(examScore);
    if (isNaN(daily) || isNaN(exam)) return "-";
    return (daily * 0.4 + exam * 0.6).toFixed(1);
  };

  // 判断总成绩是否低于60分
  const isBelowPassingGrade = (totalScore: string) => {
    return totalScore !== "-" && parseFloat(totalScore) < 60;
  };

  // 过滤学生列表
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toString().includes(searchTerm)
  );

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
          {hasUnenteredScores && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                还有学生成绩未录入，请及时完成成绩录入工作。
              </AlertDescription>
            </Alert>
          )}
          
          <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
            <CardHeader>
              <CardTitle>成绩录入</CardTitle>
              <CardDescription>为学生录入课程成绩</CardDescription>
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
                <div className="w-full md:w-2/3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="搜索学生姓名或学号..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50 dark:bg-gray-800/50"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!selectedCourse ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
              " 欢迎使用成绩录入功能👋，请选择一个课程开始分析" 
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>学生成绩列表</CardTitle>
                <Button 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={handleSaveGrades}
                >
                  <Save className="w-4 h-4 mr-2" />
                  保存成绩
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学号</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>平时成绩(40%)</TableHead>
                      <TableHead>考试成绩(60%)</TableHead>
                      <TableHead>总成绩</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const totalScore = calculateTotalScore(student.daily_score || "", student.exam_score || "");
                      return (
                        <TableRow 
                          key={student.student_id}
                          className={isStudentIncomplete(student) ? "bg-red-50 dark:bg-red-900/10" : ""}
                        >
                          <TableCell className="font-medium">{student.student_id}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={student.daily_score || ""}
                              onChange={(e) => handleScoreChange(student.student_id, 'daily', e.target.value)}
                              className={`w-24 text-center ${isStudentIncomplete(student) ? 'border-red-300' : ''}`}
                              placeholder="0-100"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={student.exam_score || ""}
                              onChange={(e) => handleScoreChange(student.student_id, 'exam', e.target.value)}
                              className={`w-24 text-center ${isStudentIncomplete(student) ? 'border-red-300' : ''}`}
                              placeholder="0-100"
                            />
                          </TableCell>
                          <TableCell>
                            <div className={`w-24 text-center font-medium ${isBelowPassingGrade(totalScore) ? 'bg-[#FEF7CD] rounded p-1' : ''}`}>
                              {totalScore}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const status = getScoreStatus(student);
                              return (
                                <div className={`flex items-center ${status.color}`}>
                                  {status.icon}
                                  <span className="text-sm">{status.text}</span>
                                </div>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default GradeEntry;

