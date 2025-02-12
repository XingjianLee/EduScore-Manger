from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class StudentBase(BaseModel):
    name: str
    college: Optional[str] = None
    major: Optional[str] = None
    class_: Optional[str] = None
    phone: str

class StudentCreate(StudentBase):
    pass

class StudentUpdate(StudentBase):
    name: Optional[str] = None
    phone: Optional[str] = None

class StudentResponse(StudentBase):
    student_id: int
    created_at: datetime

    class Config:
        from_attributes = True 