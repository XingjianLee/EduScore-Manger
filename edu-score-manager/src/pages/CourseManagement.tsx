import { MainSidebar } from "@/components/shared/MainSidebar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { CalendarDays, Menu, Search, Trash2, UserPlus, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Course {
  course_id: number;
  course_code: string;
  name: string;
  semester: string;
  total_hours: number;
  total_classes: number;
  schedule: string | null;  // 字符串格式：周几,时间,地点;周几,时间,地点;...
  teacher_id: number;
  student_count: number;
}

interface Student {
  student_id: number;
  name: string;
  major: string | null;
  class_name: string | null;
  phone: string | null;
}

interface ScheduleItem {
  time: string;
  location: string;
}

// 添加搜索结果类型
interface SearchResult extends Student {
  isSelected?: boolean;
}

const CourseManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [newStudent, setNewStudent] = useState<Partial<Student>>({});
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // 获取课程的学生列表
  const fetchStudents = async (courseId: number) => {
    setLoadingStudents(true);
    try {
      const response = await fetch(`/api/course/course/${courseId}/students`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '获取学生列表失败');
      }
      const data = await response.json();
      setStudents(data.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "获取学生列表失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  // 过滤课程列表
  const filteredCourses = courses.filter((course) => {
    const matchesSemester = selectedSemester === "all" ? true : course.semester === selectedSemester;
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSemester && matchesSearch;
  });

  // 修改课程安排的解析函数
  const parseSchedule = (scheduleStr: string | null): ScheduleItem[] => {
    if (!scheduleStr) return [];
    return scheduleStr.split(';')
      .filter(item => item.trim())
      .map(item => {
        const [day, time, location] = item.split(',');
        return {
          time: `${day} ${time}`,
          location: location.trim()
        };
      });
  };

  // 根据选择的日期过滤课程安排
  const getScheduleForDate = (scheduleStr: string | null): ScheduleItem[] => {
    // 这里可以添加日期过滤逻辑，现在先返回所有安排
    return parseSchedule(scheduleStr);
  };

  // 过滤学生列表
  const filteredStudents = students.filter(student =>
    Object.values(student).some(value =>
      value?.toString().toLowerCase().includes(studentSearchTerm.toLowerCase())
    )
  );

  // 当选择课程时获取学生列表
  useEffect(() => {
    if (selectedCourse) {
      fetchStudents(selectedCourse.course_id);
    }
  }, [selectedCourse]);

  // 搜索学生
  const handleSearchStudents = async () => {
    if (!searchKeyword.trim()) {
      toast({
        title: "请输入搜索关键词",
        description: "请输入学号或姓名",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/course/search-students?keyword=${encodeURIComponent(searchKeyword)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '搜索学生失败');
      }
      const data = await response.json();
      setSearchResults(data.data.map((student: Student) => ({
        ...student,
        isSelected: false
      })));
    } catch (error) {
      console.error('Error searching students:', error);
      toast({
        title: "搜索学生失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // 添加选中的学生
  const handleAddSelectedStudents = async () => {
    const selectedStudents = searchResults.filter(s => s.isSelected);
    if (selectedStudents.length === 0) {
      toast({
        title: "请选择学生",
        description: "请至少选择一名学生添加到课程",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
    let existCount = 0;

    for (const student of selectedStudents) {
      try {
        const response = await fetch(`/api/course/course/${selectedCourse?.course_id}/student`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(student),
        });

        const data = await response.json();
        
        if (response.ok) {
          successCount++;
        } else if (response.status === 400 && data.detail.includes("已选修")) {
          existCount++;
        } else {
          throw new Error(data.detail || '添加学生失败');
        }
      } catch (error) {
        toast({
          title: `添加学生 ${student.name} 失败`,
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    }

    // 刷新学生列表
    if (selectedCourse && successCount > 0) {
      await fetchStudents(selectedCourse.course_id);
    }

    // 修改添加学生结果的提示
    if (successCount > 0 || existCount > 0) {
      toast({
        title: successCount > 0 ? "添加成功" : "添加提示",
        description: `${successCount > 0 ? `成功添加 ${successCount} 名学生` : ''}${existCount > 0 ? `${successCount > 0 ? '，' : ''}${existCount} 名学生已在课程中` : ''}`,
        variant: successCount > 0 ? "default" : "destructive",
      });
    }

    setSearchResults([]);
    setSearchKeyword("");
    setIsAddingStudent(false);
  };

  // 更新学生信息
  const handleUpdateStudent = async () => {
    if (!selectedCourse || !editingStudent) return;

    try {
      const response = await fetch(`/api/course/course/${selectedCourse.course_id}/student/${editingStudent.student_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingStudent),
      });

      const data = await response.json();
      if (response.ok) {
        // 刷新学生列表
        await fetchStudents(selectedCourse.course_id);
        setEditingStudent(null);
        toast({
          title: "成功",
          description: "学生信息更新成功",
        });
      } else {
        throw new Error(data.detail || '更新学生信息失败');
      }
    } catch (error) {
      toast({
        title: "更新学生信息失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 添加一个函数来处理对话框的关闭
  const handleDialogClose = () => {
    setIsStudentDialogOpen(false);
    setSelectedCourse(null);
    setEditingStudent(null);
    setIsAddingStudent(false);
    setStudentSearchTerm("");
  };

  // 获取学期列表
  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/course/semesters');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '获取学期列表失败');
      }
      const data = await response.json();
      setSemesters(data.data);
    } catch (error) {
      console.error('Error fetching semesters:', error);
      toast({
        title: "获取学期列表失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 在组件加载时获取学期列表
  useEffect(() => {
    fetchSemesters();
  }, []);

  // 处理删除学生
  const handleDeleteStudent = async () => {
    if (!studentToDelete || !selectedCourse || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/course/course/${selectedCourse.course_id}/student/${studentToDelete.student_id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (response.ok) {
        // 刷新学生列表
        await fetchStudents(selectedCourse.course_id);
        toast({
          title: "成功",
          description: "学生已从课程中移除",
        });
        setShowDeleteConfirm(false);
        setStudentToDelete(null);
      } else {
        throw new Error(data.detail || '删除学生失败');
      }
    } catch (error) {
      toast({
        title: "删除学生失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 删除确认对话框组件
  const DeleteConfirmDialog = () => (
    <Dialog 
      open={showDeleteConfirm} 
      onOpenChange={(open) => {
        if (!open && !isDeleting) {
          setShowDeleteConfirm(false);
          setStudentToDelete(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            确定要将学生 {studentToDelete?.name} 从课程中移除吗？此操作不可撤销。
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteConfirm(false);
                setStudentToDelete(null);
              }
            }}
            disabled={isDeleting}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteStudent}
            disabled={isDeleting}
          >
            {isDeleting ? "删除中..." : "确认删除"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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

      <main
        className={`pt-20 transition-all duration-200 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="p-6 space-y-6">
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <CardHeader>
              <CardTitle>课程管理</CardTitle>
              <CardDescription>管理和查看您的教学课程信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/3">
                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger className="bg-white/50 dark:bg-gray-800/50">
                      <SelectValue placeholder="选择学期" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部学期</SelectItem>
                      {semesters.map((semester) => (
                        <SelectItem key={semester} value={semester}>
                          {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-2/3">
                  <Input
                    placeholder="搜索课程名称..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/50 dark:bg-gray-800/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>课程列表</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学期</TableHead>
                    <TableHead>课程名称</TableHead>
                    <TableHead>总课次/课时</TableHead>
                    <TableHead>课程安排</TableHead>
                    <TableHead>选课人数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.course_id} className="hover:bg-muted/50">
                      <TableCell>
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {course.semester}
                        </span>
                      </TableCell>
                      <TableCell>{course.name}</TableCell>
                      <TableCell>
                        <span className="text-blue-600 dark:text-blue-400">
                          {course.total_classes}次/{course.total_hours}课时
                        </span>
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="flex items-center text-blue-500">
                              <CalendarDays className="h-4 w-4 mr-2" />
                              查看安排
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              className="rounded-md border"
                            />
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50">
                              <h4 className="font-semibold mb-2">课程安排</h4>
                              <div className="space-y-2">
                                {getScheduleForDate(course.schedule).map((s, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
                                  >
                                    <span>{s.time}</span>
                                    <span className="text-muted-foreground">
                                      {s.location}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <Dialog 
                          open={isStudentDialogOpen && selectedCourse?.course_id === course.course_id}
                          onOpenChange={(open) => {
                            if (!open) {
                              handleDialogClose();
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              className="flex items-center text-purple-500"
                              onClick={() => {
                                setSelectedCourse(course);
                                setIsStudentDialogOpen(true);
                              }}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              {course.student_count}人
                            </Button>
                          </DialogTrigger>
                          <DialogContent 
                            className="max-w-3xl max-h-[80vh] overflow-hidden"
                            onEscapeKeyDown={handleDialogClose}
                            onInteractOutside={handleDialogClose}
                          >
                            <DialogHeader>
                              <DialogTitle>学生名单 - {course.name}</DialogTitle>
                              <DialogDescription>
                                管理{course.name}课程的学生信息
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <div className="relative flex-1 mr-4">
                                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="搜索学生..."
                                    value={studentSearchTerm}
                                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                                    className="pl-10"
                                  />
                                </div>
                                <Button
                                  onClick={() => setIsAddingStudent(true)}
                                  className="flex items-center"
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  添加学生
                                </Button>
                              </div>

                              {isAddingStudent && (
                                <Card>
                                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">添加学生</CardTitle>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setIsAddingStudent(false);
                                        setSearchResults([]);
                                        setSearchKeyword("");
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      <div className="flex gap-2">
                                        <Input
                                          placeholder="输入学号或姓名搜索..."
                                          value={searchKeyword}
                                          onChange={(e) => setSearchKeyword(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleSearchStudents();
                                            }
                                          }}
                                        />
                                        <Button onClick={handleSearchStudents} disabled={isSearching}>
                                          {isSearching ? "搜索中..." : "搜索"}
                                        </Button>
                                      </div>

                                      {searchResults.length > 0 && (
                                        <div className="space-y-4">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead className="w-[50px]">
                                                  <Checkbox
                                                    checked={searchResults.every(s => s.isSelected)}
                                                    onCheckedChange={(checked) => {
                                                      setSearchResults(searchResults.map(s => ({
                                                        ...s,
                                                        isSelected: checked === true
                                                      })));
                                                    }}
                                                  />
                                                </TableHead>
                                                <TableHead>学号</TableHead>
                                                <TableHead>姓名</TableHead>
                                                <TableHead>专业</TableHead>
                                                <TableHead>班级</TableHead>
                                                <TableHead>手机号</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {searchResults.map((student) => (
                                                <TableRow key={student.student_id}>
                                                  <TableCell>
                                                    <Checkbox
                                                      checked={student.isSelected}
                                                      onCheckedChange={(checked) => {
                                                        setSearchResults(searchResults.map(s => 
                                                          s.student_id === student.student_id
                                                            ? { ...s, isSelected: checked === true }
                                                            : s
                                                        ));
                                                      }}
                                                    />
                                                  </TableCell>
                                                  <TableCell>{student.student_id}</TableCell>
                                                  <TableCell>{student.name}</TableCell>
                                                  <TableCell>{student.major}</TableCell>
                                                  <TableCell>{student.class_name}</TableCell>
                                                  <TableCell>{student.phone}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                          <Button 
                                            className="w-full"
                                            onClick={handleAddSelectedStudents}
                                          >
                                            添加选中的学生
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              <div className="relative">
                                <div className="absolute top-0 w-full bg-background z-10">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-[100px]">学号</TableHead>
                                        <TableHead className="w-[100px]">姓名</TableHead>
                                        <TableHead className="w-[150px]">专业</TableHead>
                                        <TableHead className="w-[100px]">班级</TableHead>
                                        <TableHead className="w-[120px]">手机号</TableHead>
                                        <TableHead className="w-[120px]">操作</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                  </Table>
                                </div>
                                <div className="overflow-y-auto max-h-[50vh] mt-[40px]">
                                  <Table>
                                    <TableBody>
                                      {loadingStudents ? (
                                        <TableRow>
                                          <TableCell colSpan={6} className="text-center py-4">
                                            加载中...
                                          </TableCell>
                                        </TableRow>
                                      ) : filteredStudents.length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={6} className="text-center py-4">
                                            暂无学生数据
                                          </TableCell>
                                        </TableRow>
                                      ) : (
                                        filteredStudents.map((student) => (
                                          <TableRow key={student.student_id}>
                                            <TableCell className="w-[100px]">{student.student_id}</TableCell>
                                            <TableCell className="w-[100px]">{student.name}</TableCell>
                                            <TableCell className="w-[150px]">{student.major}</TableCell>
                                            <TableCell className="w-[100px]">{student.class_name}</TableCell>
                                            <TableCell className="w-[120px]">{student.phone}</TableCell>
                                            <TableCell className="w-[120px]">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  setStudentToDelete(student);
                                                  setShowDeleteConfirm(true);
                                                }}
                                              >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 编辑学生对话框 */}
          {editingStudent && (
            <Dialog 
              open={!!editingStudent} 
              onOpenChange={(open) => {
                if (!open) {
                  setEditingStudent(null);
                }
              }}
            >
              <DialogContent
                onEscapeKeyDown={() => setEditingStudent(null)}
                onInteractOutside={() => setEditingStudent(null)}
              >
                <DialogHeader>
                  <DialogTitle>编辑学生信息</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      value={editingStudent.student_id}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, student_id: Number(e.target.value) })
                      }
                      placeholder="学号"
                    />
                    <Input
                      value={editingStudent.name}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, name: e.target.value })
                      }
                      placeholder="姓名"
                    />
                    <Input
                      value={editingStudent.major || ''}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, major: e.target.value })
                      }
                      placeholder="专业"
                    />
                    <Input
                      value={editingStudent.class_name || ''}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, class_name: e.target.value })
                      }
                      placeholder="班级"
                    />
                    <Input
                      value={editingStudent.phone || ''}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, phone: e.target.value })
                      }
                      placeholder="手机号"
                    />
                  </div>
                  <Button onClick={handleUpdateStudent}>保存修改</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* 添加删除确认对话框 */}
          <DeleteConfirmDialog />
        </div>
      </main>
    </div>
  );
};

export default CourseManagement;

