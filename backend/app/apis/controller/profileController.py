from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...models.teacher import Teacher
from ...core.database import get_db
from typing import Dict
from passlib.context import CryptContext
from pydantic import BaseModel

# 添加请求模型
class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/teacher/{teacher_id}")
async def get_teacher_profile(teacher_id: int, db: Session = Depends(get_db)) -> Dict:
    teacher = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="教师不存在"
        )
    
    return {
        "status": "success",
        "data": {
            "name": teacher.name,
            "email": teacher.email,
            "university": teacher.university,
            "college": teacher.college,
            "account": teacher.account
        }
    }

@router.put("/password/{teacher_id}")
async def update_password(
    teacher_id: int,
    password_data: PasswordUpdate,  # 使用请求模型
    db: Session = Depends(get_db)
) -> Dict:
    teacher = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="教师不存在"
        )
    
    # 验证当前密码
    if teacher.password != password_data.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前密码错误"
        )
    
    # 更新密码
    teacher.password = password_data.new_password
    db.commit()
    
    return {
        "status": "success",
        "message": "密码更新成功"
    } 