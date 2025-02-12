from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from .apis.api_router import router

app = FastAPI()

# 添加 CORS 中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],  # 允许的源
    allow_credentials=True,
    allow_methods=["*"],  # 允许的 HTTP 方法
    allow_headers=["*"],  # 允许的 HTTP 头
    expose_headers=["*"],
)

# 注册总路由
app.include_router(router, prefix="/api")


def start_uvicorn():
    uvicorn.run(app, host="127.0.0.1", port=8001)