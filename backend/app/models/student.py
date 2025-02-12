from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class Student(Base):
    __tablename__ = "students"
    
    student_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    college = Column(String(100))
    major = Column(String(100))
    class_name = Column('class', String(50))
    phone = Column(String(20), unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 定义关系
    courses = relationship("Course", secondary="student_courses", back_populates="students")
    grades = relationship("StudentGrade", back_populates="student") 