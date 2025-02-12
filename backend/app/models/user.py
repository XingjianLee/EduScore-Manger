from pydantic import BaseModel, EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    school_name: str
    verification_code: str

class UserResponse(BaseModel):
    id: int
    email: str
    school_name: str 