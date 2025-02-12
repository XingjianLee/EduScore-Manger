from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class Teacher(Base):
    __tablename__ = "teachers"
    
    teacher_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    account = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    name = Column(String(50), nullable=False)
    university = Column(String(100))
    college = Column(String(100))
    email = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 定义关系
    courses = relationship("Course", back_populates="teacher", cascade="all, delete-orphan") 