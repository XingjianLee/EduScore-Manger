from ..core.database import Base, engine
from .teacher import Teacher
from .student import Student
from .course import Course
from .student_courses import StudentCourse
from .grade import StudentGrade

# 更新数据库表
Base.metadata.create_all(bind=engine)

# 更新导出的模型名称
__all__ = ['Teacher', 'Student', 'Course', 'StudentCourse', 'StudentGrade'] 