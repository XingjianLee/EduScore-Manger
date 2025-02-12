from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class Course(Base):
    __tablename__ = "courses"
    
    course_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    course_code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    semester = Column(String(20), nullable=False)
    total_hours = Column(Integer, nullable=False)
    total_classes = Column(Integer, nullable=False)
    schedule = Column(String(500))  # 课程安排，格式：周几,时间,地点;周几,时间,地点;...
    teacher_id = Column(Integer, ForeignKey('teachers.teacher_id'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 定义关系
    teacher = relationship("Teacher", back_populates="courses")
    students = relationship("Student", secondary="student_courses", back_populates="courses")
    grades = relationship("StudentGrade", back_populates="course") 