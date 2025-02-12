from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class TeacherBase(BaseModel):
    account: str
    name: str
    university: Optional[str] = None
    college: Optional[str] = None
    email: EmailStr

class TeacherCreate(TeacherBase):
    password: str

class TeacherUpdate(TeacherBase):
    account: Optional[str] = None
    name: Optional[str] = None
    password: Optional[str] = None
    email: Optional[EmailStr] = None

class TeacherResponse(TeacherBase):
    teacher_id: int
    created_at: datetime

    class Config:
        from_attributes = True 