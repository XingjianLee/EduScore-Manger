from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class StudentCourse(Base):
    __tablename__ = "student_courses"
    
    student_id = Column(Integer, ForeignKey('students.student_id', ondelete='CASCADE'), primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.course_id', ondelete='CASCADE'), primary_key=True) 