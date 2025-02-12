from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ...models.teacher import Teacher
from ...models.course import Course
from ...models.student import Student
from ...models.student_courses import StudentCourse
from ...core.database import get_db
from typing import Dict, List
from datetime import datetime

router = APIRouter()

@router.get("/teacher-stats/{teacher_id}")
async def get_teacher_stats(teacher_id: int, db: Session = Depends(get_db)) -> Dict:
    try:
        # 获取教师信息
        teacher = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="教师不存在"
            )
        
        # 获取课程数量
        course_count = db.query(func.count(Course.course_id))\
            .filter(Course.teacher_id == teacher_id)\
            .scalar()
        
        # 获取学生总数（去重）
        student_count = db.query(func.count(func.distinct(StudentCourse.student_id)))\
            .join(Course, Course.course_id == StudentCourse.course_id)\
            .filter(Course.teacher_id == teacher_id)\
            .scalar()
        
        return {
            "status": "success",
            "data": {
                "courseCount": course_count,
                "studentCount": student_count,
                "teacherInfo": {
                    "name": teacher.name,
                    "university": teacher.university,
                    "college": teacher.college
                }
            }
        }
    except Exception as e:
        print(f"Error in get_teacher_stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取教师统计信息失败: {str(e)}"
        )

@router.get("/teacher-schedule/{teacher_id}")
async def get_teacher_schedule(teacher_id: int, db: Session = Depends(get_db)) -> Dict:
    try:
        # 获取教师的课程安排
        courses = db.query(Course)\
            .filter(Course.teacher_id == teacher_id)\
            .all()
        
        schedule = []
        for course in courses:
            if course.schedule:  # 如果有课程安排
                schedule_items = []
                for item in course.schedule.split(';'):  # 假设schedule字段用分号分隔
                    if item:
                        day, time, location = item.split(',')  # 假设格式为：周几,时间,地点
                        schedule_items.append({
                            "id": course.course_id,
                            "course_code": course.course_code,
                            "course_name": course.name,  # 使用新增的name字段
                            "location": location,
                            "time": f"{day} {time}"
                        })
                schedule.extend(schedule_items)
        
        return {
            "status": "success",
            "data": {
                "schedule": schedule
            }
        }
    except Exception as e:
        print(f"Error in get_teacher_schedule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取课程安排失败: {str(e)}"
        )

@router.get("/notifications/{teacher_id}")
async def get_notifications(teacher_id: int, db: Session = Depends(get_db)) -> Dict:
    try:
        # 这里可以实现真实的通知系统
        # 现在返回模拟数据
        notifications = [
            {"id": 1, "content": "期中考试成绩已截止提交", "time": "2小时前"},
            {"id": 2, "content": "新学期课程分配已完成", "time": "1天前"},
            {"id": 3, "content": "教学工作会议通知", "time": "2天前"},
        ]
        
        return {
            "status": "success",
            "data": {
                "notifications": notifications
            }
        }
    except Exception as e:
        print(f"Error in get_notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取通知失败: {str(e)}"
        ) 