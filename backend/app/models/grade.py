from sqlalchemy import Column, Integer, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class StudentGrade(Base):
    __tablename__ = "student_grades"
    
    student_id = Column(Integer, ForeignKey('students.student_id', ondelete='CASCADE'), primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.course_id', ondelete='CASCADE'), primary_key=True)
    daily_score = Column(DECIMAL(5,2), default=0.00)
    exam_score = Column(DECIMAL(5,2), default=0.00)
    
    student = relationship("Student", back_populates="grades")
    course = relationship("Course", back_populates="grades") 