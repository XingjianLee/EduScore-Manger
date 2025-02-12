from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

# 加载.env文件
load_dotenv()

def get_allowed_origins() -> List[str]:
    origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080,http://127.0.0.1:8080")
    return [origin.strip() for origin in origins.split(",") if origin.strip()]

class Settings(BaseSettings):
    # 数据库配置
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    DB_USER: str = os.getenv("DB_USER")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD")
    DB_HOST: str = os.getenv("DB_HOST")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_NAME: str = os.getenv("DB_NAME")

    # OpenAI配置
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL")

    # JWT配置
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    # 服务器配置
    SERVER_HOST: str = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT: int = int(os.getenv("SERVER_PORT", "8001"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # CORS配置
    ALLOWED_ORIGINS: List[str] = get_allowed_origins()

    # 成绩权重配置
    DAILY_SCORE_WEIGHT: float = float(os.getenv("DAILY_SCORE_WEIGHT", "0.4"))
    EXAM_SCORE_WEIGHT: float = float(os.getenv("EXAM_SCORE_WEIGHT", "0.6"))

    class Config:
        env_file = ".env"

settings = Settings() 