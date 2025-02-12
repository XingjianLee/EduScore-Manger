from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from ...models.teacher import Teacher
from ...models.user import UserLogin, UserRegister, UserResponse
from ...core.database import get_db
from typing import Dict

router = APIRouter()

@router.post("/login")
async def login(user_data: UserLogin, db: Session = Depends(get_db)) -> Dict:
    try:
        # 查询教师
        teacher = db.query(Teacher).filter(Teacher.account == user_data.email).first()
        
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户不存在"
            )
        
        # 验证密码
        if teacher.password != user_data.password:  # 实际应用中应该使用加密密码
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="密码错误"
            )
        
        return {
            "status": "success",
            "message": "登录成功",
            "data": {
                "id": teacher.teacher_id,
                "email": teacher.email,
                "name": teacher.name,
                "university": teacher.university or "",
                "college": teacher.college or ""
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )

@router.post("/register")
async def register(user_data: UserRegister, db: Session = Depends(get_db)) -> Dict:
    # 检查账号是否已存在
    existing_teacher = db.query(Teacher).filter(
        (Teacher.account == user_data.email) | (Teacher.email == user_data.email)
    ).first()
    
    if existing_teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已被注册"
        )
    
    # 验证验证码
    if user_data.verification_code != "123456":  # 这里应该验证真实的验证码
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误"
        )
    
    # 创建新教师（使用原始密码）
    new_teacher = Teacher(
        account=user_data.email,
        email=user_data.email,
        password=user_data.password,  # 直接存储原始密码
        name=user_data.email.split('@')[0],
        university=user_data.school_name
    )
    
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    
    return {
        "status": "success",
        "message": "注册成功",
        "data": UserResponse(
            id=new_teacher.teacher_id,
            email=new_teacher.email,
            school_name=new_teacher.university or ""
        )
    }

@router.post("/send-verification-code")
async def send_verification_code(email: str) -> Dict:
    return {
        "status": "success",
        "message": "验证码已发送",
    }
