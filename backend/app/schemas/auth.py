from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    teacher_id: int | None = None

class Login(BaseModel):
    account: str
    password: str 