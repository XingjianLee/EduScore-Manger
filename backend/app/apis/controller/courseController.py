from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...models.course import Course
from ...models.student import Student
from ...models.student_courses import StudentCourse
from ...core.database import get_db
from typing import Dict, List
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.types import String

router = APIRouter()

# 请求和响应模型
class CourseBase(BaseModel):
    course_code: str
    name: str
    semester: str
    total_hours: int
    total_classes: int
    schedule: str | None = None

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    course_id: int
    teacher_id: int
    created_at: datetime
    student_count: int = 0

    class Config:
        from_attributes = True

class StudentBase(BaseModel):
    student_id: int
    name: str
    major: str | None = None
    class_name: str | None = None
    phone: str | None = None

@router.get("/teacher/{teacher_id}/courses")
async def get_teacher_courses(teacher_id: int, db: Session = Depends(get_db)) -> Dict:
    courses = db.query(Course).filter(Course.teacher_id == teacher_id).all()
    
    # 获取每个课程的学生数量
    course_responses = []
    for course in courses:
        student_count = db.query(StudentCourse)\
            .filter(StudentCourse.course_id == course.course_id)\
            .count()
        
        course_data = CourseResponse(
            course_id=course.course_id,
            course_code=course.course_code,
            name=course.name,
            semester=course.semester,
            total_hours=course.total_hours,
            total_classes=course.total_classes,
            schedule=course.schedule,
            teacher_id=course.teacher_id,
            created_at=course.created_at,
            student_count=student_count
        )
        course_responses.append(course_data)
    
    return {
        "status": "success",
        "data": course_responses
    }

@router.get("/course/{course_id}/students")
async def get_course_students(course_id: int, db: Session = Depends(get_db)) -> Dict:
    try:
        # 首先检查课程是否存在
        course = db.query(Course).filter(Course.course_id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="课程不存在"
            )
        
        # 获取选修该课程的所有学生
        students = db.query(Student)\
            .join(StudentCourse, Student.student_id == StudentCourse.student_id)\
            .filter(StudentCourse.course_id == course_id)\
            .all()
        
        # 转换为响应模型
        student_responses = []
        for student in students:
            student_responses.append({
                "student_id": student.student_id,
                "name": student.name,
                "major": student.major,
                "class_name": student.class_name,
                "phone": student.phone
            })
        
        return {
            "status": "success",
            "data": student_responses
        }
    except Exception as e:
        # 添加日志记录
        print(f"Error in get_course_students: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取学生列表失败: {str(e)}"
        )

@router.post("/course/{course_id}/student")
async def add_student_to_course(
    course_id: int,
    student_data: StudentBase,
    db: Session = Depends(get_db)
) -> Dict:
    # 检查学生是否已存在
    student = db.query(Student).filter(Student.student_id == student_data.student_id).first()
    if not student:
        # 创建新学生
        student = Student(
            student_id=student_data.student_id,
            name=student_data.name,
            major=student_data.major,
            class_name=student_data.class_name,
            phone=student_data.phone
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    
    # 检查学生是否已选修该课程
    enrollment = db.query(StudentCourse)\
        .filter(
            StudentCourse.student_id == student.student_id,
            StudentCourse.course_id == course_id
        ).first()
    
    if enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该学生已选修此课程"
        )
    
    # 添加选课记录
    new_enrollment = StudentCourse(
        student_id=student.student_id,
        course_id=course_id
    )
    db.add(new_enrollment)
    db.commit()
    
    return {
        "status": "success",
        "message": "学生添加成功"
    }

@router.delete("/course/{course_id}/student/{student_id}")
async def remove_student_from_course(
    course_id: int,
    student_id: int,
    db: Session = Depends(get_db)
) -> Dict:
    # 删除选课记录
    enrollment = db.query(StudentCourse)\
        .filter(
            StudentCourse.student_id == student_id,
            StudentCourse.course_id == course_id
        ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该选课记录"
        )
    
    db.delete(enrollment)
    db.commit()
    
    return {
        "status": "success",
        "message": "学生移除成功"
    }

@router.put("/course/{course_id}/student/{student_id}")
async def update_student(
    course_id: int,
    student_id: int,
    student_data: StudentBase,
    db: Session = Depends(get_db)
) -> Dict:
    # 检查学生是否存在
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="学生不存在"
        )
    
    # 检查学生是否在这个课程中
    enrollment = db.query(StudentCourse)\
        .filter(
            StudentCourse.student_id == student_id,
            StudentCourse.course_id == course_id
        ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="该学生未选修此课程"
        )
    
    # 更新学生信息
    for key, value in student_data.dict(exclude_unset=True).items():
        setattr(student, key, value)
    
    db.commit()
    
    return {
        "status": "success",
        "message": "学生信息更新成功"
    }

@router.get("/semesters")
async def get_semesters(db: Session = Depends(get_db)) -> Dict:
    try:
        # 从课程表中获取所有不重复的学期
        semesters = db.query(Course.semester)\
            .distinct()\
            .order_by(Course.semester.desc())\
            .all()
        
        # 将结果转换为列表
        semester_list = [semester[0] for semester in semesters]
        
        return {
            "status": "success",
            "data": semester_list
        }
    except Exception as e:
        print(f"Error in get_semesters: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取学期列表失败: {str(e)}"
        )

@router.get("/search-students")
async def search_students(
    keyword: str,
    db: Session = Depends(get_db)
) -> Dict:
    try:
        # 通过学号或姓名搜索学生
        students = db.query(Student)\
            .filter(
                (Student.student_id.cast(String).like(f"%{keyword}%")) |
                (Student.name.like(f"%{keyword}%"))
            )\
            .all()
        
        student_responses = []
        for student in students:
            student_responses.append({
                "student_id": student.student_id,
                "name": student.name,
                "major": student.major,
                "class_name": student.class_name,
                "phone": student.phone
            })
        
        return {
            "status": "success",
            "data": student_responses
        }
    except Exception as e:
        print(f"Error in search_students: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"搜索学生失败: {str(e)}"
        ) 